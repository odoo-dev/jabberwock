import { VDocumentMap } from './VDocumentMap';
import { VDocument } from './VDocument';
import { VNode, RelativePosition, Predicate } from './VNodes/VNode';
import { Format } from '../../utils/src/Format';
import { VSelection, Direction } from './VSelection';
import { CharNode } from '../../plugin-char/CharNode';
import { ListNode, ListType } from '../../plugin-list/ListNode';
import { VElement } from './VNodes/VElement';
import { MarkerNode } from './VNodes/MarkerNode';

interface RenderingContext<T extends VNode = VNode> {
    root: VNode; // Root VNode of the current rendering.
    currentVNode?: T; // Current VNode rendered at this step.
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
            let context: RenderingContext = {
                root: root,
                currentVNode: firstVNode,
                parentNode: parentNode,
            };
            do {
                context = this._renderVNode(context);
            } while ((context = this._nextRenderingContext(context)));
        }

        if (content instanceof VDocument) {
            // Append the fragment corresponding to the VDocument to `target`.
            target.appendChild(renderedRoot);
            VDocumentMap.set(root, target);
            this._renderSelection(content.selection, target);
        }
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
        if (a.is(CharNode) && b.is(CharNode)) {
            // Char VNodes are the same text node if they have the same format.
            const formats = Object.keys({ ...a.format, ...b.format });
            return formats.every(k => !!a.format[k] === !!b.format[k]);
        } else if (a.is(MarkerNode) || b.is(MarkerNode)) {
            // A Marker node is always considered to be part of the same text
            // node as another node in the sense that the text node must not
            // be broken up just because it contains a marker.
            return true;
        } else {
            // Nodes that are not valid in a text node must end the text node.
            return false;
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
        const firstChar = context.currentVNode as CharNode;
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
        let text = '' + firstChar.char;
        let next = firstChar.nextSibling();
        const charNodes = [firstChar];
        while (next && this._isSameTextNode(firstChar, next)) {
            context.currentVNode = next;
            if (next instanceof CharNode) {
                charNodes.push(next);
                if (next.char === ' ' && text[text.length - 1] === ' ') {
                    // Browsers don't render consecutive space chars otherwise.
                    text += '\u00A0';
                } else {
                    text += next.char;
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
     * Render a VNode and trigger the rendering of the next one, recursively.
     *
     * @param context
     */
    _renderVNode(context: RenderingContext): RenderingContext {
        if (context.currentVNode.is(CharNode)) {
            context = this._renderTextNode(context);
        } else if (this._match(context, ListNode)) {
            context = this._renderListNode(context);
        } else {
            context = this._renderElement(context);
        }
        return context;
    }

    /**
     * Return whether the current VNode of the given rendering context matches
     * the given predicate.
     *
     * @param context
     * @param predicate
     */
    _match<T extends VNode>(
        context: RenderingContext,
        predicate: Predicate<T>,
    ): context is RenderingContext<T> {
        return context.currentVNode.test(predicate);
    }

    /**
     * Render the ListNode in currentContext.
     *
     * @param currentContext
     */
    _renderListNode(currentContext: RenderingContext<ListNode>): RenderingContext {
        const currentVNode = currentContext.currentVNode;
        const tag = currentVNode.listType === ListType.ORDERED ? 'OL' : 'UL';
        const domListNode = document.createElement(tag);
        currentContext.parentNode.appendChild(domListNode);
        VDocumentMap.set(currentVNode, domListNode);
        // The ListNode has to handle the rendering of its direct children by
        // itself since some of them are rendered inside "LI" nodes while others
        // are rendered *as* "LI" nodes.
        Array.from(currentVNode.children).forEach((listItem: VNode) => {
            // Check if previous "LI" can be reused or create a new one.
            let liNode: Element;
            if (listItem.is(ListNode) && domListNode.children.length) {
                // Render an indented list in the list item that precedes it.
                // eg.: <ul><li>title: <ul><li>indented</li></ul></ul>
                liNode = domListNode.children[domListNode.children.length - 1];
            } else {
                liNode = document.createElement('li');
                domListNode.appendChild(liNode);
            }

            // Direct ListNode's VElement children "P" are rendered as "LI"
            // while other nodes will be rendered inside the "LI".
            if (listItem.is(VElement) && listItem.htmlTag === 'P') {
                // Mark the "P" as rendered by the "LI".
                VDocumentMap.set(listItem, liNode);
                // TODO: this should be generic.
                if (!listItem.hasChildren()) {
                    liNode.appendChild(document.createElement('BR'));
                }
            }
            // Call the generic rendering for grandchildren.
            this.render(listItem, liNode);
        });
        // Mark the ListNode as completely rendered up to its last leaf.
        return { ...currentContext, currentVNode: currentVNode.lastLeaf() };
    }
}
