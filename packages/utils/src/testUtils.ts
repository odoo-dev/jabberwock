import JWEditor from '../../core/src/JWEditor';
import { expect } from 'chai';
import { DomSelectionDescription } from '../../core/src/EventNormalizer';
import { removeFormattingSpace } from './formattingSpace';
import { Direction, ANCHOR_CHAR, FOCUS_CHAR } from '../../core/src/VSelection';
import { JWPlugin } from '../../core/src/JWPlugin';
import { DevTools } from '../../plugin-devtools/src/DevTools';

export interface TestEditorSpec {
    contentBefore: string;
    contentAfter?: string;
    stepFunction?: (editor: JWEditor) => void;
    debug?: boolean;
}

export type EditorTestSuite = (
    tesEditor: (editor: typeof JWEditor | TestEditorSpec, spec?: TestEditorSpec) => Promise<void>,
) => void;

/**
 * Describe the given plugin by the given test suite callback. The test suite
 * callback will be called with a `testEditor` argument which has the same
 * signature as the classic `testEditor` but will automatically be loaded with
 * the described plugin.
 *
 * Example:
 * describePlugin(PluginClass, testEditor => {
 *     // The JWEditor instance will have the described plugin installed.
 *     testEditor({
 *         // test specs
 *     });
 *     // The EditorClass instance will have the described plugin installed.
 *     testEditor(EditorClass, {
 *         // test specs
 *     });
 * });
 *
 * @param Plugin
 * @param callback
 */
export function describePlugin(Plugin: typeof JWPlugin, callback: EditorTestSuite): void {
    const testEditor = testPlugin.bind(this, Plugin);
    describe('Plugin: ' + Plugin.name, callback.bind(this, testEditor));
}

/**
 * Automatically spawn a new editor to test the given spec.
 *
 * @param spec
 */
export async function testEditor(spec: TestEditorSpec): Promise<void>;
export async function testEditor(Editor: typeof JWEditor, spec: TestEditorSpec): Promise<void>;
export async function testEditor(
    Editor: typeof JWEditor | TestEditorSpec,
    spec?: TestEditorSpec,
): Promise<void> {
    if ('contentBefore' in Editor) {
        spec = Editor;
        Editor = JWEditor;
    }
    const container = document.createElement('p');
    const editor = initSpec(Editor, spec, container);
    await testSpec(editor, spec);
    container.remove();
}

/**
 * Automatically spawn a new editor with given plugin to test the given spec.
 *
 * @param Plugin
 * @param spec
 */
async function testPlugin(Plugin: typeof JWPlugin, spec: TestEditorSpec): Promise<void>;
async function testPlugin(
    Plugin: typeof JWPlugin,
    Editor: typeof JWEditor,
    spec: TestEditorSpec,
): Promise<void>;
async function testPlugin(
    Plugin: typeof JWPlugin,
    Editor: typeof JWEditor | TestEditorSpec,
    spec?: TestEditorSpec,
): Promise<void> {
    if ('contentBefore' in Editor) {
        spec = Editor;
        Editor = JWEditor;
    }
    const container = document.createElement('p');
    const editor = initSpec(Editor, spec, container);
    editor.addPlugin(Plugin);
    await testSpec(editor, spec);
    container.remove();
}

/**
 * Init a new editor with the given spec in the given test container.
 *
 * @param container
 * @param spec
 */
function initSpec(Editor: typeof JWEditor, spec: TestEditorSpec, container: HTMLElement): JWEditor {
    container.innerHTML = spec.contentBefore;
    const selection = _parseTextualSelection(container);
    document.body.appendChild(container);
    if (selection) {
        _setSelection(selection);
    }
    return new Editor(container);
}

/**
 * Test the given spec on the given editor.
 *
 * @param editor
 * @param spec
 */
async function testSpec(editor: JWEditor, spec: TestEditorSpec): Promise<void> {
    // Forward debug mode from the spec to the editor.
    if (spec.debug) {
        editor.addPlugin(DevTools);
    }

    // Start the editor and execute the step code.
    await editor.start();
    if (spec.stepFunction) {
        spec.stepFunction(editor);
    }

    // Render the selection in the test container and test the result.
    _renderTextualSelection();
    if (spec.contentAfter) {
        expect(editor.editable.innerHTML).to.deep.equal(spec.contentAfter);
    }
    editor.stop();
}

/**
 * Return a description of a selection from analysing the position of the
 * characters representing the selection within a test container.
 * Parsing the selection removes these characters from the test container.
 *
 * @param testContainer
 */
function _parseTextualSelection(testContainer: Node): DomSelectionDescription {
    let anchorNode: Node;
    let anchorOffset: number;
    let focusNode: Node;
    let focusOffset: number;
    let direction = Direction.FORWARD;

    let node = testContainer;
    while (node && !(anchorNode && focusNode)) {
        let next: Node;
        if (node.nodeType === Node.TEXT_NODE) {
            // Look for special characters in the text content and remove them.
            const anchorIndex = node.textContent.indexOf(ANCHOR_CHAR);
            node.textContent = node.textContent.replace(ANCHOR_CHAR, '');
            const focusIndex = node.textContent.indexOf(FOCUS_CHAR);
            node.textContent = node.textContent.replace(FOCUS_CHAR, '');

            // Set the nodes and offsets if we found the selection characters.
            if (anchorIndex !== -1) {
                [anchorNode, anchorOffset] = _toDomLocation(node, anchorIndex);
                // If the focus node has already been found by this point then
                // it is before the anchor node, so the selection is backward.
                if (focusNode) {
                    direction = Direction.BACKWARD;
                }
            }
            if (focusIndex !== -1) {
                [focusNode, focusOffset] = _toDomLocation(node, focusIndex);
                // If the anchor character is within the same parent and is
                // after the focus character, then the selection is backward.
                // Adapt the anchorOffset to account for the focus character
                // that was removed.
                if (anchorNode === focusNode && anchorOffset > focusOffset) {
                    direction = Direction.BACKWARD;
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
            direction: direction,
        };
    }
}
/**
 * Set a range in the DOM.
 *
 * @param selection
 */
function _setSelection(selection: DomSelectionDescription): void {
    const domRange = document.createRange();
    if (selection.direction === Direction.FORWARD) {
        domRange.setStart(selection.anchorNode, selection.anchorOffset);
        domRange.collapse(true);
    } else {
        domRange.setEnd(selection.anchorNode, selection.anchorOffset);
        domRange.collapse(false);
    }
    const domSelection = selection.anchorNode.ownerDocument.getSelection();
    domSelection.removeAllRanges();
    domSelection.addRange(domRange);
    domSelection.extend(selection.focusNode, selection.focusOffset);
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
 * - `SELECTION_ANCHOR_CHAR` in place for the selection start
 * - `SELECTION_FOCUS_CHAR` in place for the selection end
 *
 * This is used in the function `testEditor`.
 */
function _renderTextualSelection(): void {
    const selection = document.getSelection();
    if (selection.rangeCount === 0) return;

    const anchor = _targetDeepest(selection.anchorNode, selection.anchorOffset);
    const focus = _targetDeepest(selection.focusNode, selection.focusOffset);

    // If the range characters have to be inserted within the same parent and
    // the start range character has to be before the end range character, the
    // end offset needs to be adapted to account for the anchor insertion.
    if (anchor.container === focus.container && anchor.offset <= focus.offset) {
        focus.offset++;
    }

    _insertCharAt(ANCHOR_CHAR, anchor.container, anchor.offset);
    _insertCharAt(FOCUS_CHAR, focus.container, focus.offset);
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
