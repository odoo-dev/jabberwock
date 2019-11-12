import JWEditor from '../JWEditor';
import { expect } from 'chai';

export interface TestEditorSpec {
    contentBefore: string;
    contentAfter: string;
}

/**
 * Test the editor
 *
 * @param spec
 */
export function testEditor(spec: TestEditorSpec): void {
    const wrapper = document.createElement('p');
    wrapper.innerHTML = spec.contentBefore;
    document.body.appendChild(wrapper);

    const editor = new JWEditor(wrapper);
    editor.start();

    editor.renderer.render(editor.vDocument, editor.editable);

    expect(editor.editable.innerHTML).to.deep.equal(spec.contentAfter);

    editor.stop();
    wrapper.remove();
}
