import JWEditor, { JWEditorConfig } from '../core/src/JWEditor';
import { Char } from '../plugin-char/Char';
import { LineBreak } from '../plugin-linebreak/LineBreak';
import { Heading } from '../plugin-heading/Heading';
import { Paragraph } from '../plugin-paragraph/Paragraph';

export function createBasicEditor(editable?: HTMLElement, config?: JWEditorConfig): JWEditor {
    const editor = new JWEditor(editable);
    editor.addPlugins(Char, LineBreak, Heading, Paragraph);
    editor.loadConfig(config || {});
    return editor;
}
