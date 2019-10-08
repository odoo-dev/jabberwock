import { VNode, VNodeType } from '../stores/VNode';
import { VDocument } from '../stores/VDocument';

interface RangeToSet {
    startContainer: 'start' | 'end' | DOMElement | Node;
    endContainer: 'start' | 'end' | DOMElement | Node;
    startOffset: 'end' | number;
    endOffset: 'end' | number;
}

// TODO: centralize
const formats = {
    bold: 'B',
    italic: 'I',
    underline: 'U',
};
const formatTags = Object.keys(formats).map(key => formats[key]);

export class Renderer {
    vDocument: VDocument;
    // When aggregating char nodes to render a text node, this keeps the current
    // list of char nodes to aggregate:
    _currentCharNodes: VNode[] = [];
    _lastCreatedNode: DOMElement | Node;
    _nextEndOffset = 0;
    _nextStartOffset = 0;
    _rangeToSet: RangeToSet;
    _waitedForFormat = false;
    _delayingRange = {
        start: false,
        end: false,
    };
    constructor(vDocument: VDocument) {
        this.vDocument = vDocument;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Ensure that all instance variables that are required for a rendering are
     * properly set to their initial values before initiating a new rendering.
     *
     * @param {Element} target
     */
    initializeRendering(target: Element): void {
        target.innerHTML = ''; // TODO: update instead of recreate
        this.vDocument.domMap = new Map(); // TODO: update instead of recreate
        this._currentCharNodes = [];
        this._lastCreatedNode = undefined;
        this._nextEndOffset = 0;
        this._nextStartOffset = 0;
        this._rangeToSet = {
            startContainer: undefined,
            endContainer: undefined,
            startOffset: undefined,
            endOffset: undefined,
        };
        this._waitedForFormat = false;
        this._undelayRange();
    }
    /**
     * Initiate a rendering of `vDocument`'s contents into `target`.
     *
     * @param {Element} target
     */
    render(target: Element): void {
        this.initializeRendering(target);
        const fragment: DocumentFragment = document.createDocumentFragment();
        this._renderBranch(this.vDocument.contents, fragment);
        target.appendChild(fragment);
        this._setRange(target);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Take a node's formats, create the relevant format nodes and append them
     * to the given parent and each other (parent > 1st-format > 2d-format ...)
     *
     * @param vNode the node to format
     * @param parent the parent in which to append the first format node
     */
    _createFormatNodes(vNode: VNode, parent: Element | DocumentFragment): Element[] {
        const formatsToApply: string[] = Object.keys(vNode.format).filter(
            (key: string): boolean => vNode.format[key],
        );
        const formatNodes = formatsToApply.map(
            (key: string): Element => {
                const tag = formats[key];
                const formatNode = document.createElement(tag);
                parent.appendChild(formatNode);
                parent = formatNode;
                return formatNode;
            },
        );

        // Ensure proper DOM/VDoc matching
        formatNodes.forEach(formatNode => {
            this._setMap(formatNode, vNode);
        });
        if (formatNodes.length) {
            this._lastCreatedNode = formatNodes[formatNodes.length - 1];
        }
        return formatNodes;
    }
    /**
     * Delay the update of one side of the range (start or end).
     * `updateRange` will simply be skipped while `this._delayingRange` is true
     * for the side it wants to update. This is useful when the range might need
     * a node that hasn't been rendered yet (eg. when aggregating char nodes).
     *
     * @param side
     */
    _delayRange(side: 'start' | 'end'): void {
        this._delayingRange[side] = true;
    }
    /**
     * Return a string containing the aggregated text of all CHAR VNodes that
     * are inside `this._currentCharNodes`, for rendering.
     */
    _getCurrentText(): string {
        let text = '';
        this._currentCharNodes.forEach((vNode: VNode): void => {
            text += vNode.value;
        });
        return text;
    }
    /**
     * Get the start/end container to set as range: retrieve it from
     * `this._rangeToSet`, then get the right container if it was set to 'start'
     * or 'end', in relationship to the target ('start' will return the first
     * leaf of `target`).
     *
     * @param {DOMElement} target
     * @param {'start'|'end} edge
     * @returns {DOMElement|Node}
     */
    _getRangeContainerToSet(target: Element, edge: 'start' | 'end'): DOMElement | Node {
        const edgeContainer = edge === 'start' ? 'startContainer' : 'endContainer';
        const containerOrSide = this._rangeToSet[edgeContainer];
        if (typeof containerOrSide === 'string') {
            return this._toLeaf(target, containerOrSide === 'start' ? 'first' : 'last');
        }
        return this._toLeaf(containerOrSide, 'first');
    }
    /**
     * Get the start/end offset to set as range: retrieve it from
     * `this._rangeToSet`, then get the right offset if it was set to 'end', in
     * relationship to its target ('end' will return the maximum offset into
     * that target).
     *
     * @param {Element} target
     * @param {'start'|'end} edge
     * @returns {number}
     */
    _getRangeOffsetToSet(target: Element, edge: 'start' | 'end'): number {
        const edgeOffset = edge === 'start' ? 'startOffset' : 'endOffset';
        const offsetOrSide = this._rangeToSet[edgeOffset];
        if (offsetOrSide === 'end') {
            const container = this._getRangeContainerToSet(target, edge);
            if (container) {
                const isTextNode = container.nodeType === 3;
                return container[isTextNode ? 'textContent' : 'childNodes'].length;
            }
            return 0;
        }
        return offsetOrSide;
    }
    /**
     * Take a `VNodeType` and return the corresponding `tagName`, if any.
     *
     * @param vNodeType
     */
    _getTagName(vNodeType: VNodeType): string {
        switch (vNodeType) {
            case 'CHAR':
                return;
            case 'HEADING1':
            case 'HEADING2':
            case 'HEADING3':
            case 'HEADING4':
            case 'HEADING5':
            case 'HEADING6':
                return 'H' + vNodeType[7];
            case 'LINE_BREAK':
                return 'BR';
            case 'PARAGRAPH':
                return 'P';
            case 'RANGE_START':
            case 'RANGE_END':
                return;
        }
    }
    /**
     * Render a VNode and its children.
     *
     * @param vNode the node to render
     * @param parent the parent in which to append it
     */
    _renderBranch(vNode: VNode, parent: Element | DocumentFragment): void {
        // Update the range to set if that was delayed by the creation of a
        // format node and we are not in the process of aggregating char nodes
        if (this._waitedForFormat && !this._currentCharNodes.length) {
            this._updateRange('start');
            this._updateRange('end');
        }

        /* If the node has a format, render that format node first
           Note: Later we remove the empty ones and do the DomMap matching
                 (see at the bottom of this method). */
        const formatNodes: Element[] = this._createFormatNodes(vNode, parent);
        parent = formatNodes.length ? formatNodes[formatNodes.length - 1] : parent;

        // If this is the end of a series of characters, render that text
        const isRange = vNode.type.startsWith('RANGE');
        if (vNode.type !== 'CHAR' && this._currentCharNodes.length && !isRange) {
            this._renderText(parent);
        }

        // Create the element matching this vNode if possible, and append it
        parent = this._renderOne(vNode, parent) || parent;

        // Render the children
        vNode.children.forEach((child: VNode): void => {
            this._renderBranch(child, parent);
        });

        // Render aggregated text at the end of an element
        if (!vNode.nextSibling && this._currentCharNodes.length) {
            this._renderText(parent);
        }
    }
    /**
     * Render a single VNode representing a simple element.
     * Return the created node.
     *
     * @param vNode the node to render
     * @param parent the parent in which to append it
     */
    _renderElement(vNode: VNode, parent: Element | DocumentFragment): Element {
        const tagName: string = this._getTagName(vNode.type);
        const createdNode: Element = document.createElement(tagName);
        parent.appendChild(createdNode);
        this._setMap(createdNode, vNode);
        this._lastCreatedNode = createdNode;
        return createdNode;
    }
    /**
     * Render a single VNode. Return the created node if any.
     *
     * @param vNode the node to render
     * @param parent the parent in which to append it
     */
    _renderOne(vNode: VNode, parent: Element | DocumentFragment): Element | void {
        // Node is root
        if (vNode.type === 'ROOT') {
            return;
        }
        // Node is character
        if (vNode.type === 'CHAR') {
            this._currentCharNodes.push(vNode);
            return;
        }
        // Node is range
        if (vNode.type.startsWith('RANGE')) {
            this._renderRangeNode(vNode);
            return;
        }
        // Node is element
        return this._renderElement(vNode, parent);
    }
    /**
     * Render a Range node: update the range to set if possible or delay that
     * update for when the required rendered node is available
     * (see `_delayRange`).
     *
     * @param vNode
     */
    _renderRangeNode(vNode: VNode): void {
        const side = vNode.type.endsWith('START') ? 'start' : 'end';
        const isRenderingText = !!this._currentCharNodes.length;
        // If we are busy rendering text, save the offset (the number of
        // char nodes collected so far) and delay the range update until the
        // text node is rendered.
        if (isRenderingText) {
            this._delayRange(side);
            const offsetName = side === 'start' ? '_nextStartOffset' : '_nextEndOffset';
            this[offsetName] = this._currentCharNodes.length;
            return;
        }
        // Otherwise, simply update the range to set. If both sides need to be
        // updated, do it right away.
        const doUpdateBoth = this._delayingRange.start && this._delayingRange.end;
        this._updateRange(side);
        if (doUpdateBoth) {
            this._updateRange(side === 'end' ? 'start' : 'end');
        }
    }
    /**
     * Render the CHAR VNodes in `this._currentCharNodes` as one text node.
     * Then reinitialize `this._currentCharNodes`.
     *
     * @param parent the parent in which to append the text node
     */
    _renderText(parent: Element | DocumentFragment): void {
        const text = this._getCurrentText();
        const textNode: Text = document.createTextNode(text);
        parent.appendChild(textNode);

        // Map each CHAR VNode to its rendered text node
        // and format parents if any
        this._currentCharNodes.forEach((vNode: VNode): void => {
            this._setMap(textNode, vNode);
            if (formatTags.indexOf(parent['tagName']) !== -1) {
                this._setMap(parent, vNode);
            }
        });

        this._currentCharNodes = [];
        this._lastCreatedNode = textNode;

        // Update the delayed range if necessary
        const doUpdateBoth = this._delayingRange.start && this._delayingRange.end;
        if (doUpdateBoth) {
            this._updateRange('start', this._nextStartOffset);
            this._updateRange('end', this._nextEndOffset);
        } else if (this._delayingRange.start || this._delayingRange.end) {
            const side = this._delayingRange.start ? 'start' : 'end';
            const savedOffset = side === 'start' ? this._nextStartOffset : this._nextEndOffset;
            this._updateRange(side, savedOffset);
        }
    }
    /**
     * Map an DOM Element/Node to a VNode in `vDocument.domMap`.
     *
     * @param element
     * @param vNode
     */
    _setMap(element: Element | Node, vNode: VNode): void {
        if (this.vDocument.domMap.has(element)) {
            const matches = this.vDocument.domMap.get(element);
            if (!matches.some((match: VNode): boolean => match.id === vNode.id)) {
                matches.push(vNode);
            }
        } else {
            this.vDocument.domMap.set(element, [vNode]);
        }
    }
    /**
     * Compute and set a new range in the DOM.
     *
     * @param {Element} target
     */
    _setRange(target: Element): void {
        const direction = this.vDocument.rangeNodes.start.order === 0 ? 'ltr' : 'rtl';
        const computedRange = {
            startContainer: this._getRangeContainerToSet(target, 'start'),
            endContainer: this._getRangeContainerToSet(target, 'end'),
            startOffset: this._getRangeOffsetToSet(target, 'start'),
            endOffset: this._getRangeOffsetToSet(target, 'end'),
        };

        if (direction === 'ltr') {
            this._setRangeForward(computedRange, target);
        } else {
            this._setRangeBackward(computedRange, target);
        }
    }
    /**
     * Set a new backward range in the DOM.
     *
     * @param computedRange
     * @param target
     */
    _setRangeBackward(computedRange, target): void {
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
    _setRangeForward(computedRange, target): void {
        const domRange: Range = target.ownerDocument.createRange();
        const selection = document.getSelection();
        domRange.setStart(computedRange.startContainer, computedRange.startOffset);
        domRange.setEnd(computedRange.endContainer, computedRange.endOffset);
        selection.removeAllRanges();
        selection.addRange(domRange);
    }
    /**
     * Move a node to its first/last leaf
     *
     * @param node
     * @param side
     */
    _toLeaf(node: DOMElement | Node, side: 'first' | 'last'): DOMElement | Node {
        const edgeChild = side === 'first' ? 'firstChild' : 'lastChild';
        let leaf: DOMElement | Node = node;
        while (leaf && leaf[edgeChild]) {
            leaf = leaf[edgeChild];
        }
        return leaf;
    }
    /**
     * Set `this._delayingRange` to false on start and end.
     *
     * @see _delayRange
     */
    _undelayRange(): void {
        this._delayingRange.start = false;
        this._delayingRange.end = false;
    }
    /**
     * Update the range to set base on the last node created.
     *
     * @param {'start'|'end'} edge
     */
    _updateRange(edge: 'start' | 'end', offset?: number | 'end'): void {
        this._undelayRange();
        const waitedForFormat = this._waitedForFormat;
        this._waitedForFormat = false;
        // If no node has be created yet, set the range to the start
        if (!this._lastCreatedNode) {
            this._rangeToSet[edge + 'Container'] = 'start';
            this._rangeToSet[edge + 'Offset'] = 0;
            return;
        }
        // If the last created node was a format node, delay the update
        if (formatTags.indexOf(this._lastCreatedNode['tagName']) !== -1) {
            this._delayRange(edge);
            this._waitedForFormat = true;
            return;
        }

        this._rangeToSet[edge + 'Container'] = this._lastCreatedNode;

        // If the last created node was not a text node,
        // or no offset was passed and we waited for a format node
        const lastIsText = this._lastCreatedNode.nodeType === 3;
        if (!lastIsText || (waitedForFormat && typeof offset !== 'number')) {
            this._rangeToSet[edge + 'Offset'] = 0;
            return;
        }
        // Use the offset that was passed if any
        if (typeof offset === 'number') {
            this._rangeToSet[edge + 'Offset'] = offset;
            return;
        }
        // In any other case, set to the end of the container
        this._rangeToSet[edge + 'Offset'] = 'end';
    }
}
