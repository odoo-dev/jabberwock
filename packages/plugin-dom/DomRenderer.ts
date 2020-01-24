import { Renderer } from '../core/src/Renderer';
import { VDocumentMap } from '../core/src/VDocumentMap';
import { VDocument } from '../core/src/VDocument';
import { VNode, RelativePosition, Predicate } from '../core/src/VNodes/VNode';
import { VSelection, Direction } from '../core/src/VSelection';
import { VElement } from '../core/src/VNodes/VElement';

export interface DomRenderingContext {
    root: VNode; // Root VNode of the current rendering.
    currentVNode?: VNode; // Current VNode rendered at this step.
    parentNode?: Node | DocumentFragment; // Node to render the VNode into.
}
export type DomRenderingMap = Map<Node, VNode[]>;

export class DomRenderer extends Renderer<
    DomRenderingContext,
    [DomRenderingContext, DomRenderingMap]
> {
    readonly id = 'dom';

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Render the contents of a root VNode into a given target element.
     *
     * @param root
     * @param target
     */
    render(content: VDocument | VNode, target: Element): void {
        const root = content instanceof VDocument ? content.root : content;
        if (content instanceof VDocument) {
            // TODO: the map should be on the VDocument.
            VDocumentMap.clear(); // TODO: update instead of recreate
            const fragment = document.createDocumentFragment();
            VDocumentMap.set(root, fragment);
            target.innerHTML = ''; // TODO: update instead of recreate
        }

        // Don't render `root` itself if already rendered, render its children.
        const renderedRoot = VDocumentMap.toDom(root);
        const parentNode = renderedRoot ? renderedRoot : target;
        const firstVNode = renderedRoot ? root.firstChild() : root;

        if (root.hasChildren()) {
            let context: DomRenderingContext = {
                root: root,
                currentVNode: firstVNode,
                parentNode: parentNode,
            };
            do {
                context = this._renderNode(context);
            } while ((context = this._nextRenderingContext(context)));
        }

        if (content instanceof VDocument) {
            // Append the fragment corresponding to the VDocument to `target`.
            target.appendChild(renderedRoot);
            VDocumentMap.set(root, target);
            this._renderSelection(content.selection, target);
        }
    }
    /**
     * Render the element matching the current vNode and append it.
     *
     * @param context
     */
    renderNode(context: DomRenderingContext): [DomRenderingContext, DomRenderingMap] {
        const node = context.currentVNode;

        for (const renderingFunction of this.renderingFunctions) {
            const renderingResult = renderingFunction({ ...context });
            if (renderingResult) {
                return renderingResult;
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
    _renderNode(context: DomRenderingContext): DomRenderingContext {
        let renderingMap: DomRenderingMap;
        [context, renderingMap] = this.renderNode({ ...context });

        // Map the parsed nodes to the DOM nodes they represent.
        renderingMap.forEach((nodes: VNode[], domNode: Node) => {
            nodes.forEach((node: VNode, index: number) => {
                VDocumentMap.set(node, domNode, index);
            });
        });

        return context;
    }
    /**
     * Return the next rendering context, based on the given context. This
     * includes the next VNode to render and the next parent element to render
     * it into.
     *
     * @param context
     */
    _nextRenderingContext(context: DomRenderingContext): DomRenderingContext {
        const vNode = context.currentVNode;
        if (vNode.hasChildren()) {
            // Render the first child with the current node as parent.
            context.currentVNode = context.currentVNode.children[0];
            context.parentNode = VDocumentMap.toDom(vNode) as Element;
        } else if (vNode.nextSibling()) {
            // Render the siblings of the current node with the same parent.
            context.currentVNode = context.currentVNode.nextSibling();
            context.parentNode = VDocumentMap.toDom(vNode.parent) as Element;
        } else {
            // Render the next ancestor sibling in the ancestor tree.
            let ancestor = vNode.parent;
            // Climb up the ancestor tree to the first parent having a sibling.
            while (ancestor && !ancestor.nextSibling() && ancestor != context.root) {
                ancestor = ancestor.parent;
            }
            if (ancestor && ancestor != context.root) {
                // At this point, the found ancestor has a sibling.
                context.currentVNode = ancestor.nextSibling();
                context.parentNode = VDocumentMap.toDom(ancestor.parent) as Element;
            } else {
                // If no next ancestor having a sibling could be found then the
                // tree has been fully rendered.
                return;
            }
        }
        return context;
    }
    /**
     * Render the given VSelection as a DOM selection in the given target.
     *
     * @param selection
     * @param target
     */
    _renderSelection(selection: VSelection, target: Element): void {
        const [anchorNode, anchorOffset] = this._getDomLocation(selection.anchor);
        const [focusNode, focusOffset] = this._getDomLocation(selection.focus);
        const domRange = target.ownerDocument.createRange();
        if (selection.direction === Direction.FORWARD) {
            domRange.setStart(anchorNode, anchorOffset);
            domRange.collapse(true);
        } else {
            domRange.setEnd(anchorNode, anchorOffset);
            domRange.collapse(false);
        }
        const domSelection = document.getSelection();
        domSelection.removeAllRanges();
        domSelection.addRange(domRange);
        domSelection.extend(focusNode, focusOffset);
    }
    /**
     * Return the location in the DOM corresponding to the location in the
     * VDocument of the given VNode. The location in the DOM is expressed as a
     * tuple containing a reference Node and a relative position with respect to
     * the reference Node.
     *
     * @param node
     */
    _getDomLocation(node: VNode): [Node, number] {
        let reference = node.previousSibling();
        let position = RelativePosition.AFTER;
        if (reference) {
            reference = reference.lastLeaf();
        } else {
            reference = node.nextSibling();
            position = RelativePosition.BEFORE;
        }
        if (reference) {
            reference = reference.firstLeaf();
        } else {
            reference = node.parent;
            position = RelativePosition.INSIDE;
        }
        // The location is a tuple [reference, offset] implemented by an array.
        const location = VDocumentMap.toDomLocation(reference);
        if (position === RelativePosition.AFTER) {
            // Increment the offset to be positioned after the reference node.
            location[1] += 1;
        }
        return location;
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
        return context.currentVNode.test(predicate);
    }
}
