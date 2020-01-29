import JWEditor from '../packages/core/src/JWEditor';
import { ContentEditable } from '../packages/plugin-contentEditable/ContentEditable';
import { Char } from '../packages/plugin-char/Char';
import { LineBreak } from '../packages/plugin-linebreak/LineBreak';
import { Heading } from '../packages/plugin-heading/Heading';
import { Paragraph } from '../packages/plugin-paragraph/Paragraph';
import { List } from '../packages/plugin-list/List';

export class BasicEditor extends JWEditor {
    constructor() {
        super();
        this.loadConfig({
            plugins: [ContentEditable, Char, LineBreak, Heading, Paragraph, List],
        });
    }
}
