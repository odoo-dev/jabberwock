import JWEditor from '../core/src/JWEditor';
import { Parser } from '../plugin-parser/src/Parser';
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
import { VNode } from '../core/src/VNodes/VNode';

import './odooLayout.css';
import { OdooSnippet } from '../plugin-odoo/src/OdooSnippet';

import { Toolbar } from '../plugin-toolbar/src/Toolbar';
import { ParagraphButton } from '../plugin-heading/src/HeadingButtons';
import { Heading1Button } from '../plugin-heading/src/HeadingButtons';
import { Heading2Button } from '../plugin-heading/src/HeadingButtons';
import { Heading3Button } from '../plugin-heading/src/HeadingButtons';
import { Heading4Button } from '../plugin-heading/src/HeadingButtons';
import { Heading5Button } from '../plugin-heading/src/HeadingButtons';
import { Heading6Button } from '../plugin-heading/src/HeadingButtons';
import { PreButton } from '../plugin-pre/src/PreButtons';
import { BoldButton } from '../plugin-bold/src/BoldButtons';
import { ItalicButton } from '../plugin-italic/src/ItalicButtons';
import { UnderlineButton } from '../plugin-underline/src/UnderlineButtons';
import { OrderedListButton } from '../plugin-list/src/ListButtons';
import { UnorderedListButton } from '../plugin-list/src/ListButtons';
import { IndentButton } from '../plugin-indent/src/IndentButtons';
import { OutdentButton } from '../plugin-indent/src/IndentButtons';
import { SaveButton } from '../plugin-odoo/src/SaveButton';
import { HtmlNode } from '../plugin-html/src/HtmlNode';
import { MediaButton } from '../plugin-odoo/src/MediaButton';
import { CommandImplementation, CommandIdentifier } from '../core/src/Dispatcher';
import { JWPlugin } from '../core/src/JWPlugin';
import { OdooVideo } from '../plugin-odoo-video/src/OdooVideo';
import { LinkButton } from '../plugin-odoo/src/LinkButton';
import { DomZonePosition } from '../plugin-layout/src/LayoutEngine';
import { HtmlDomRenderingEngine } from '../plugin-html/src/HtmlDomRenderingEngine';
import {
    AlignLeftButton,
    AlignCenterButton,
    AlignRightButton,
    AlignJustifyButton,
} from '../plugin-align/src/AlignButtons';
import { DomHelpers } from '../plugin-dom-helpers/src/DomHelpers';

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
                [Divider, { breakable: false }],
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
                [DomHelpers],
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

    async render(): Promise<void> {
        const domLayout = this.plugins.get(DomLayout);
        return domLayout.redraw();
    }
}
