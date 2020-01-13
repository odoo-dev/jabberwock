import JWEditor, { JWEditorConfig } from '../core/src/JWEditor';
import { Char } from '../plugin-char/Char';
import { LineBreak } from '../plugin-linebreak/LineBreak';
import { Heading } from '../plugin-heading/Heading';

export function createBasicEditor(editable?: HTMLElement, config?: JWEditorConfig): JWEditor {
    const editor = new JWEditor(editable);
    editor.addPlugin(Char);
    editor.addPlugin(LineBreak);
    editor.addPlugin(Heading);
    editor.loadConfig(config || {});
    return editor;
}
