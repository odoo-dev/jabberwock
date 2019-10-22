import { VNode, VNodeType } from '../stores/VNode';
import { Format } from './Format';
import { VDocumentMap } from './VDocumentMap';
import { VRange, RangeDirection } from '../stores/VRange';

type ParentElement = Element | DocumentFragment;
type ContainerDescription = 'start' | 'end' | Node;
interface RangeDescription {
    startContainer?: ContainerDescription;
    startOffset?: 'end' | number;
    endContainer?: ContainerDescription;
    endOffset?: 'end' | number;
}
interface ComputedRange {
    startContainer: Node;
    startOffset: number;
    endContainer: Node;
    endOffset: number;
}
interface RenderingContext {
    vNode?: VNode; // The VNode to render
    parentElement?: ParentElement; // The parent in which to render the VNode
    lastRendered?: Node; // The last element that was rendered
    range?: RangeDescription; // The range that will eventually have to be set
}

export class Renderer {
    range: VRange;
    constructor(range: VRange) {
        this.range = range;
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
    render(root: VNode, target: Element): void {
        target.innerHTML = ''; // TODO: update instead of recreate
        VDocumentMap.clear(); // TODO: update instead of recreate
        const fragment: DocumentFragment = document.createDocumentFragment();
        let context: RenderingContext = {};

        // Render every child of `root` in `fragment` and update the context at
        // every step
        root.children.forEach(child => {
            const rangeToSet = context && context.range;
            Object.assign(context, {
                vNode: child,
                parentElement: fragment,
                range: rangeToSet || {},
            });
            context = this._renderVNode(context);
        });

        const computedRange = this._computeRange(context.range, fragment);
        target.appendChild(fragment);

        // Set the new range, base on the accumulated context
        this._setRange(computedRange, target);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Compute the DOM Range to set, based on potentially relative positions
     * ('start', 'end').
     *
     * @param range
     * @param rendered
     */
    _computeRange(range: RangeDescription, rendered: DocumentFragment): ComputedRange {
        let startContainer = this._computeContainer(range.startContainer, rendered);
        let endContainer = range.endContainer
            ? this._computeContainer(range.endContainer, rendered)
            : startContainer;
        let startOffset = this._computeOffset(range.startOffset, startContainer);
        let endOffset =
            typeof range.endOffset === 'undefined'
                ? startOffset
                : this._computeOffset(range.endOffset, endContainer);
        [startContainer, startOffset] = this._rangePointToLeaf(startContainer, startOffset);
        [endContainer, endOffset] = this._rangePointToLeaf(endContainer, endOffset);
        return {
            startContainer: startContainer,
            startOffset: startOffset,
            endContainer: endContainer,
            endOffset: endOffset,
        };
    }
    /**
     * Compute a container, based on a potentially relative position ('start', 'end').
     *
     * @param container
     * @param rendered
     */
    _computeContainer(container: ContainerDescription, rendered: DocumentFragment): Node {
        if (typeof container === 'string') {
            return this._toLeaf(rendered, container === 'start' ? 'first' : 'last');
        } else {
            return container;
        }
    }
    /**
     * Compute an offset, based on a potentially relative position ('end').
     *
     * @param offset
     * @param computedContainer
     */
    _computeOffset(offset: 'end' | number, computedContainer: Node): number {
        if (offset === 'end') {
            return this._nodeLength(computedContainer);
        } else {
            return offset;
        }
    }
    /**
     * Fill the last rendered node in order to make it visible.
     * Eg: <p></p> => <p><br/></p>.
     *
     * @param context
     */
    _insertFiller(context: RenderingContext): RenderingContext {
        const placeholderBR = document.createElement('BR');
        context.lastRendered.appendChild(placeholderBR);
        VDocumentMap.set(placeholderBR, context.vNode);
        context.lastRendered = placeholderBR;
        return context;
    }
    /**
     * Return true if `a` has the same format properties as `b`.
     *
     * @param a
     * @param b
     */
    _isSameFormat(a: VNode, b: VNode): boolean {
        return Object.keys(a.format).every(k => {
            if (k === 'anchor') {
                const anchorA = a.format[k];
                const anchorB = b.format[k];
                if (anchorA && anchorB) {
                    return (
                        anchorA.url.href === anchorB.url.href && anchorA.target === anchorB.target
                    );
                } else {
                    return anchorA == anchorB;
                }
            }
            return a.format[k] === b.format[k];
        });
    }
    /**
     * Return a tuple containing a <br> element's parent and the offset on which
     * to set the range in order to target the BR (namely, the index of the
     * BR + 1).
     *
     * @param br
     */
    _moveToParentOfBR(br: Node): [Node, number] {
        let offset = 1; // always AFTER the BR
        Array.from(br.parentElement.childNodes).some(child => {
            if (child.isSameNode(br)) {
                return true;
            }
            offset++;
        });
        return [br.parentElement, offset];
    }
    /**
     * Return the next rendering context, based on the given context. This
     * includes the next VNode to render and the next parent element to render
     * it into.
     *
     * @param context
     */
    _nextRenderingContext(context: RenderingContext): RenderingContext {
        const vNode = context.vNode;
        let newVNode: VNode;
        let newParent: ParentElement;
        if (vNode.children.length) {
            // Render the first child with the current node as parent, if any.
            newVNode = vNode.children[0];
            newParent = VDocumentMap.toDom(vNode) as ParentElement;
        } else if (vNode.nextSibling) {
            // Render the siblings of the current node with the same parent, if any.
            newVNode = vNode.nextSibling;
            newParent = VDocumentMap.toDom(vNode.parent) as ParentElement;
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
                newVNode = ancestor.nextSibling;
                newParent = VDocumentMap.toDom(ancestor.parent) as ParentElement;
            }
        }
        return Object.assign(context, {
            vNode: newVNode,
            parentElement: newParent,
        });
    }
    /**
     * Return the length of a DOM node.
     *
     * @param domNode
     */
    _nodeLength(domNode: Node): number {
        if (domNode.nodeType === Node.TEXT_NODE) {
            return domNode.textContent.length;
        } else {
            return domNode.childNodes.length;
        }
    }
    /**
     * Move a container and offset to the container's leaf. In the case where
     * that leaf is a <br>, target it via its parent. Return a tuple with the
     * updated container and the offset.
     *
     * @param container
     * @param offset
     */
    _rangePointToLeaf(container: Node, offset: number): [Node, number] {
        // Move to leaf
        while (container.childNodes && container.childNodes[offset]) {
            container = container.childNodes[offset];
            offset = 0;
        }
        // In the case where the leaf is a <br>, we need to target its parent at
        // offset == BR.index + 1 for the browser to show the range where
        // expected.
        if (container.nodeName === 'BR') {
            [container, offset] = this._moveToParentOfBR(container);
        }
        return [container, offset];
    }
    /**
     * Create the element matching this context's vNode and append it.
     *
     * @param context
     * @param __isSecondBR true if we are rendering a second BR of a pair that
     * represents a single LINE_BREAK.
     */
    _renderElement(context: RenderingContext, __isSecondBR = false): RenderingContext {
        const element = context.vNode.render<HTMLElement>('html');
        Object.keys(context.vNode.attributes).forEach(key => {
            element.setAttribute(key, context.vNode.attributes[key]);
        });
        context.parentElement.appendChild(element);
        VDocumentMap.set(element, context.vNode);
        const newContext = Object.assign({}, context, {
            vNode: context.vNode,
            parentElement: context.parentElement,
            lastRendered: element,
        });
        // If a node is empty (or only contains range nodes) but could
        // accomodate children, fill it to make it visible.
        if (
            context.vNode.children.every(child => child.type.startsWith('RANGE')) &&
            !context.vNode.properties.atomic
        ) {
            return this._insertFiller(newContext);
        }

        // If a LINE_BREAK has no next sibling, it must be rendered as two BRs
        // in order for it to be visible.
        let nextNonRangeSibling = context.vNode.nextSibling;
        while (nextNonRangeSibling && nextNonRangeSibling.type.startsWith('RANGE')) {
            nextNonRangeSibling = nextNonRangeSibling.nextSibling;
        }
        if (!__isSecondBR && context.vNode.type === VNodeType.LINE_BREAK && !nextNonRangeSibling) {
            return this._renderElement(newContext, true);
        }
        return newContext;
    }
    /**
     * Render a Range node: update the range to set.
     *
     * @param context
     * @param [offset] default: 0
     */
    _renderRangeNode(context: RenderingContext, offset = 0): RenderingContext {
        let container: ContainerDescription;
        if (context.lastRendered) {
            container = context.lastRendered;
        } else {
            // If no node was created yet, target the very beginning of the
            // editable container.
            container = 'start';
        }
        // Update the context.
        const isStart = context.vNode.type.endsWith('START');
        context.range[isStart ? 'startContainer' : 'endContainer'] = container;
        context.range[isStart ? 'startOffset' : 'endOffset'] = offset;
        return context;
    }
    /**
     * Render a text node, based on consecutive char nodes.
     *
     * @param context
     */
    _renderTextNode(context: RenderingContext): RenderingContext {
        let vNode = context.vNode;
        let parent = context.parentElement;

        // If the node has a format, render the format nodes first.
        const renderedFormats = [];
        Object.keys(vNode.format).forEach(type => {
            if (vNode.format[type]) {
                const formatNode = document.createElement(Format.toTag(type));
                if (type === 'anchor') {
                    formatNode.setAttribute('href', vNode.format.anchor.url.href);
                    if (vNode.format.anchor.target) {
                        formatNode.setAttribute('target', vNode.format.anchor.target);
                    }
                }
                renderedFormats.push(formatNode);
                parent.appendChild(formatNode);
                // Update the parent so the text is inside the format node.
                parent = formatNode;
            }
        });

        // Consecutive compatible char nodes are rendered as a single text node.
        // If range nodes are encountered while collecting the char nodes,
        // collect information about their location so we can update the range
        // to set once the text node is rendered.
        let text = vNode.value;
        const charNodes = [vNode];
        const rangeNodes: ({ node: VNode; offset: number })[] = [];
        let previousChar = vNode;
        vNode.next((next: VNode): boolean => {
            if (next.type === VNodeType.CHAR && this._isSameFormat(previousChar, next)) {
                // Collect text.
                charNodes.push(next);
                text += next.value;
                previousChar = next;
            } else if (next.type.startsWith('RANGE')) {
                // Collect information about the range node's location.
                rangeNodes.push({
                    node: next,
                    offset: charNodes.length,
                });
            } else {
                // No more consecutive char nodes: return the last char node to
                // update the value of `vNode`.
                return true;
            }
            vNode = next;
            return !next.nextSibling;
        });

        // Create and append the text node, update the VDocumentMap.
        const renderedNode = document.createTextNode(text.replace(/^ | $/g, '\u00A0'));
        parent.appendChild(renderedNode);
        charNodes.forEach(charNode => {
            VDocumentMap.set(renderedNode, charNode);
            renderedFormats.forEach(formatNode => VDocumentMap.set(formatNode, charNode));
        });

        // Update the context.
        const newContext = Object.assign({}, context, {
            vNode: vNode,
            parentElement: parent,
            lastRendered: renderedNode,
        });

        // If range nodes were encountered while collecting char nodes, render
        // them and update the context.
        rangeNodes.forEach(rangeNode => {
            const rangeContext = Object.assign({}, newContext, { vNode: rangeNode.node });
            const updatedContext = this._renderRangeNode(rangeContext, rangeNode.offset);
            Object.assign(newContext, {
                range: updatedContext.range,
            });
        });
        return newContext;
    }
    /**
     * Render a VNode and trigger the rendering of the next one, recursively.
     *
     * @param context
     */
    _renderVNode(context: RenderingContext): RenderingContext {
        const contextCopy = Object.assign({}, context);
        if (context.vNode.type === VNodeType.CHAR) {
            context = this._renderTextNode(contextCopy);
        } else if (context.vNode.type.startsWith('RANGE')) {
            context = this._renderRangeNode(contextCopy);
        } else {
            context = this._renderElement(contextCopy);
        }

        context = this._nextRenderingContext(context);

        if (context.vNode && context.parentElement) {
            this._renderVNode(context);
        }

        return context;
    }
    /**
     * Compute and set a new range in the DOM.
     *
     * @param range the range to set
     * @param target the target in which to set the range
     */
    _setRange(range: ComputedRange, target: Element): void {
        if (this.range.direction === RangeDirection.FORWARD) {
            this._setRangeForward(range, target);
        } else {
            this._setRangeBackward(range, target);
        }
    }
    /**
     * Set a new backward range in the DOM.
     *
     * @param computedRange
     * @param target
     */
    _setRangeBackward(computedRange: ComputedRange, target: Element): void {
        const domRange: Range = target.ownerDocument.createRange();
        const selection = document.getSelection();
        domRange.setEnd(computedRange.startContainer, computedRange.startOffset);
        domRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(domRange);
        selection.extend(computedRange.endContainer, computedRange.endOffset);
    }
    /**
     * Set a new forward range in the DOM.
     *
     * @param computedRange
     * @param target
     */
    _setRangeForward(computedRange: ComputedRange, target: Element): void {
        const domRange: Range = target.ownerDocument.createRange();
        const selection = document.getSelection();
        domRange.setStart(computedRange.startContainer, computedRange.startOffset);
        domRange.setEnd(computedRange.endContainer, computedRange.endOffset);
        selection.removeAllRanges();
        selection.addRange(domRange);
    }
    /**
     * Move a DOM node to its first/last leaf.
     *
     * @param domNode
     * @param side ('first' or 'last')
     */
    _toLeaf(domNode: Node, side: 'first' | 'last'): Node {
        const edgeChild = side === 'first' ? 'firstChild' : 'lastChild';
        let leaf: Node = domNode;
        while (leaf && leaf[edgeChild]) {
            leaf = leaf[edgeChild];
        }
        return leaf;
    }
}
