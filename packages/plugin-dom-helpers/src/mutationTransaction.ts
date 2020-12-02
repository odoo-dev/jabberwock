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

interface Observation {
    node: Node;
    observer: MutationObserver;
}
type GetNodesFn = (domNode: Node) => VNode[] | undefined;
type GetFormatFn = (domNode: Node) => Format;

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

    // get the Format of all inline ancestors until a container
    for (const ancestor of ancestors) {
        const format = getFormat(ancestor);
        if (!format) break;
        ancestorsFormats.push(format);
    }

    const greatestAncestorVNode = getVNodes(ancestors[0]);
    const allParentFormat = greatestAncestorVNode[0].modifiers.filter(m => m instanceof Format);

    // now we can retrieve the format of `inlineNode`
    const inlineNodeFormat = allParentFormat[ancestorsFormats.length - 1];

    // when we find the proper format, aggregate other modifier until another
    // format
    let breakNextFormat = false;
    const modifiers = (greatestAncestorVNode[0] && [...greatestAncestorVNode[0].modifiers]) || [];
    const inlineModifiers = [...inlineNode.modifiers];
    const parentModifiers: Modifier[] = [];

    for (let i = 0; i < modifiers.length; i++) {
        const modifier = modifiers[i];
        if (breakNextFormat && modifier instanceof Format) break;
        if (modifier === inlineNodeFormat) breakNextFormat = true;
        // get the modifiers from the inline itself to get the reference of the
        // inline modifiers.
        parentModifiers.push(inlineModifiers[i]);
    }

    return parentModifiers;
}

/**
 * Check is a node is contained in the document.
 */
