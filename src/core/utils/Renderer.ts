import { VNode, VNodeType } from '../stores/VNode';
import { Format } from './Format';
import { VDocumentMap } from './VDocumentMap';

interface RenderingContext {
    vNode?: VNode;
    parentNode?: Node;
}

export class Renderer {
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Render the contents of a root VNode into a given target element.
     *
     * @param root
     * @param target
     */
    render(root: VNode, target: Element): void {
        target.innerHTML = ''; // TODO: update instead of recreate
        VDocumentMap.clear(); // TODO: update instead of recreate
        const fragment: DocumentFragment = document.createDocumentFragment();
        root.children.forEach(child => {
            this._renderVNode(child, fragment);
        });
        target.appendChild(fragment);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if `a` has the same format properties as `b`.
     *
     * @param a
     * @param b
     */
    _isSameFormat(a: VNode, b: VNode): boolean {
        return Object.keys(a.format).every(k => a.format[k] === b.format[k]);
    }
    /**
     * Return the next rendering context, based on the given vNode. This
     * includes the next VNode to render and the next parent element to render
     * it into.
     *
     * @param vNode
     */
    _nextRenderingContext(vNode: VNode): RenderingContext {
        if (vNode.children.length) {
            // Render the first child with the current node as parent, if any.
            return {
                vNode: vNode.children[0],
                // Text node cannot have children, therefore parent is Element, not Node
                parentNode: VDocumentMap.toDom(vNode),
            };
        } else if (vNode.nextSibling) {
            // Render the siblings of the current node with the same parent, if any.
            return {
                vNode: vNode.nextSibling,
                // Text node cannot have children, therefore parent is Element, not Node
                parentNode: VDocumentMap.toDom(vNode.parent),
            };
        } else {
            // Render the next ancestor sibling in the ancestor tree, if any.
            let ancestor = vNode.parent;
            // Climb back the ancestor tree to the first parent having a sibling.
            while (ancestor && !ancestor.nextSibling) {
                ancestor = ancestor.parent;
            }
            // At this point, the found ancestor has a sibling. If no ancestor
            // having a sibling could be found, the tree has been fully rendered.
            if (ancestor) {
                return {
                    vNode: ancestor.nextSibling,
                    // Text node cannot have children, therefore parent is Element, not Node
                    parentNode: VDocumentMap.toDom(ancestor.parent),
                };
            }
        }
        return {};
    }
    /**
     * Create the element matching this vNode and append it.
     *
     * @param vNode
     * @param parent
     */
    _renderElement(vNode: VNode, parent: Node): RenderingContext {
        const element = vNode.render<HTMLElement>('html');
        parent.appendChild(element);
        VDocumentMap.set(element, vNode);
        return {
            vNode: vNode,
            parentNode: parent,
        };
    }
    /**
     * Render a text node, based on consecutive char nodes.
     *
     * @param vNode
     * @param parent
     */
    _renderTextNode(vNode: VNode, parent: Node): RenderingContext {
        // If the node has a format, render the format nodes first.
        const renderedFormats = [];
        Object.keys(vNode.format).forEach(type => {
            if (vNode.format[type]) {
                const formatNode = document.createElement(Format.toTag(type));
                renderedFormats.push(formatNode);
                parent.appendChild(formatNode);
                // Update the parent so the text is inside the format node.
                parent = formatNode;
            }
        });

        // Consecutive compatible char nodes are rendered as a single text node.
        let text = vNode.value;
        let next = vNode.nextSibling;
        const charNodes = [vNode];
        while (next && next.type === VNodeType.CHAR && this._isSameFormat(vNode, next)) {
            charNodes.push(next);
            text += next.value;
            vNode = next;
            next = vNode.nextSibling;
        }
        const renderedNode = document.createTextNode(text);
        parent.appendChild(renderedNode);
        charNodes.forEach(charNode => {
            VDocumentMap.set(renderedNode, charNode);
            renderedFormats.forEach(formatNode => VDocumentMap.set(formatNode, charNode));
        });
        return {
            vNode: vNode,
            parentNode: parent,
        };
    }
    /**
     * Render a VNode and trigger the rendering of the next one, recursively.
     *
     * @param vNode
     * @param parent
     */
    _renderVNode(vNode: VNode, parent: Node): void {
        let context: RenderingContext;
        if (vNode.type === VNodeType.CHAR) {
            context = this._renderTextNode(vNode, parent);
        } else {
            context = this._renderElement(vNode, parent);
        }

        context = this._nextRenderingContext(context.vNode);

        if (context.vNode && context.parentNode) {
            this._renderVNode(context.vNode, context.parentNode);
        }
    }
}
