import { VDocumentMap } from '../core/src/VDocumentMap';
import { VDocument } from '../core/src/VDocument';
import { VNode, RelativePosition, Predicate } from '../core/src/VNodes/VNode';
import { VSelection, Direction } from '../core/src/VSelection';
import { VElement } from '../core/src/VNodes/VElement';
import { RenderingFunctions } from '../core/src/RenderManager';
import JWEditor from '../core/src/JWEditor';

export type RenderingDOMFunction = (
    currentContext: DomRenderingContext,
) => [DomRenderingContext, DomRenderingMap];

export interface DomRenderingContext {
    vDocumentMap: VDocumentMap; // Mapping between vNodes and Nodes
    root: VNode; // Root VNode of the current rendering.
    currentNode?: VNode; // Current VNode rendered at this step.
    parentNode?: Node | DocumentFragment; // Node to render the VNode into.
}
export type DomRenderingMap = Map<Node, VNode[]>;

export class DomRenderer {
    _contextStack: DomRenderingContext[] = [];
    _renderingFunctions: RenderingFunctions;

    constructor(editor: JWEditor) {
        this._renderingFunctions = editor.renderManager.getRenderer('dom');
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Render the contents of a root VNode into a given target element.
     *
     * @param root
     * @param target
     */
    render(vDocumentMap: VDocumentMap, content: VDocument | VNode, target: Element): void {
        const root = content instanceof VDocument ? content.root : content;
        if (content instanceof VDocument) {
            // TODO: the map should be on the VDocument.
            vDocumentMap.clear(); // TODO: update instead of recreate
            const fragment = document.createDocumentFragment();
            vDocumentMap.set(root, fragment);
            target.innerHTML = ''; // TODO: update instead of recreate
        }

        // Don't render `root` itself if already rendered, render its children.
        const renderedRoot = vDocumentMap.toDom(root);
        const parentNode = renderedRoot ? renderedRoot : target;
        const firstVNode = renderedRoot ? root.firstChild() : root;
        const rootContext: DomRenderingContext = {
            vDocumentMap: vDocumentMap,
            root: root,
            currentNode: firstVNode,
            parentNode: parentNode,
        };
        this._contextStack.push(rootContext);

        if (root.hasChildren()) {
            let currentContext: DomRenderingContext = { ...rootContext };
            do {
                currentContext = this._renderOne(currentContext);
            } while ((currentContext = this._nextRenderingContext(currentContext)));
        }

        if (content instanceof VDocument) {
            // Append the fragment corresponding to the VDocument to `target`.
            target.appendChild(renderedRoot);
            vDocumentMap.set(root, target);
        }
    }
    /**
     * Render the element matching the current vNode and append it.
     *
     * @param context
     */
    renderNode(context: DomRenderingContext): [DomRenderingContext, DomRenderingMap] {
        const node = context.currentNode;

        for (const renderingFunction of this._renderingFunctions) {
            const renderingResult = renderingFunction({ ...context });
            if (renderingResult) {
                context = renderingResult[0];
                if (renderingResult[1]) {
                    return renderingResult;
                }
            }
        }

        const tagName = node.is(VElement) ? node.htmlTag : 'UNKNOWN-NODE';
        const fragment = document.createDocumentFragment();
        const renderedDomNodes: Node[] = [];
        const renderedElement = document.createElement(tagName);
        renderedDomNodes.push(renderedElement);
        fragment.appendChild(renderedElement);

        // If a node is empty but could accomodate children,
        // fill it to make it visible.
        if (!node.hasChildren() && !node.atomic) {
            const placeholderBr = document.createElement('BR');
            renderedElement.appendChild(placeholderBr);
            renderedDomNodes.push(placeholderBr);
        }

        context.parentNode.appendChild(fragment);

        const renderingMap: DomRenderingMap = new Map(
            renderedDomNodes.map(domNode => {
                return [domNode, [node]];
            }),
        );
        return [context, renderingMap];
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Render a VNode and trigger the rendering of the next one, recursively.
     *
     * @param context
     */
    _renderOne(context: DomRenderingContext): DomRenderingContext {
        let renderingMap: DomRenderingMap;
        [context, renderingMap] = this.renderNode({ ...context });

        // Map the parsed nodes to the DOM nodes they represent.
        renderingMap.forEach((nodes: VNode[], domNode: Node) => {
            nodes.forEach((node: VNode, index: number) => {
                context.vDocumentMap.set(node, domNode, index);
            });
        });

        return context;
    }
    /**
     * Return the next rendering context, based on the given context. This
     * includes the next VNode to render and the next parent element to render
     * it into.
     *
     * @param currentContext
     */
    _nextRenderingContext(currentContext: DomRenderingContext): DomRenderingContext {
        const node = currentContext.currentNode;
        if (node.hasChildren()) {
            currentContext.currentNode = node.firstChild();
            // Render the first child with the current node as parent.
            const renderedParent = currentContext.vDocumentMap.toDom(node);
            if (renderedParent) {
                currentContext.parentNode = renderedParent;
            }
            this._contextStack.push({ ...currentContext });
        } else if (node.nextSibling()) {
            // Render the siblings of the current node with the same parent.
            this._contextStack[this._contextStack.length - 1].currentNode = node.nextSibling();
        } else {
            // Render the next ancestor sibling in the ancestor tree.
            let ancestor = node;
            // Climb up the ancestor tree to the first parent having a sibling.
            while (ancestor && !ancestor.nextSibling() && ancestor != currentContext.root) {
                ancestor = ancestor.parent;
                this._contextStack.pop();
            }
            if (ancestor && ancestor != currentContext.root) {
                // At this point, the found ancestor has a sibling.
                this._contextStack[
                    this._contextStack.length - 1
                ].currentNode = ancestor.nextSibling();
            } else {
                // If no next ancestor having a sibling could be found then the
                // tree has been fully rendered.
                return;
            }
        }
        return this._contextStack[this._contextStack.length - 1];
    }
    /**
     * Return whether the current VNode of the given rendering context matches
     * the given predicate.
     *
     * @param context
     * @param predicate
     */
    _match<T extends VNode>(
        context: DomRenderingContext,
        predicate: Predicate<T>,
    ): context is DomRenderingContext {
        return context.currentNode.test(predicate);
    }
}
