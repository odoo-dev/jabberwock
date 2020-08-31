import JWEditor, { JWEditorConfig, Loadables } from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';
import { DomObjectRenderer } from '../plugin-renderer-dom-object/src/DomObjectRenderer';
import { Html } from '../plugin-html/src/Html';
import { Char } from '../plugin-char/src/Char';
import { LineBreak } from '../plugin-linebreak/src/LineBreak';
import { Heading } from '../plugin-heading/src/Heading';
import { Paragraph } from '../plugin-paragraph/src/Paragraph';
import { List } from '../plugin-list/src/List';
import { Indent } from '../plugin-indent/src/Indent';
import { ParagraphNode } from '../plugin-paragraph/src/ParagraphNode';
import { LineBreakNode } from '../plugin-linebreak/src/LineBreakNode';
import { Span } from '../plugin-span/src/Span';
import { Bold } from '../plugin-bold/src/Bold';
import { Italic } from '../plugin-italic/src/Italic';
import { Underline } from '../plugin-underline/src/Underline';
import { Inline } from '../plugin-inline/src/Inline';
import { Link } from '../plugin-link/src/Link';
import { Divider } from '../plugin-divider/src/Divider';
import { Image } from '../plugin-image/src/Image';
import { Subscript } from '../plugin-subscript/src/Subscript';
import { Superscript } from '../plugin-superscript/src/Superscript';
import { Blockquote } from '../plugin-blockquote/src/Blockquote';
import { Youtube } from '../plugin-youtube/src/Youtube';
import { Table } from '../plugin-table/src/Table';
import { Metadata } from '../plugin-metadata/src/Metadata';
import { Renderer } from '../plugin-renderer/src/Renderer';
import { Keymap } from '../plugin-keymap/src/Keymap';
import { Align } from '../plugin-align/src/Align';
import { Pre } from '../plugin-pre/src/Pre';
import { TextColor } from '../plugin-textcolor/src/TextColor';
import { BackgroundColor } from '../plugin-backgroundcolor/src/BackgroundColor';
import { Layout } from '../plugin-layout/src/Layout';
import { DomLayout } from '../plugin-dom-layout/src/DomLayout';
import { DomEditable } from '../plugin-dom-editable/src/DomEditable';
import { History } from '../plugin-history/src/History';
import { VNode } from '../core/src/VNodes/VNode';
import { Input } from '../plugin-input/src/Input';
import { Dialog } from '../plugin-dialog/src/Dialog';
import { FollowRange } from '../plugin-dom-follow-range/src/FollowRange';
import { Toolbar } from '../plugin-toolbar/src/Toolbar';
import { Textarea } from '../plugin-textarea/src/Textarea';

import template from './basicLayout.xml';
import './basicLayout.css';
import { OdooField } from '../plugin-odoo-field/src/OdooField';
import { parseEditable, createEditable } from '../utils/src/configuration';
import { Fullscreen } from '../plugin-fullscreen/src/Fullscreen';
import { Code } from '../plugin-code/src/Code';
import { FontSize } from '../plugin-font-size/src/FontSize';
import { Button } from '../plugin-button/src/Button';

export class BasicEditor extends JWEditor {
    constructor(params?: { editable?: HTMLElement }) {
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
                [DomObjectRenderer],
                [Html],
                [DomLayout],
                [DomEditable],
                [History],
                [Inline],
                [Char],
                [LineBreak],
                [Heading],
                [Paragraph],
                [Textarea],
                [List],
                [Indent],
                [FontSize],
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
                [Fullscreen, { component: 'editor' }],
                [OdooField],
                [Code],
                [Button],
            ],
        });

        const config: JWEditorConfig & { loadables: Loadables<Layout> } = {
            loadables: {
                components: [
                    {
                        id: 'editor',
                        render(editor: JWEditor): Promise<VNode[]> {
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                componentZones: [['editor', ['root']]],
            },
        };
        this.configure(config);
        this.configure(DomLayout, {
            location: params?.editable ? [params.editable, 'replace'] : null,
            components: [
                {
                    id: 'editable',
                    render: async (editor: JWEditor): Promise<VNode[]> => {
                        if (params?.editable) {
                            return parseEditable(editor, params.editable);
                        } else {
                            return createEditable(editor);
                        }
                    },
                },
            ],
            componentZones: [['editable', ['main']]],
        });
        this.configure(Toolbar, {
            layout: [
                [
                    [
                        'ParagraphButton',
                        'Heading1Button',
                        'Heading2Button',
                        'Heading3Button',
                        'Heading4Button',
                        'Heading5Button',
                        'Heading6Button',
                        'PreButton',
                    ],
                ],
                ['BoldButton', 'ItalicButton', 'UnderlineButton', 'RemoveFormatButton'],
                ['AlignLeftButton', 'AlignCenterButton', 'AlignRightButton', 'AlignJustifyButton'],
                ['OrderedListButton', 'UnorderedListButton', 'ChecklistButton'],
                ['IndentButton', 'OutdentButton'],
                ['LinkButton', 'UnlinkButton'],
                ['TableButton'],
                ['CodeButton'],
                ['UndoButton', 'RedoButton'],
            ],
        });
    }
}
