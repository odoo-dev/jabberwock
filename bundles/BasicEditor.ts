import JWEditor from '../packages/core/src/JWEditor';
import { Dom } from '../packages/plugin-dom/Dom';
import { Char } from '../packages/plugin-char/Char';
import { LineBreak } from '../packages/plugin-linebreak/LineBreak';
import { Heading } from '../packages/plugin-heading/Heading';
import { Paragraph } from '../packages/plugin-paragraph/Paragraph';
import { List } from '../packages/plugin-list/List';
import { Indent } from '../packages/plugin-indent/src/Indent';
import { ParagraphNode } from '../packages/plugin-paragraph/ParagraphNode';
import { Span } from '../packages/plugin-span/Span';
import { Bold } from '../packages/plugin-bold/Bold';
import { Italic } from '../packages/plugin-italic/Italic';
import { Underline } from '../packages/plugin-underline/Underline';
import { Inline } from '../packages/plugin-inline/Inline';
import { Link } from '../packages/plugin-link/Link';
import { Divider } from '../packages/plugin-divider/Divider';
import { Image } from '../packages/plugin-image/Image';

export class BasicEditor extends JWEditor {
    constructor(editable?: HTMLElement) {
        super(editable);
        this.loadConfig({
            createBaseContainer: () => new ParagraphNode(),
            plugins: [
                Dom,
                Inline,
                Char,
                LineBreak,
                Heading,
                Paragraph,
                List,
                Indent,
                Span,
                Bold,
                Italic,
                Underline,
                Link,
                Divider,
                Image,
            ],
        });
    }
}
