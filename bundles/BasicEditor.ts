import JWEditor from '../packages/core/src/JWEditor';
import { Parser } from '../packages/plugin-parser/src/Parser';
import { Dom } from '../packages/plugin-dom/src/Dom';
import { Char } from '../packages/plugin-char/src/Char';
import { LineBreak } from '../packages/plugin-linebreak/src/LineBreak';
import { Heading } from '../packages/plugin-heading/src/Heading';
import { Paragraph } from '../packages/plugin-paragraph/src/Paragraph';
import { List } from '../packages/plugin-list/src/List';
import { Indent } from '../packages/plugin-indent/src/Indent';
import { ParagraphNode } from '../packages/plugin-paragraph/src/ParagraphNode';
import { Span } from '../packages/plugin-span/src/Span';
import { Bold } from '../packages/plugin-bold/src/Bold';
import { Italic } from '../packages/plugin-italic/src/Italic';
import { Underline } from '../packages/plugin-underline/src/Underline';
import { Inline } from '../packages/plugin-inline/src/Inline';
import { Link } from '../packages/plugin-link/src/Link';
import { Divider } from '../packages/plugin-divider/src/Divider';
import { Image } from '../packages/plugin-image/src/Image';
import { Subscript } from '../packages/plugin-subscript/src/Subscript';
import { Superscript } from '../packages/plugin-superscript/src/Superscript';
import { Blockquote } from '../packages/plugin-blockquote/src/Blockquote';
import { Youtube } from '../packages/plugin-youtube/src/Youtube';
import { Table } from '../packages/plugin-table/src/Table';
import { Metadata } from '../packages/plugin-metadata/src/Metadata';

export class BasicEditor extends JWEditor {
    constructor() {
        super();

        this.configure({
            createBaseContainer: () => new ParagraphNode(),
            plugins: [
                [Parser],
                [Dom],
                [Inline],
                [Char],
                [LineBreak],
                [Heading],
                [Paragraph],
                [List],
                [Indent],
                [Span],
                [Bold],
                [Italic],
                [Underline],
                [Link],
                [Divider],
                [Image],
                [Subscript],
                [Superscript],
                [Blockquote],
                [Youtube],
                [Table],
                [Metadata],
            ],
        });
    }
}
