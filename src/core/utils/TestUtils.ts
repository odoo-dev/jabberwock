import JWEditor from '../../core/JWEditor';
import { VNode } from '../../core/stores/VNode';
import { OwlUI } from '../../ui/OwlUI';
import { DevTools } from '../../plugins/DevTools/DevTools';
import '../../plugins/DevTools/DevTools.css';
import { expect } from 'chai';

interface RangeToSet {
    startContainer: DOMElement | Node;
    startOffset: number;
    endContainer?: DOMElement | Node;
    endOffset?: number;
}
type RangePath = {
    startPath: number[];
    startOffset: number;
    endPath?: number[];
    endOffset?: number;
    onLeaf?: boolean; // true to move the path to the first leaf of each container
};
interface TestRange {
    range: RangeToSet;
    paths: RangePath;
    backward?: boolean;
}

export class TestEnvironment {
    editor = new JWEditor();
    el: DOMElement;
    rangeNodes: {
        start: VNode;
        end: VNode;
    };
    root: VNode;
    constructor(template = '', debug = false) {
        this.editor.editable.innerHTML = template;
        this.editor.start();
        if (debug === true) {
            const ui = new OwlUI(this.editor);
            ui.addPlugin(DevTools);
        }
        this.el = this.editor.el as DOMElement;
        this.root = this.editor.vDocument.contents;
        this.rangeNodes = this.editor.vDocument.rangeNodes;
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    destroy(): void {
        this.editor.stop();
    }
    /**
     * Return the range from the DOM.
     */
    get domRange(): Range {
        return this.editor.el.ownerDocument.getSelection().getRangeAt(0);
    }
    /**
     * Return the editable element.
     */
    get editable(): DOMElement {
        return this.editor.el.querySelector('JW-EDITABLE');
    }

    //--------------------------------------------------------------------------
    // Testers
    //--------------------------------------------------------------------------

    /**
     * Return a `TestRange` object. If no end point was passed in `paths`, set
     * it as equal to the start point. The `TestRange` object contains the
     * corrected `paths` object, the corresponding DOM points and the value of
     * `backward`.
     *
     * @param paths
     * @param backward
     */
    createTestRange(paths: RangePath, backward = false): TestRange {
        const hasEndContainer = !!paths.endPath;
        const hasEndOffset = typeof paths.endOffset === 'number';
        const startContainer = this._containerFromPath(paths.startPath, paths.onLeaf);
        const endContainer = hasEndContainer
            ? this._containerFromPath(paths.endPath, paths.onLeaf)
            : startContainer;
        paths.endPath = paths.endPath || paths.startPath.slice();
        paths.endOffset = hasEndOffset ? paths.endOffset : paths.startOffset;
        return {
            range: {
                startContainer: startContainer,
                startOffset: paths.startOffset,
                endContainer: endContainer,
                endOffset: paths.endOffset,
            },
            paths: paths,
            backward: backward,
        };
    }
    /**
     * Test that the ranges in the VDocument and in the DOM match the expected
     * range.
     *
     * @param testRange.paths path from the editable element to the targetted node
     */
    testRange(testRange: TestRange): void {
        this.testVRange(testRange.paths, testRange.backward);
        this.testDOMRange(testRange.range);
    }
    /**
     * Test that the range in the DOM matches the expected range.
     *
     * @param range expected range
     */
    testDOMRange(range: RangeToSet): void {
        range.endContainer = range.endContainer || range.startContainer;
        range.endOffset = typeof range.endOffset === 'number' ? range.endOffset : range.startOffset;
        const domRange = this.domRange;
        expect(this._areNodesEqual(domRange.startContainer, range.startContainer)).to.be.true;
        expect(domRange.startOffset).to.equal(range.startOffset);
        expect(this._areNodesEqual(domRange.endContainer, range.endContainer)).to.be.true;
        expect(domRange.endOffset).to.equal(range.endOffset);
    }
    /**
     * Test that the range in the vDocument matches the expected positions,
     * defined as paths from the root.
     *
     * @param paths expected paths to the start and end range nodes
     * @param [backward] true to expect the range to be backward
     */
    testVRange(paths: RangePath, backward = false): void {
        const expectedStart = this._pathToExpectedRange(paths.startPath, paths.startOffset);
        const expectedEnd = this._pathToExpectedRange(paths.endPath, paths.endOffset);

        // skip range node if needed
        const hasRangeCommonParent = this.rangeNodes.start.parent.children.some(
            child => child.id === this.rangeNodes.end.id,
        );
        if (hasRangeCommonParent) {
            expectedEnd[expectedEnd.length - 1]++;
        }
        const start = this._vNodeFromPath(expectedStart);
        const end = this._vNodeFromPath(expectedEnd);
        expect(start).not.to.be.undefined;
        expect(end).not.to.be.undefined;
        expect(this.rangeNodes[backward ? 'end' : 'start'].id).to.equal(start.id);
        expect(this.rangeNodes[backward ? 'start' : 'end'].id).to.equal(end.id);
        expect(this.rangeNodes.start.order).to.equal(backward ? 1 : 0);
    }

    //--------------------------------------------------------------------------
    // Public misc utils
    //--------------------------------------------------------------------------

    /**
     * Return a promise that resolves after a timeout of duration `n` or 0.
     *
     * @param [n]
     */
    delay(n = 0): Promise<void> {
        return new Promise((resolve): void => {
            setTimeout(resolve, n);
        });
    }
    /**
     * Return the first leaf of the given element.
     *
     * @param node
     */
    firstLeaf(node: DOMElement | Node): DOMElement | Node {
        let firstLeaf = node;
        while (firstLeaf.firstChild) {
            firstLeaf = firstLeaf.firstChild;
        }
        return firstLeaf;
    }
    /**
     * Set the range in the editor and trigger matching mouse events.
     *
     * @param range
     * @param [backward] true to set the range backward
     */
    async setRange(range: RangeToSet, backward = false): Promise<void> {
        const start = (this._isText(range.startContainer)
            ? range.startContainer.parentNode
            : range.startContainer) as DOMElement;
        range.startOffset = range.startOffset || 0;
        range.endContainer = range.endContainer || range.startContainer;
        range.endOffset = range.endOffset == null ? range.startOffset : range.endOffset;
        await this.triggerNativeEvents(start, 'mousedown');
        this._selectRange(range, backward);
        const end = (this._isText(range.endContainer)
            ? range.endContainer.parentNode
            : range.endContainer) as DOMElement;
        await this.triggerNativeEvents(end, ['focus', 'mouseup', 'click']);
    }
    /**
     * Trigger the given native events on the given element.
     *
     * @param target element on which to trigger the event
     * @param events name of the event(s) to trigger
     */
    async triggerNativeEvents(target: DOMElement, events: string | string[]): Promise<void> {
        const options = {
            view: window,
            bubbles: true,
            cancelable: true,
        };
        if (typeof events === 'string') {
            events = [events];
        }
        for (let i = 0; i < events.length; i++) {
            const eventName = events[i];
            let event;
            switch (this._eventType(eventName)) {
                case 'mouse':
                    event = new MouseEvent(eventName, options);
                    break;
                case 'keyboard':
                    event = new KeyboardEvent(eventName, options);
                    break;
                default:
                    event = new Event(eventName, options);
                    break;
            }
            target.dispatchEvent(event);
            await this.delay();
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if `first` is equal to `second`.
     * TODO: not use. This is far from being foolproof. The reason for this is
     * that we will later introduce partial rendering, ie we will render only
     * what changed. As it is not the case now, everything gets rerendered, so
     * we can't test for equality between two nodes (pre-render and post-render)
     * as they are not technically the same node.
     *
     * @private
     * @param first
     * @param second
     */
    _areNodesEqual(first: Element | Node, second: Element | Node): boolean {
        if (this._isText(first)) {
            return first.textContent === second.textContent;
        }
        return first['tagName'] === second['tagName'];
    }
    /**
     * Find an element by following a path from the editable element, going from
     * nth child to nth child.
     *
     * @private
     * @param path path from the editable element
     * @param onLeaf true to get the first leaf of the found container
     */
    _containerFromPath(path: number[], onLeaf = false): Element | Node {
        let container = this.editable;
        path.forEach(index => {
            container = container.childNodes[index];
        });
        return onLeaf ? this.firstLeaf(container) : container;
    }
    /**
     * Get the event type based on its name.
     *
     * @private
     * @param eventName
     */
    _eventType(eventName: string): string {
        const types = {
            mouse: ['click', 'mouse', 'pointer', 'contextmenu', 'select', 'wheel'],
            keyboard: ['key'],
        };
        let type = 'unknown';
        Object.keys(types).forEach(key => {
            const isType = types[key].some(str => {
                return eventName.indexOf(str) !== -1;
            });
            if (isType) {
                type = key;
            }
        });
        return type;
    }
    /**
     * Return true if the given node is a text node.
     *
     * @private
     * @param node
     */
    _isText(node: Element | Node): boolean {
        return node.nodeType === 3;
    }
    /**
     * Induce the path to the expected range from the set range point (node,
     * offset), itself given as a path.
     *
     * @private
     * @param path
     * @param offset
     */
    _pathToExpectedRange(path: number[], offset: number): number[] {
        let container = this.editable;
        let finalOffset = offset;
        const __getIndex = (child, container): void => {
            if (this._isText(child)) {
                finalOffset += child.textContent.length;
            } else if (child.tagName === 'BR') {
                finalOffset += 1;
            } else {
                child.childNodes.forEach(grandChild => __getIndex(grandChild, container));
            }
        };
        // skip format nodes and adapt offset accordingly
        path.forEach((index, i, self) => {
            container = container.childNodes[index];
            if (['B', 'I', 'U'].indexOf(container.tagName) !== -1) {
                self.splice(i, 1);
                if (index) {
                    const childrenToAggregate = [];
                    for (let j = 0; j < index; j++) {
                        childrenToAggregate.push(container.parentNode.childNodes[j]);
                    }
                    childrenToAggregate.forEach(child => __getIndex(child, container));
                }
            }
        });
        if (path.length > 1) {
            path.pop();
        }
        path.push(finalOffset);
        return path;
    }
    /**
     * Select the given collapsed range in the DOM.
     *
     * @private
     * @param {RangeToSet} range
     * @param {boolean} [backward]
     */
    _selectRange(range: RangeToSet, backward = false): void {
        range.endContainer = range.endContainer || range.startContainer;
        range.endOffset = typeof range.endOffset === 'number' ? range.endOffset : range.startOffset;
        if (backward) {
            this._selectRangeBackward(range);
        } else {
            this._selectRangeForward(range);
        }
    }
    /**
     * Set a new backward range in the DOM.
     *
     * @private
     * @param range
     */
    _selectRangeBackward(range): void {
        const domRange: Range = this.el.ownerDocument.createRange();
        const selection = document.getSelection();
        domRange.setEnd(range.endContainer, range.endOffset);
        domRange.collapse(false);
        selection.removeAllRanges();
        selection.addRange(domRange);
        selection.extend(range.startContainer, range.startOffset);
    }
    /**
     * Set a new forward range in the DOM.
     *
     * @private
     * @param range
     */
    _selectRangeForward(range): void {
        const domRange: Range = this.el.ownerDocument.createRange();
        const selection = document.getSelection();
        domRange.setStart(range.startContainer, range.startOffset);
        domRange.setEnd(range.endContainer, range.endOffset);
        selection.removeAllRanges();
        selection.addRange(domRange);
    }
    /**
     * Find a VNode by following a path from the root, going from nth child to
     * nth child.
     *
     * @private
     * @param path
     */
    _vNodeFromPath(path: number[]): VNode {
        let vNode = this.root;
        path.forEach(index => {
            vNode = vNode.nthChild(index);
        });
        return vNode;
    }
}
