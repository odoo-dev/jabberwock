import JWEditor from '../packages/core/src/JWEditor';
import { Parser } from '../packages/plugin-parser/src/Parser';
import { Html } from '../packages/plugin-html/src/Html';
import { Char } from '../packages/plugin-char/src/Char';
import { LineBreak } from '../packages/plugin-linebreak/src/LineBreak';
import { Heading } from '../packages/plugin-heading/src/Heading';
import { Paragraph } from '../packages/plugin-paragraph/src/Paragraph';
import { List } from '../packages/plugin-list/src/List';
import { Indent } from '../packages/plugin-indent/src/Indent';
import { ParagraphNode } from '../packages/plugin-paragraph/src/ParagraphNode';
import { LineBreakNode } from '../packages/plugin-linebreak/src/LineBreakNode';
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
import { Renderer } from '../packages/plugin-renderer/src/Renderer';
import { Keymap } from '../packages/plugin-keymap/src/Keymap';
import { Align } from '../packages/plugin-align/src/Align';
import { Pre } from '../packages/plugin-pre/src/Pre';
import { TextColor } from '../packages/plugin-textcolor/src/TextColor';
import { BackgroundColor } from '../packages/plugin-backgroundcolor/src/BackgroundColor';
import { Layout } from '../packages/plugin-layout/src/Layout';
import { DomLayout } from '../packages/plugin-dom-layout/src/DomLayout';
import { DomEditable } from '../packages/plugin-dom-editable/src/DomEditable';
import { VNode } from '../packages/core/src/VNodes/VNode';
import { Input } from '../packages/plugin-input/src/Input';
import { Dialog } from '../packages/plugin-dialog/src/Dialog';
import { FollowRange } from '../packages/plugin-dom-follow-range/src/FollowRange';

import template from './basicLayout.xml';
import './basicLayout.css';
import { OdooField } from '../packages/plugin-odoo-field/src/OdooField';

export class BasicEditor extends JWEditor {
    constructor() {
        super();

        this.configure({
            defaults: {
                Container: ParagraphNode,
                Separator: LineBreakNode,
            },
            plugins: [
                [Parser],
                [Renderer],
                [Layout],
                [Keymap],
                [Html],
                [DomLayout],
                [DomEditable],
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
                [Align],
                [Pre],
                [TextColor],
                [BackgroundColor],
                [Input],
                [Dialog],
                [FollowRange],
                [OdooField],
            ],
        });
        this.configure(DomLayout, {
            components: [
                {
                    id: 'editor',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                },
            ],
            componentZones: [['editor', 'root']],
        });
    }
}
