import { Format } from '../../core/src/Format';
import JWEditor, { ExecutionContext } from '../../core/src/JWEditor';
import { Modifier } from '../../core/src/Modifier';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { Parser } from '../../plugin-parser/src/Parser';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { removeFormattingSpace } from '../../utils/src/formattingSpace';
import { DomMutationParsingEngine } from './MutationParsingEngine';

export type GetNodesFn = (domNode: Node) => VNode[] | undefined;
type GetFormatFn = (domNode: Node) => Format;

// todo: Move withDomMutation in the plugin rather than setting a global
// variable.
const activeObservers = new Map<Node, MutationObserver>();

/**
 * Observe the mutations of `node` and replicate them in the VDocument.
 *
 * Current limitations:
 *
 * - If there is a textNode that exist in the Dom but not in our Document and
 *   there is a change that have that textNode withing two HTMLElement, the
 *   characterData mutation will be wrongly interpreted as we calculate the text
 *   offset relative to a HTMLElementNode.
 * - When adding a class in outside the mutationTransaction and a single class
 *   is added within, we add all the classes.
 * - Do not handle the mutation of multiples textNode added/removed or used as
 *   reference.
 *   - The textNode are currently destroyed by the ReconciliationEngine, which
 *     means we loose the reference between two mutations.
 * - Do not handle the mutation of charData if there is textNode in the DOM but
 *   not in VDOC between the textNode that trigger the CharData and the first
 *   previousSibling that is wether an element or undefined
 */
export async function withDomMutations<T>(
    editor: JWEditor,
    node: HTMLElement,
    callback: (...args) => T,
    context: ExecutionContext = editor,
): Promise<T> {
    const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
    const parser = editor.plugins.get(Parser);

    if (activeObservers.size) {
        for (const [observationNode, observer] of activeObservers.entries()) {
            const ancestors: Node[] = getAncestors(node).concat([node]);
            // If a parent is alread observed, the mutations will be handeled by
            // his own observer.
            if (ancestors.includes(observationNode)) {
                let result: T;
                await context.execCommand(async context => {
                    result = await callback(context);
                });
                return result;
            }
            const ancestorsObservation: Node[] = getAncestors(observationNode);
            if (ancestorsObservation.includes(node)) {
                // Disconnect and remove the previous observation as the
                // mutation will be included in the newly created observer.
                observer.disconnect();
                activeObservers.delete(observationNode);
                break;
            }
        }
    }

    let result: T;

    const withDomMutations = async (subContext): Promise<void> => {
        const originalParents = new Map<Node, Node[]>();
        const stack: Node[] = [node];
        let currentNode: Node;

        // Save the state at one point in time of all the ancestors for `node` and all
        // it's descendants into a map.
        originalParents.set(node, [...getAncestors(node)]);
        while ((currentNode = stack.shift())) {
            const ancestors = [currentNode, ...getAncestors(currentNode)];
            for (const child of currentNode.childNodes) {
                originalParents.set(child, [...ancestors]);
                stack.push(child);
            }
        }

        // Map a vnode that has been removed to the node that replace it.
        const replacementMap = new Map<VNode, VNode>();
        const charDataChanged = new Set<Node>();

        const getFirstFormat: GetFormatFn = (domNode: Node): Format | undefined => {
            return getFormats(domEngine, domNode)?.[0];
        };
        const getVNodes: GetNodesFn = (domNode: Node): VNode[] | undefined => {
            const vnodes = domEngine.getNodes(domNode, false);
            const currentNodes =
                vnodes &&
                vnodes
                    // If a not has been remplated, take that one.
                    .map(vnode => (replacementMap.get(vnode) ? replacementMap.get(vnode) : vnode));
            const uniqueCurrentNodes = vnodes && [...new Set(currentNodes)];
            return uniqueCurrentNodes;
        };

        const removedNodes = new Set<Node>();
        // Map the addedNodes with the key being the parent and the value being
        // the modified childrens.
        const addedNodes = new Map<Node, Node[]>();

        const observer = new MutationObserver(async (mutations: MutationRecord[]) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes') {
                    const formats = getFormats(domEngine, mutation.target);
                    let vnodesOrFormats =
                        (formats?.length && formats) || domEngine.getNodes(mutation.target, false);

                    const value = (mutation.target as HTMLElement).getAttribute(
                        mutation.attributeName,
                    );

                    if (vnodesOrFormats.length) {
                        if (vnodesOrFormats[0] instanceof ContainerNode) {
                            // Only add the attribute on the first container as
                            // getNodes can return a list of containers.
                            vnodesOrFormats = [vnodesOrFormats[0]];
                        }
                        // However, if vnodeOrFormat is a list of inlineNodes
                        // (e.g. CharNodes[]), or a list of formats, add the
                        // attribute on all of them.
                        for (const vnodeOrFormat of vnodesOrFormats) {
                            const attributes = vnodeOrFormat.modifiers.get(Attributes);
                            attributes.set(mutation.attributeName, value);
                        }
                    }
                } else if (mutation.type === 'childList') {
                    for (const addedNode of mutation.addedNodes) {
                        const addedChildren = addedNodes.get(mutation.target) || [];
                        addedChildren.push(addedNode);
                        addedNodes.set(mutation.target, addedChildren);
                    }
                    for (const removedNode of mutation.removedNodes) {
                        removedNodes.add(removedNode);
                    }
                } else if (mutation.type === 'characterData') {
                    charDataChanged.add(mutation.target);
                }
            }
        });

        observer.observe(node, {
            attributes: true,
            characterData: true, // Monitor text content changes.
            characterDataOldValue: true,
            childList: true, // Monitor child nodes addition or removal.
            subtree: true, // Extend monitoring to all children of the target.
        });

        activeObservers.set(node, observer);
        result = await callback(subContext);

        // ---------------------------------------------------------------------
        // Process mutations in 3 steps
        // ---------------------------------------------------------------------

        // 1) Handle charData.
        for (const charDomNode of charDataChanged) {
            const targetVNodes = getVNodes(charDomNode);
            const originalModifiers = targetVNodes[0].modifiers;

            const text = removeFormattingSpace(charDomNode);
            const vnodeToInsert = await parser.parse('text/html', text);
            for (const vnode of vnodeToInsert) {
                vnode.modifiers.prepend(...originalModifiers);
                targetVNodes[0].before(vnode);
            }
            for (const targetVNode of targetVNodes) {
                targetVNode.remove();
            }
        }

        // 2) Remove the nodes.
        removeNodes(originalParents, removedNodes, getVNodes, getFirstFormat, replacementMap);

        // 3) Add the nodes.
        for (const childs of addedNodes.values()) {
            await addVNodes(childs, originalParents, getVNodes, getFirstFormat, parser, domEngine);
        }

        // ---------------------------------------------------------------------
        // Process mutation finish... Well done my friend.
        // ---------------------------------------------------------------------

        for (const [observerNode, activeObservation] of activeObservers.entries()) {
            // The observation might have been already removed by another call
            // so we only delete and disconnect when it's still active.
            if (activeObservation === observer) {
                activeObservers.delete(observerNode);
                observer.disconnect();
                break;
            }
        }
    };

    await context.execCommand(withDomMutations);

    return result;
}

