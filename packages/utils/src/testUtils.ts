import JWEditor from '../../core/src/JWEditor';
import { expect } from 'chai';
import { ParsingOptions } from '../../core/src/Parser';
import { RANGE_HEAD_CHAR, RANGE_TAIL_CHAR } from '../../core/src/VRange';

interface RenderOptions {
    renderTextualRange: boolean;
}

export interface TestEditorSpec {
    contentBefore: string;
    contentAfter: string;
    parsingOptions?: ParsingOptions;
    renderingOptions?: RenderOptions;
    stepFunction?: (editor: JWEditor) => void;
    debug?: boolean;
}

/**
 * Test the editor
 *
 * @param spec
 */
export async function testEditor(spec: TestEditorSpec): Promise<void> {
    if (!spec.renderingOptions) {
        spec.renderingOptions = { renderTextualRange: true };
    }
    if (!spec.parsingOptions) {
        spec.parsingOptions = { parseTextualRange: true };
    }
    const wrapper = document.createElement('p');
    wrapper.innerHTML = spec.contentBefore;
    document.body.appendChild(wrapper);

    const editor = new JWEditor(wrapper);
    if (spec.debug === true) {
        editor.loadConfig({
            debug: true,
        });
    }
    await editor.start(spec.parsingOptions);
    if (spec.stepFunction) {
        spec.stepFunction(editor);
    }

    if (spec.renderingOptions.renderTextualRange) {
        _renderTextualRange();
    }

    expect(editor.editable.innerHTML).to.deep.equal(spec.contentAfter);

    editor.stop();
    wrapper.remove();
}

/**
 * Insert in the DOM:
 * - `RANGE_TAIL_CHAR` in place for the selection start
 * - `RANGE_HEAD_CHAR` in place for the selection end
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

    _insertCharAt(RANGE_TAIL_CHAR, start.container, start.offset);
    _insertCharAt(RANGE_HEAD_CHAR, end.container, end.offset);
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
