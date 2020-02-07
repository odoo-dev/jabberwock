import JWEditor from '../packages/core/src/JWEditor';
import { Dom } from '../packages/plugin-dom/Dom';
import { Char } from '../packages/plugin-char/Char';
import { LineBreak } from '../packages/plugin-linebreak/LineBreak';
import { Heading } from '../packages/plugin-heading/Heading';
import { Paragraph } from '../packages/plugin-paragraph/Paragraph';
import { List } from '../packages/plugin-list/List';
import { Indent } from '../packages/plugin-indent/src/Indent';

export class BasicEditor extends JWEditor {
    constructor(editable?: HTMLElement) {
        super(editable);
        this.loadConfig({
            plugins: [Dom, Char, LineBreak, Heading, Paragraph, List, Indent],
        });
    }
}
