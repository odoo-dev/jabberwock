import JWEditor from '../../core/src/JWEditor';
import { expect } from 'chai';
import { DomSelectionDescription } from '../../plugin-dom-editable/src/EventNormalizer';
import { removeFormattingSpace } from './formattingSpace';
import { Direction, ANCHOR_CHAR, FOCUS_CHAR } from '../../core/src/VSelection';
import { JWPlugin } from '../../core/src/JWPlugin';
import { DevTools } from '../../plugin-devtools/src/DevTools';
import { SuiteFunction, Suite } from 'mocha';
import { targetDeepest } from './Dom';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { parseEditable } from './configuration';
import { Html } from '../../plugin-html/src/Html';

export interface TestEditorSpec {
    contentBefore: string;
    contentAfter?: string;
    beforeStart?: (editor: JWEditor) => void | Promise<void>;
    stepFunction?: (editor: JWEditor) => void | Promise<void>;
    devtools?: boolean;
    debug?: boolean;
}

export type EditorTestSuite = (
    testEditor: (editor: typeof JWEditor | TestEditorSpec, spec?: TestEditorSpec) => Promise<void>,
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
export const describePlugin = ((): {
    (Plugin: typeof JWPlugin, callback: EditorTestSuite): Suite;
    only: (Plugin: typeof JWPlugin, callback: EditorTestSuite) => Suite;
    skip: (Plugin: typeof JWPlugin, callback: EditorTestSuite) => Suite | void;
} => {
    function describePlugin(
        suite: SuiteFunction,
        Plugin: typeof JWPlugin,
        callback: EditorTestSuite,
    ): Suite {
        const testEditor = testPlugin.bind(this, Plugin);
        return suite('Plugin: ' + Plugin.name, callback.bind(this, testEditor));
    }
    return Object.assign(describePlugin.bind(this, describe), {
        only: describePlugin.bind(this, describe.only),
        skip: describePlugin.bind(this, describe.skip),
    });
})();

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
    const container = document.createElement('jw-container-test');
    document.body.appendChild(container);
    const editor = initSpec(Editor, spec, container);
    try {
        await testSpec(editor, spec);
    } catch (e) {
        if (!spec.debug) {
            container.remove();
        }
        throw e;
    }
    if (!spec.debug) {
        container.remove();
    }
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
    const container = document.createElement('jw-container-test');
    document.body.appendChild(container);
    const editor = initSpec(Editor, spec, container);
    editor.load(Plugin);
    try {
        await testSpec(editor, spec);
    } catch (e) {
        if (!spec.debug) {
            container.remove();
        }
        throw e;
    }
    if (!spec.debug) {
        container.remove();
    }
}

/**
 * Init a new editor with the given spec in the given test container.
 *
 * @param container
 * @param spec
 */
function initSpec(Editor: typeof JWEditor, spec: TestEditorSpec, container: HTMLElement): JWEditor {
    const target = document.createElement('jw-test');
    target.innerHTML = spec.contentBefore;
    const selection = _parseTextualSelection(target);
    container.appendChild(target);
    if (selection) {
        setSelection(selection);
    } else {
        document.getSelection().removeAllRanges();
    }
    const editor = new Editor();
    // Add Html plugin to use parseEditable utils.
    editor.load(Html);
    editor.configure(DomLayout, {
        location: [target, 'replace'],
        components: [
            {
                id: 'editable',
                render: async (editor: JWEditor): Promise<VNode[]> => parseEditable(editor, target),
            },
        ],
        componentZones: [['editable', ['main']]],
    });
    return editor;
}

/**
 * Test the given spec on the given editor.
 *
 * @param editor
 * @param spec
 */
async function testSpec(editor: JWEditor, spec: TestEditorSpec): Promise<void> {
    // Forward debug mode from the spec to the editor.
    if (spec.devtools) {
        editor.load(DevTools);
    }

    if (spec.beforeStart) {
        await spec.beforeStart(editor);
    }

    // Start the editor and execute the step code.
    await editor.start();

    if (spec.stepFunction) {
        try {
            await spec.stepFunction(editor);
        } catch (e) {
            await editor.stop();
            throw e;
        }
    }

    if (spec.contentAfter) {
        // Render the selection in the test container and test the result.
        renderTextualSelection();
        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
        const editable = domEngine.components.editable[0];
        const domEditable = domEngine.getDomNodes(editable)[0] as Element;
        const value = domEditable.innerHTML;
        if (!spec.debug) {
            await editor.stop();
        }
        expect(value).to.equal(spec.contentAfter);
    } else if (!spec.debug) {
        await editor.stop();
    }
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
export function setSelection(selection: DomSelectionDescription): void {
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
export function renderTextualSelection(): void {
    const selection = document.getSelection();
    if (selection.rangeCount === 0) return;

    const anchor = targetDeepest(selection.anchorNode, selection.anchorOffset);
    const focus = targetDeepest(selection.focusNode, selection.focusOffset);

    // If the range characters have to be inserted within the same parent and
    // the anchor range character has to be before the focus range character,
    // the focus offset needs to be adapted to account for the first insertion.
    const [anchorNode, anchorOffset] = anchor;
    const [focusNode, baseFocusOffset] = focus;
    let focusOffset = baseFocusOffset;
    if (anchorNode === focusNode && anchorOffset <= focusOffset) {
        focusOffset++;
    }
    _insertCharAt(ANCHOR_CHAR, ...anchor);
    _insertCharAt(FOCUS_CHAR, focusNode, focusOffset);
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
    el.scrollIntoView();
    await nextTickFrame();
    const pos = el.getBoundingClientRect();
    options = Object.assign(
        {
            bubbles: true,
            clientX: pos.left + 1,
            clientY: pos.top + 1,
        },
        options,
    );
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
export async function keydown(el: Element, key: string, options = {}): Promise<void> {
    el.dispatchEvent(
        new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
            ...options,
        }),
    );
    await nextTickFrame();
}

/**
 * Unformat the given html in order to use it with `innerHTML`.
 *
 * @param html
 */
export function unformat(html: string): string {
    return html
        .replace(/(^|[^ ])[\s\n]+([^<>]*?)</g, '$1$2<')
        .replace(/>([^<>]*?)[\s\n]+([^ ]|$)/g, '>$1$2');
}