/**
 * Retrieve list of modifiers for a node that have similar formats.
 *
 * For example, if we have an html like:
 *
 * <b><b><b>ab</b></b></b>
 *
 * - If we want to retrieve the modifier of the textNode (ab), it will give all
 *   the modifiers.
 * - If we want to retrieve the modifiers of third node `<b>`, it will return
 *   two Format modifier `<b>` and their corresponding modifiers (e.g.
 *   Attributes).
 */
function getParentModifiers(
    inlineNode: InlineNode,
    ancestors: Node[],
    getFormat: GetFormatFn,
    getVNodes: GetNodesFn,
): Modifier[] {
    if (!ancestors.length) return [];

    const ancestorsFormats: Format[] = [];

    // Get the Format of all inline ancestors until a container.
    for (const ancestor of ancestors) {
        const format = getFormat(ancestor);
        if (!format) break;
        ancestorsFormats.push(format);
    }

    const greatestAncestorVNode = getVNodes(ancestors[0]);
    const allParentFormat = greatestAncestorVNode[0].modifiers.filter(m => m instanceof Format);

    // Now we can retrieve the format of `inlineNode`.
    const inlineNodeFormat = allParentFormat[ancestorsFormats.length - 1];

    // When we find the proper format, aggregate other modifier until another
    // format.
    let breakNextFormat = false;
    const modifiers = (greatestAncestorVNode[0] && [...greatestAncestorVNode[0].modifiers]) || [];
    const inlineModifiers = [...inlineNode.modifiers];
    const parentModifiers: Modifier[] = [];

    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        if (breakNextFormat && modifier instanceof Format) break;
        if (modifier === inlineNodeFormat) breakNextFormat = true;
        // Get the modifiers from the inline itself to get the reference of the
        // inline modifiers.
        parentModifiers.push(inlineModifiers[i]);
    }

    return parentModifiers;
}

/**
 *  Get all the ancestors of `node`.
 */
function getAncestors(node: Node): HTMLElement[] {
    const nodes = [];
    let parent = node;
    while ((parent = parent.parentElement)) {
        nodes.push(parent);
    }
    return nodes;
}

/**
 * Get all the formats for a node.
 */
function getFormats(domEngine: DomLayoutEngine, domNode: Node): Format[] {
    const modifiers: Modifier[] = domEngine.getModifiers(domNode);
    return modifiers?.filter(x => x instanceof Format) as Format[];
}

/**
 * Add all the nodes in the VDocument.
 */
