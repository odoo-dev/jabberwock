import JWEditor, { JWEditorConfig } from '../core/src/JWEditor';

export function createBasicEditor(editable?: HTMLElement, config?: JWEditorConfig): JWEditor {
    const editor = new JWEditor(editable);
    editor.loadConfig(config || {});
    return editor;
}