function isInDocument(node: Node): boolean {
    return document.body.contains(node);
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
 * Get all parent of a node recursively.
 */
function getOriginalParents(node: Node, map?: Map<Node, Node[]>): Map<Node, Node[]> {
    map = map || new Map<Node, Node[]>();
    map.set(node, [...getAncestors(node)]);
    for (const child of node.childNodes) {
        getOriginalParents(child, map);
    }
    return map;
}

/**
 * Get all the formats for a node.
 */
function getFormats(domEngine: DomLayoutEngine, domNode: Node): Format[] {
    const modifiers = domEngine.getModifier(domNode);
    const formats = modifiers && (modifiers.filter(x => x instanceof Format) as Format[]);
    return formats;
}

/**
 * Add all the nodes in the VDOCUMENT.
 */
async function addNodes(
    addedNodes: Node[],
    initialParents: Map<Node, Node[]>,
    getVNode: GetNodesFn,
    getFirstFormat: GetFormatFn,
    parser: Parser,
    domEngine: DomLayoutEngine,
): Promise<void> {
    for (const addedNode of addedNodes) {
        const parentVNode = getVNode(addedNode.parentElement)?.[0];
        // only add when a parent VNode is found
        if (parentVNode) {
            domEngine.markForRedraw(new Set([addedNode]));
            let vnodesToInsert = getVNode(addedNode);
            if (!vnodesToInsert.length) {
                // todo: change this ugly api for providing a `getVNode`
                // function through a parsing option rather than the following
                // expression.
                (parser.engines['mutation/html'] as DomMutationParsingEngine).getNode = getVNode;
                vnodesToInsert = await parser.parse('mutation/html', addedNode);
            }
            // try to locate a previous sibling VNode
            let sibling: Node = addedNode;
            let siblingVNode: VNode;
            while (!siblingVNode && (sibling = sibling.previousSibling)) {
                const siblingVNodes = getVNode(sibling);
                // in case the siblingVNodes are text, we need the last letter
                siblingVNode = siblingVNodes[siblingVNodes.length - 1];
            }
            if (siblingVNode) {
                const modifiers = getParentModifiers(
                    siblingVNode as InlineNode,
                    initialParents.get(sibling) || [],
                    getFirstFormat,
                    getVNode,
                ).map(m => m.clone());
                for (const vnode of [...vnodesToInsert].reverse()) {
                    if (parentVNode instanceof InlineNode) {
                        for (const modifier of modifiers) {
                            vnode.modifiers.prepend(modifier.clone());
                        }
                    }
                    siblingVNode.after(vnode);
                }
            } else {
                // As we havent found the previous sibling
                // VNode, try to locate a next sibling VNode
                sibling = addedNode;
                while (!siblingVNode && (sibling = sibling.nextSibling)) {
                    siblingVNode = domEngine.getNodes(sibling)?.[0];
                }
                if (siblingVNode) {
                    const modifiers = getParentModifiers(
                        siblingVNode as InlineNode,
                        initialParents.get(sibling) || [],
                        getFirstFormat,
                        getVNode,
                    ).map(m => m.clone());
                    for (const vnode of vnodesToInsert) {
                        if (parentVNode instanceof InlineNode) {
                            for (const modifier of modifiers) {
                                vnode.modifiers.prepend(modifier.clone());
                            }
                        }
                        siblingVNode.before(vnode);
                    }
                } else {
                    if (parentVNode instanceof InlineNode && parentVNode.length === 0) {
                        for (const vnode of vnodesToInsert) {
                            for (const modifier of parentVNode.modifiers) {
                                vnode.modifiers.prepend(modifier);
                            }
                            parentVNode.before(vnode);
                        }
                        // If there were node to insert, remove the inline InlineNode
                        // that represented the empty Format
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
}

/**
 * Remove all the nodes in the VDOCUMENT.
 */
function removeNodes(
    originalParents: Map<Node, Node[]>,
    removedNodes: Set<Node>,
    getVNode: GetNodesFn,
    getFirstFormat: GetFormatFn,
    replacementMap: Map<VNode, VNode>,
): void {
    for (const removedNode of removedNodes) {
        const removedVNodes = getVNode(removedNode);
        if (removedVNodes) {
            const firstVNode = removedVNodes[0];
            // If we remove a text node that has a
            // format, as no textnode will represent the
            // format after removing it, we need to
            // insert an InlineNode of length 0 with the
            // cloned format.
            let emptyInline: InlineNode;
            if (
                removedNode.nodeType === Node.TEXT_NODE &&
                firstVNode.modifiers.filter(m => m instanceof Format).length
            ) {
                // todo: clean emptyInlineNode if it's not the only one in container
                emptyInline = new InlineNode();
                emptyInline.modifiers = firstVNode.modifiers.clone();
                firstVNode.before(emptyInline);
            }
            for (const vnode of removedVNodes) {
                if (vnode instanceof InlineNode) {
                    const modifiers = getParentModifiers(
                        vnode,
                        originalParents.get(removedNode) || [],
                        getFirstFormat,
                        getVNode,
                    );
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

// todo: move withDomMutation in the plugin rather than setting a global
// variable.
const currentObservations: Observation[] = [];

/**
 * Observe the mutations of `node` and replicate them in the VDOCUMENT.
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
export async function withDomMutation<T>(
    editor: JWEditor,
    node: HTMLElement,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    callback: (...args: any[]) => T,
    context: ExecutionContext = editor,
): Promise<T> {
    const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
    const parserPlugin = editor.plugins.get(Parser);

    // if there is already an observation
    if (currentObservations.length) {
        for (let i = 0; i < currentObservations.length; i++) {
            const observation = currentObservations[i];
            const ancestors: Node[] = getAncestors(node).concat([node]);
            // if a parent is alread observed, the mutations will be handeled by
            // his own observer.
            if (ancestors.includes(observation.node)) {
                let result: T;
                await context.execCommand(async context => {
                    result = await callback(context);
                });
                return result;
            }
            const ancestorsObservation: Node[] = getAncestors(observation.node);
            if (ancestorsObservation.includes(node)) {
                // disconnect and remove the previous observation as the
                // mutation will be included in the newly created observer.
                observation.observer.disconnect();
                currentObservations.splice(i, 1);
                break;
            }
        }
    }

    let result: T;

    await context.execCommand(async subContext => {
        const originalParents = getOriginalParents(node);

        // map a vnode that has been removed to the node that replace it.
        const replacementMap = new Map<VNode, VNode>();
        const charDataChanged = new Set<Node>();

        const getFirstFormat: GetFormatFn = (domNode: Node): Format => {
            const formats = getFormats(domEngine, domNode);
            return formats && formats[0];
        };
        const getVNodes: GetNodesFn = (domNode: Node): VNode[] | undefined => {
            const vnodes = domEngine.getNodes2(domNode);
            const currentNodes =
                vnodes &&
                vnodes
                    // if a not has been remplated, take that one
                    .map(vnode => (replacementMap.get(vnode) ? replacementMap.get(vnode) : vnode));
            const uniqueCurrentNodes = vnodes && [...new Set(currentNodes)];
            return uniqueCurrentNodes;
        };

        const removedNodes = new Set<Node>();
        // map the addedNodes with the key being the parent and the value being
        // the modified childrens.
        const addedNodes = new Map<Node, Node[]>();

        const observer = new MutationObserver(async (mutations: MutationRecord[]) => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes') {
                    const formats = getFormats(domEngine, mutation.target);
                    let vnodesOrFormats =
                        (formats && formats.length && formats) ||
                        domEngine.getNodes(mutation.target);

                    const value = (mutation.target as HTMLElement).getAttribute(
                        mutation.attributeName,
                    );

                    if (vnodesOrFormats.length) {
                        if (vnodesOrFormats[0] instanceof ContainerNode) {
                            // only add the attribute on the first
                            // container than multiples containers.
                            vnodesOrFormats = [vnodesOrFormats[0]];
                        }
                        for (const vnodeOrFormat of vnodesOrFormats) {
                            const attributes = vnodeOrFormat.modifiers.get(Attributes);
                            attributes.set(mutation.attributeName, value);
                        }
                    }
                } else if (mutation.type === 'childList') {
                    for (const addedNode of mutation.addedNodes) {
                        if (!addedNodes.get(mutation.target)) {
                            addedNodes.set(mutation.target, [addedNode]);
                        } else {
                            addedNodes.get(mutation.target).push(addedNode);
                        }
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
            characterData: true, // monitor text content changes
            characterDataOldValue: true,
            attributeOldValue: true,
            childList: true, // monitor child nodes addition or removal
            subtree: true, // extend monitoring to all children of the target
        });

        const observation: Observation = {
            node,
            observer,
        };
        currentObservations.push(observation);
        result = await callback(subContext);

        // ---------------------------------------------------------------------
        // Process mutations in 3 steps
        // ---------------------------------------------------------------------

        // 1) handle charData
        for (const charNode of charDataChanged) {
            const targetNodes = getVNodes(charNode);
            const originalModifiers = targetNodes[0].modifiers;

            const text = removeFormattingSpace(charNode);
            const vnodeToInsert = await parserPlugin.parse('text/html', text);
            for (const vnode of vnodeToInsert) {
                for (const modifier of [...originalModifiers].reverse()) {
                    vnode.modifiers.prepend(modifier);
                }
                targetNodes[0].before(vnode);
            }
            for (const targetNode of targetNodes) {
                targetNode.remove();
            }
        }

        // 2) Remove the nodes
        removeNodes(originalParents, removedNodes, getVNodes, getFirstFormat, replacementMap);

        // 3) Add the nodes
        for (const childs of addedNodes.values()) {
            await addNodes(
                childs,
                originalParents,
                getVNodes,
                getFirstFormat,
                parserPlugin,
                domEngine,
            );
        }

        // ---------------------------------------------------------------------
        // Process mutation finish... Well done my friend.
        // ---------------------------------------------------------------------

        const index = currentObservations.indexOf(observation);

        // the observation might have been already removed by another call
        if (index !== -1) {
            currentObservations.splice(index, 1);
        }
        observer.disconnect();
    });

    return result;
}