async function addVNodes(
    addedDomNodes: Node[],
    initialParents: Map<Node, Node[]>,
    getVNodes: GetNodesFn,
    getFirstFormat: GetFormatFn,
    parser: Parser,
    domEngine: DomLayoutEngine,
): Promise<void> {
    for (const addedDomNode of addedDomNodes) {
        const parentVNode = getVNodes(addedDomNode.parentElement)?.[0];
        // Only add when a parent VNode is found.
        if (parentVNode) {
            domEngine.markForRedraw([addedDomNode]);
            let vnodesToInsert = getVNodes(addedDomNode);
            if (!vnodesToInsert.length) {
                // todo: Change this ugly api for providing a `getVNode`
                // function through a parsing option rather than the following
                // expression.
                const engine = parser.engines['mutation/html'] as DomMutationParsingEngine;
                vnodesToInsert = await engine.parseWithOptions([addedDomNode as HTMLElement], {
                    getVNodes,
                });
            }
            // Try to locate a previous sibling VNode.
            let previousSibling: Node = addedDomNode;
            let previousSiblingVNode: VNode;
            let nextSiblingVNode: VNode;
            while (!previousSiblingVNode && (previousSibling = previousSibling.previousSibling)) {
                const siblingVNodes = getVNodes(previousSibling);
                // In case the siblingVNodes are text, we need the last letter.
                previousSiblingVNode = siblingVNodes[siblingVNodes.length - 1];
            }

            let nextSibling = addedDomNode;
            while (!nextSiblingVNode && (nextSibling = nextSibling.nextSibling)) {
                nextSiblingVNode = getVNodes(nextSibling)[0];
            }
            const siblingVNode = previousSiblingVNode || nextSiblingVNode;

            if (siblingVNode) {
                const sortedNodes = previousSiblingVNode
                    ? [...vnodesToInsert].reverse()
                    : vnodesToInsert;
                const modifiers = getParentModifiers(
                    siblingVNode as InlineNode,
                    initialParents.get(previousSibling || nextSibling) || [],
                    getFirstFormat,
                    getVNodes,
                ).map(m => m.clone());
                for (const vnode of sortedNodes) {
                    // parentVNode could be an InlineNode because the dom Node
                    // is represented by a Format.
                    if (parentVNode instanceof InlineNode) {
                        vnode.modifiers.prepend(...modifiers);
                    }
                    if (previousSiblingVNode) {
                        previousSiblingVNode.after(vnode);
                    } else {
                        nextSiblingVNode.before(vnode);
                    }
                }
            } else {
                // As we havent found the previous sibling VNode, try to locate
                // a next sibling VNode.
                if (parentVNode instanceof InlineNode && parentVNode.length === 0) {
                    for (const vnode of vnodesToInsert) {
                        for (const modifier of parentVNode.modifiers) {
                            vnode.modifiers.prepend(modifier);
                        }
                        parentVNode.before(vnode);
                    }
                    // If there were node to insert, remove the inline
                    // InlineNode that represented the empty Format.
                    if (vnodesToInsert) parentVNode.remove();
                } else {
                    for (const vnode of vnodesToInsert) {
                        parentVNode.append(vnode);
                    }
                }
            }
        }
    }
}

/**
 * Remove all the nodes in the VDocument.
 */
function removeNodes(
    originalParents: Map<Node, Node[]>,
    removedDomNodes: Set<Node>,
    getVNode: GetNodesFn,
    getFirstFormat: GetFormatFn,
    replacementMap: Map<VNode, VNode>,
): void {
    for (const removedDomNode of removedDomNodes) {
        const removedVNodes = getVNode(removedDomNode);
        if (removedVNodes) {
            const firstVNode = removedVNodes[0];
            // If we remove a text node that has a format, as no textnode will
            // represent the format after removing it, we need to insert an
            // InlineNode of length 0 with the cloned format.
            let emptyInline: InlineNode;
            if (
                removedDomNode.nodeType === Node.TEXT_NODE &&
                firstVNode.modifiers.filter(Format).length
            ) {
                // todo: Clean emptyInlineNode if it's not the only one in
                // container
                emptyInline = new InlineNode();
                emptyInline.modifiers = firstVNode.modifiers.clone();
                firstVNode.before(emptyInline);
            }
            for (const vnode of removedVNodes) {
                if (vnode instanceof InlineNode) {
                    const modifiers = getParentModifiers(
                        vnode,
                        originalParents.get(removedDomNode) || [],
                        getFirstFormat,
                        getVNode,
                    );
                    // We might add back the vnode later from the cache. In
                    // that case, we must remove it's original parents
                    // modifiers.
                    for (const modifier of modifiers) {
                        vnode.modifiers.remove(modifier);
                    }
                }
                replacementMap.set(vnode, emptyInline);
                vnode.remove();
            }
        }
    }
}
