import { VNode, VNodeType } from '../stores/VNode';
import { Format } from './Format';
import { VDocumentMap } from './VDocumentMap';
import { VRange, RelativePosition } from '../stores/VRange';
import { VDocument } from '../stores/VDocument';
import { isRange, isChar } from './Predicates';

interface RenderingContext {
    currentVNode?: VNode; // Current VNode rendered at this step.
    parentNode?: Node | DocumentFragment; // Node to render the VNode into.
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
    render(vDocument: VDocument, target: Element): void {
        const root = vDocument.root;
        const range = vDocument.range;
        target.innerHTML = ''; // TODO: update instead of recreate
        const fragment: DocumentFragment = document.createDocumentFragment();
        VDocumentMap.clear(); // TODO: update instead of recreate
        VDocumentMap.set(root, fragment);

        if (root.hasChildren()) {
            let context: RenderingContext = {
                currentVNode: root.firstChild(),
                parentNode: fragment,
            };
            do {
                context = this._renderVNode(context);
            } while ((context = this._nextRenderingContext(context)));
        }
        target.appendChild(fragment);

        this._renderRange(range, target);
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
    _isSameTextNode(a: VNode, b: VNode): boolean {
        if (isRange(a) || isRange(b)) {
            // A Range node is always considered to be part of the same text
            // node as another node in the sense that the text node must not
            // be broken up just because it contains the range.
            return true;
        } else if (!isChar(a) || !isChar(b)) {
            // Nodes that are not valid in a text node must end the text node.
            return false;
        } else {
            // Char VNodes are the same text node if they have the same format.
            const formats = Object.keys({ ...a.format, ...b.format });
            return formats.every(k => !!a.format[k] === !!b.format[k]);
        }
    }
    /**
     * Return the next rendering context, based on the given context. This
     * includes the next VNode to render and the next parent element to render
     * it into.
     *
     * @param context
     */
    _nextRenderingContext(context: RenderingContext): RenderingContext {
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
            while (ancestor && !ancestor.nextSibling()) {
                ancestor = ancestor.parent;
            }
            if (ancestor) {
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
     * Render the element matching the current vNode and append it.
     *
     * @param context
     */
    _renderElement(context: RenderingContext): RenderingContext {
        const fragment = context.currentVNode.render<DocumentFragment>('html');
        Array.from(fragment.childNodes).forEach((element: Node): void => {
            context.parentNode.appendChild(element);
            VDocumentMap.set(context.currentVNode, element);
            element.childNodes.forEach(child => VDocumentMap.set(context.currentVNode, child));
        });
        return context;
    }
    /**
     * Render a text node, based on consecutive char nodes.
     *
     * @param context
     */
    _renderTextNode(context: RenderingContext): RenderingContext {
        // If the node has a format, render the format nodes first.
        const renderedFormats = [];
        const firstChar = context.currentVNode;
        Object.keys(firstChar.format).forEach(type => {
            if (firstChar.format[type]) {
                const formatNode = document.createElement(Format.toTag(type));
                renderedFormats.push(formatNode);
                context.parentNode.appendChild(formatNode);
                // Update the parent so the text is inside the format node.
                context.parentNode = formatNode;
            }
        });

        // Consecutive compatible char nodes are rendered as a single text node.
        let text = firstChar.value;
        let next = firstChar.nextSibling();
        const charNodes = [firstChar];
        while (next && this._isSameTextNode(firstChar, next)) {
            context.currentVNode = next;
            if (isChar(next)) {
                charNodes.push(next);
                if (next.value === ' ' && text[text.length - 1] === ' ') {
                    // Browsers don't render consecutive space chars otherwise.
                    text += '\u00A0';
                } else {
                    text += next.value;
                }
            }
            next = next.nextSibling();
        }
        // Browsers don't render leading/trailing space chars otherwise.
        text = text.replace(/^ | $/g, '\u00A0');

        // Create and append the text node, update the VDocumentMap.
        const renderedNode = document.createTextNode(text);
        context.parentNode.appendChild(renderedNode);
        charNodes.forEach((charNode, nodeIndex) => {
            VDocumentMap.set(charNode, renderedNode, nodeIndex);
            renderedFormats.forEach(formatNode => VDocumentMap.set(charNode, formatNode));
        });

        return context;
    }
    /**
     * Render the given VRange as a selection in the DOM in the given target.
     *
     * @param range
     * @param target
     */
    _renderRange(range: VRange, target: Element): void {
        const [startContainer, startOffset] = this._getDomLocation(range.anchor);
        const [endContainer, endOffset] = this._getDomLocation(range.focus);
        const domRange: Range = target.ownerDocument.createRange();
        domRange.setStart(startContainer, startOffset);
        domRange.collapse(true);
        const selection = document.getSelection();
        selection.removeAllRanges();
        selection.addRange(domRange);
        selection.extend(endContainer, endOffset);
    }
    /**
     * Return the location in the DOM corresponding to the location in the
     * VDocument of the given range VNode. The location in the DOM is expressed
     * as a tuple containing a reference Node and a relative position with
     * respect to the reference Node.
     *
     * @param rangeNode
     */
    _getDomLocation(rangeNode: VNode): [Node, number] {
        let reference = rangeNode.previousSibling();
        let position = RelativePosition.AFTER;
        if (reference) {
            reference = reference.lastLeaf();
        } else {
            reference = rangeNode.nextSibling();
            position = RelativePosition.BEFORE;
        }
        if (reference) {
            reference = reference.firstLeaf();
        } else {
            reference = rangeNode.parent;
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
     * Render a VNode and trigger the rendering of the next one, recursively.
     *
     * @param context
     */
    _renderVNode(context: RenderingContext): RenderingContext {
        if (isChar(context.currentVNode)) {
            context = this._renderTextNode(context);
        } else {
            context = this._renderElement(context);
        }
        return context;
    }
}
