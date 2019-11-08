import JWEditor from '../JWEditor';
import { expect } from 'chai';
import { ParsingOptions } from './Parser';
import { RANGE_HEAD_CHAR, RANGE_TAIL_CHAR } from '../stores/VRange';

interface RenderOptions {
    renderTextualRange: boolean;
}

export interface TestEditorSpec {
    contentBefore: string;
    contentAfter: string;
    parsingOptions?: ParsingOptions;
    renderingOptions?: RenderOptions;
    stepFunction?: (editor: JWEditor) => void;
}

/**
 * Test the editor
 *
 * @param spec
 */
export function testEditor(spec: TestEditorSpec): void {
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
    editor.start(spec.parsingOptions);
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
 * Ths is used in the function `testEditor`.
 *
 * TODO: implement differently
 */
function _renderTextualRange(): void {
    const selection = document.getSelection();

    const startContainer = selection.anchorNode;
    const startOffset = selection.anchorOffset;
    const endContainer = selection.focusNode;
    const endOffset = selection.focusOffset;
    const endValue = endContainer.nodeValue;

    if (endContainer.nodeType === Node.TEXT_NODE) {
        endContainer.nodeValue =
            endValue.slice(0, endOffset) +
            RANGE_HEAD_CHAR +
            endValue.slice(endOffset, endValue.length);
    } else {
        endContainer.insertBefore(
            document.createTextNode(RANGE_HEAD_CHAR),
            endContainer.childNodes[endOffset + 1],
        );
    }
    if (startContainer.nodeType === Node.TEXT_NODE) {
        const startValue = startContainer.nodeValue;
        startContainer.nodeValue =
            startValue.slice(0, startOffset) +
            RANGE_TAIL_CHAR +
            startValue.slice(startOffset, startValue.length);
    } else {
        startContainer.insertBefore(
            document.createTextNode(RANGE_TAIL_CHAR),
            startContainer.childNodes[startOffset + 1],
        );
    }
}
