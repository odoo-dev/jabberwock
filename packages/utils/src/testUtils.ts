import JWEditor from '../../core/src/JWEditor';
import { expect } from 'chai';
import { RANGE_FOCUS_CHAR, RANGE_ANCHOR_CHAR } from './range';
import { DomSelection } from '../../core/src/EventNormalizer';
import { removeFormattingSpace } from './formattingSpace';

export interface TestEditorSpec {
    contentBefore: string;
    contentAfter?: string;
    stepFunction?: (editor: JWEditor) => void;
    debug?: boolean;
}

/**
 * Test the editor
 *
 * @param spec
 */
export async function testEditor(spec: TestEditorSpec): Promise<void> {
    const wrapper = document.createElement('p');
    wrapper.innerHTML = spec.contentBefore;
    const rangeDescription = _parseTextualRange(wrapper);
    document.body.appendChild(wrapper);
    if (rangeDescription) {
        _setRange(rangeDescription);
    }

    const editor = new JWEditor(wrapper);
    if (spec.debug === true) {
        editor.loadConfig({
            debug: true,
        });
    }
    await editor.start();
    if (spec.stepFunction) {
        spec.stepFunction(editor);
    }
    if (rangeDescription) {
        _renderTextualRange();
    }
    if (spec.contentAfter) {
        expect(editor.editable.innerHTML).to.deep.equal(spec.contentAfter);
    }

    editor.stop();
    wrapper.remove();
}

/**
 * Return a description of a range from analysing the position of
 * `RANGE_ANCHOR_CHAR` and `RANGE_FOCUS_CHAR` characters within a test container.
 * Also remove these from the test container.
 */
function _parseTextualRange(testContainer: Node): DomSelection {
    let anchorNode: Node;
    let focusNode: Node;
    let anchorOffset: number;
    let focusOffset: number;

    let node = testContainer;
    while (node && !(anchorNode && focusNode)) {
        let next: Node;
        if (node.nodeType === Node.TEXT_NODE) {
            // Look for range characters in the text content and remove them.
            const anchorIndex = node.textContent.indexOf(RANGE_ANCHOR_CHAR);
            node.textContent = node.textContent.replace(RANGE_ANCHOR_CHAR, '');
            const focusIndex = node.textContent.indexOf(RANGE_FOCUS_CHAR);
            node.textContent = node.textContent.replace(RANGE_FOCUS_CHAR, '');

            // Set the containers and offsets if we found the range characters.
            if (anchorIndex !== -1) {
                [anchorNode, anchorOffset] = _toDomLocation(node, anchorIndex);
            }
            if (focusIndex !== -1) {
                [focusNode, focusOffset] = _toDomLocation(node, focusIndex);
                // If the start range character is within the same parent and
                // comes before the end range character, change the range
                // direction to BACKWARD and adapt the startOffset to account
                // for this end range character that was removed.
                if (anchorNode === focusNode && anchorOffset > focusOffset) {
                    anchorOffset--;
                }
            }

            // Get the next node to check.
            next = _nextNode(node);
            node.textContent = removeFormattingSpace(node);
            // Remove the textual range node if it is empty.
            if (!node.textContent.length) {
                node.parentNode.removeChild(node);
            }
        } else {
            next = _nextNode(node);
        }
        node = next;
    }
    if (anchorNode && focusNode) {
        return {
            anchorNode: anchorNode,
            anchorOffset: anchorOffset,
            focusNode: focusNode,
            focusOffset: focusOffset,
        };
    }
}
/**
 * Set a range in the DOM.
 *
 * @param range
 */
function _setRange(range: DomSelection): void {
    const domSelection = document.createRange();
    domSelection.setStart(range.anchorNode, range.anchorOffset);
    domSelection.collapse(true);
    const selection = range.anchorNode.ownerDocument.getSelection();
    selection.removeAllRanges();
    selection.addRange(domSelection);
    selection.extend(range.focusNode, range.focusOffset);
}
/**
 * Return a node and an offset corresponding to an index within a text node.
 *
 * @param node
 * @param index
 */
