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

import './basicLayout.css';
import { OdooSnippet } from '../packages/plugin-odoo-snippets/src/OdooSnippet';

import { Toolbar } from '../packages/plugin-toolbar/src/Toolbar';
import { ParagraphButton } from '../packages/plugin-heading/src/HeadingButtons';
import { Heading1Button } from '../packages/plugin-heading/src/HeadingButtons';
import { Heading2Button } from '../packages/plugin-heading/src/HeadingButtons';
import { Heading3Button } from '../packages/plugin-heading/src/HeadingButtons';
import { Heading4Button } from '../packages/plugin-heading/src/HeadingButtons';
import { Heading5Button } from '../packages/plugin-heading/src/HeadingButtons';
import { Heading6Button } from '../packages/plugin-heading/src/HeadingButtons';
import { PreButton } from '../packages/plugin-pre/src/PreButtons';
import { BoldButton } from '../packages/plugin-bold/src/BoldButtons';
import { ItalicButton } from '../packages/plugin-italic/src/ItalicButtons';
import { UnderlineButton } from '../packages/plugin-underline/src/UnderlineButtons';
import { OrderedListButton } from '../packages/plugin-list/src/ListButtons';
import { UnorderedListButton } from '../packages/plugin-list/src/ListButtons';
import { IndentButton } from '../packages/plugin-indent/src/IndentButtons';
import { OutdentButton } from '../packages/plugin-indent/src/IndentButtons';
import { SaveButton } from '../packages/plugin-odoo-snippets/src/SaveButton';
import { HtmlNode } from '../packages/plugin-html/src/HtmlNode';
import { MediaButton } from '../packages/plugin-odoo-snippets/src/MediaButton';
import { CommandImplementation, CommandIdentifier } from '../packages/core/src/Dispatcher';
import { JWPlugin } from '../packages/core/src/JWPlugin';
import { OdooVideo } from '../packages/plugin-odoo-video/src/OdooVideo';
import { LinkButton } from '../packages/plugin-odoo-snippets/src/LinkButton';
import { DomZonePosition } from '../packages/plugin-layout/src/LayoutEngine';
import { HtmlDomRenderingEngine } from '../packages/plugin-html/src/HtmlDomRenderingEngine';
import {
    AlignLeftButton,
    AlignCenterButton,
    AlignRightButton,
    AlignJustifyButton,
} from '../packages/plugin-align/src/AlignButtons';

interface OdooWebsiteEditorOption {
    source: HTMLElement;
    location: [Node, DomZonePosition];
    customCommands: Record<CommandIdentifier, CommandImplementation>;
    afterRender?: Function;
    snippetMenuElement?: HTMLElement;
    snippetManipulators?: HTMLElement;
    template?: string;
    // todo: Remove when configuring the toolbar in another way.
    saveButton?: boolean;
}

export class OdooWebsiteEditor extends JWEditor {
    constructor(options: OdooWebsiteEditorOption) {
        super();
        class CustomPlugin extends JWPlugin {
            commands = options.customCommands;
        }

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
                [OdooSnippet],
                [OdooVideo],
                [CustomPlugin],
            ],
        });
        this.configure(Toolbar, {
            layout: [
                [
                    [
                        ParagraphButton,
                        Heading1Button,
                        Heading2Button,
                        Heading3Button,
                        Heading4Button,
                        Heading5Button,
                        Heading6Button,
                        PreButton,
                    ],
                ],
                [BoldButton, ItalicButton, UnderlineButton],
                [AlignLeftButton, AlignCenterButton, AlignRightButton, AlignJustifyButton],
                [OrderedListButton, UnorderedListButton],
                [IndentButton, OutdentButton],
                [LinkButton],
                [MediaButton],
                ...(options.saveButton ? [[SaveButton]] : []),
            ],
        });

        const defaultTemplate = `
        <t t-zone="float"/>
        <t t-zone="default"/>
        <div class="wrap_editor d-flex flex-column">
            <div class="d-flex flex-row overflow-auto">
                <t t-zone="main_sidebar"/>
                <div class="d-flex flex-column overflow-auto o_editor_center">
                    <div class="o_toolbar">
                        <t t-zone="tools"/>
                    </div>
                    <div class="d-flex overflow-auto">
                        <t t-zone="snippetManipulators"/>
                        <t t-zone="main"/>
                    </div>
                </div>
            </div>
            <div class="o_debug_zone">
                <t t-zone="debug"/>
            </div>
        </div>
    `;
        this.configure(DomLayout, {
            components: [
                {
                    id: 'main_template',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse('text/html', options.template || defaultTemplate);
                    },
                },
                {
                    id: 'snippet_menu',
                    render(): Promise<VNode[]> {
                        const node: VNode = options.snippetMenuElement
                            ? new HtmlNode({ domNode: options.snippetMenuElement })
                            : new LineBreakNode();
                        return Promise.resolve([node]);
                    },
                },
                {
                    id: 'snippetManipulators',
                    render(): Promise<VNode[]> {
                        const node: VNode = options.snippetMenuElement
                            ? new HtmlNode({ domNode: options.snippetManipulators })
                            : new LineBreakNode();
                        return Promise.resolve([node]);
                    },
                },
            ],
            componentZones: [
                ['main_template', 'root'],
                ['snippet_menu', 'main_sidebar'],
                ['snippetManipulators', 'snippetManipulators'],
            ],
            location: options.location,
            afterRender: options.afterRender,
        });
        this.configure(DomEditable, {
            autoFocus: true,
            source: options.source.firstElementChild as HTMLElement,
        });
    }

    /**
     * Get the value by rendering the "editable" component of the editor.
     */
    async getValue(): Promise<Node> {
        const renderer = this.plugins.get(Renderer);
        const layout = this.plugins.get(Layout);
        const domLayout = layout.engines.dom;
        const domRenderingEngine = renderer.engines[
            HtmlDomRenderingEngine.id
        ] as HtmlDomRenderingEngine;
        const editable = domLayout.components.get('editable')[0];
        const nodes = await domRenderingEngine.render(editable);
        return nodes[0];
    }
}
