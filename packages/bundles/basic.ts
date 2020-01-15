import JWEditor, { JWEditorConfig } from '../core/src/JWEditor';
import { Char } from '../plugin-char/Char';

export function createBasicEditor(editable?: HTMLElement, config?: JWEditorConfig): JWEditor {
    const editor = new JWEditor(editable);
    editor.addPlugin(Char);
    editor.loadConfig(config || {});
    return editor;
}