function _toDomLocation(node: Node, index: number): [Node, number] {
    let container: Node;
    let offset: number;
    if (node.textContent.length) {
        container = node;
        offset = index;
    } else {
        container = node.parentNode;
        offset = Array.from(node.parentNode.childNodes).indexOf(node as ChildNode);
    }
    return [container, offset];
}
/**
 * Return the next node in traversal of the DOM tree.
 *
 * @param node
 */
function _nextNode(node: Node): Node {
    let next: Node = node.firstChild || node.nextSibling;
    if (!next) {
        next = node;
        while (next.parentNode && !next.nextSibling) {
            next = next.parentNode;
        }
        next = next && next.nextSibling;
    }
    return next;
}
/**
 * Insert in the DOM:
 * - `RANGE_ANCHOR_CHAR` in place for the selection start
 * - `RANGE_FOCUS_CHAR` in place for the selection end
 *
 * This is used in the function `testEditor`.
 */
function _renderTextualRange(): void {
    const selection = document.getSelection();

    const start = _targetDeepest(selection.anchorNode, selection.anchorOffset);
    const end = _targetDeepest(selection.focusNode, selection.focusOffset);

    // If the range characters have to be inserted within the same parent and
    // the start range character has to be before the end range character, the
    // end offset needs to be adapted to account for the first insertion.
    if (start.container === end.container && start.offset <= end.offset) {
        end.offset++;
    }

    _insertCharAt(RANGE_ANCHOR_CHAR, start.container, start.offset);
    _insertCharAt(RANGE_FOCUS_CHAR, end.container, end.offset);
}

/**
 * Return the deepest child of a given container at a given offset, and its
 * adapted offset.
 *
 * @param container
 * @param offset
 */
function _targetDeepest(container: Node, offset: number): { container: Node; offset: number } {
    while (container.hasChildNodes()) {
        if (offset >= container.childNodes.length) {
            container = container.lastChild;
            offset = container.childNodes.length - 1;
        } else {
            container = container.childNodes[offset];
            offset = 0;
        }
    }
    return {
        container: container as Node,
        offset: offset,
    };
}

/**
 * Insert the given character at the given offset of the given container.
 *
 * @param char
 * @param container
 * @param offset
 */
function _insertCharAt(char: string, container: Node, offset: number): void {
    if (container.nodeType === Node.TEXT_NODE) {
        const startValue = container.nodeValue;
        container.nodeValue =
            startValue.slice(0, offset) + char + startValue.slice(offset, startValue.length);
    } else {
        container.parentNode.insertBefore(document.createTextNode(char), container);
    }
}

/**
 * await the next tick (as setTimeout 0)
 *
 */
export async function nextTick(): Promise<void> {
    await new Promise((resolve): void => {
        setTimeout(resolve);
    });
}

/**
 * await the next tick (as setTimeout 0) after the next redrawing frame
 *
 */
export async function nextTickFrame(): Promise<void> {
    await new Promise((resolve): void => {
        window.requestAnimationFrame(resolve);
    });
    await nextTick();
}

/**
 * simple simulation of a click on an element
 *
 * @param el
 * @param options
 */
export async function click(el: Element, options?: MouseEventInit): Promise<void> {
    options = Object.assign({ bubbles: true }, options);
    el.dispatchEvent(new MouseEvent('mousedown', options));
    await nextTickFrame();
    el.dispatchEvent(new MouseEvent('mouseup', options));
    await nextTick();
    el.dispatchEvent(new MouseEvent('click', options));
    await nextTickFrame();
}

/**
 * simple simulation of a keydown on an element
 *
 * @param el
 * @param options
 */
export async function keydown(el: Element, key: string): Promise<void> {
    el.dispatchEvent(
        new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
        }),
    );
    await nextTickFrame();
}
