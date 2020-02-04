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
import { ToolbarTop } from '../packages/plugin-toolbar/src/ToolbarTop';
import {
    ParagraphButton,
    Heading1Button,
    Heading2Button,
    Heading3Button,
    Heading4Button,
    Heading5Button,
    Heading6Button,
} from '../packages/plugin-heading/HeadingButtons';
import { BoldButton } from '../packages/plugin-bold/BoldButtons';
import { ItalicButton } from '../packages/plugin-italic/ItalicButtons';
import { UnderlineButton } from '../packages/plugin-underline/UnderlineButtons';
import { OrderedListButton, UnorderedListButton } from '../packages/plugin-list/ListButtons';
import { IndentButton, OutdentButton } from '../packages/plugin-indent/src/IndentButtons';

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
                ToolbarTop,
            ],
            toolbar: [
                [
                    [
                        ParagraphButton,
                        Heading1Button,
                        Heading2Button,
                        Heading3Button,
                        Heading4Button,
                        Heading5Button,
                        Heading6Button,
                    ],
                ],
                [BoldButton, ItalicButton, UnderlineButton],
                [OrderedListButton, UnorderedListButton],
                [IndentButton, OutdentButton],
            ],
        });
    }
}
