import JWEditor from '../packages/core/src/JWEditor';
import { Char } from '../packages/plugin-char/Char';
import { LineBreak } from '../packages/plugin-linebreak/LineBreak';
import { Heading } from '../packages/plugin-heading/Heading';
import { Paragraph } from '../packages/plugin-paragraph/Paragraph';

export class BasicEditor extends JWEditor {
    constructor(editable?: HTMLElement) {
        super(editable);
        this.addPlugins(Char, LineBreak, Heading, Paragraph);
    }
}
