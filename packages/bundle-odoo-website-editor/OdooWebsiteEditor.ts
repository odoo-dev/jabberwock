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
import { Toolbar, ToolbarLayout } from '../plugin-toolbar/src/Toolbar';
import { HtmlNode } from '../plugin-html/src/HtmlNode';
import { CommandImplementation, CommandIdentifier } from '../core/src/Dispatcher';
import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { OdooVideo } from '../plugin-odoo-video/src/OdooVideo';
import { DomZonePosition } from '../plugin-layout/src/LayoutEngine';
import { HtmlDomRenderingEngine } from '../plugin-html/src/HtmlDomRenderingEngine';
import { DomHelpers } from '../plugin-dom-helpers/src/DomHelpers';
import { Odoo } from '../plugin-odoo/src/Odoo';
import { parseEditable } from '../utils/src/configuration';
import { Dialog } from '../plugin-dialog/src/Dialog';
import { Shadow } from '../plugin-shadow/src/Shadow';
import { FontAwesome } from '../plugin-fontawesome/src/FontAwesome';
import { ModeDefinition } from '../core/src/Mode';
import './odooLayout.css';
import { OdooField } from '../plugin-odoo-field/src/OdooField';
import { Textarea } from '../plugin-textarea/src/Textarea';
import { FollowRange } from '../plugin-dom-follow-range/src/FollowRange';

interface OdooWebsiteEditorOptions {
    source: HTMLElement;
    location: [Node, DomZonePosition];
    customCommands: Record<CommandIdentifier, CommandImplementation>;
    afterRender?: Function;
    snippetMenuElement?: HTMLElement;
    snippetManipulators?: HTMLElement;
    template?: string;
    toolbarLayout?: ToolbarLayout;
    mode?: ModeDefinition;
    // todo: Remove when configuring the toolbar in another way.
    discardButton?: boolean;
    saveButton?: boolean;
    plugins?: [typeof JWPlugin, JWPluginConfig?][];
}

const defaultToolbarLayout = [
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
    [
        'BoldButton',
        'ItalicButton',
        'UnderlineButton',
        'OdooTextColorButton',
        'OdooBackgroundColorButton',
        'RemoveFormatButton',
    ],
    ['AlignLeftButton', 'AlignCenterButton', 'AlignRightButton', 'AlignJustifyButton'],
    ['OrderedListButton', 'UnorderedListButton', 'ChecklistButton'],
    ['IndentButton', 'OutdentButton'],
    ['OdooLinkButton'],
    ['OdooMediaButton'],
];
export class OdooWebsiteEditor extends JWEditor {
    constructor(options: OdooWebsiteEditorOptions) {
        super();
        class CustomPlugin extends JWPlugin {
            commands = Object.assign(
                { commit: { handler: options.afterRender } },
                options.customCommands,
            );
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
                [Textarea],
                [Indent],
                [Span],
                [Bold],
                [Italic],
                [Underline],
                [Link],
                [FontAwesome],
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
                [Dialog],
                [Shadow],
                [DomHelpers],
                [Odoo],
                [OdooVideo],
                [CustomPlugin],
                [FollowRange],
                ...(options.plugins || []),
            ],
        });
        this.configure(Toolbar, {
            layout: [
                ...(options.toolbarLayout || defaultToolbarLayout),
                ...(options.saveButton ? [['OdooSaveButton']] : []),
                ...(options.discardButton ? [['OdooDiscardButton']] : []),
            ],
        });

        const defaultTemplate = `
        <t-dialog><t t-zone="default"/></t-dialog>
        <div class="wrap_editor d-flex flex-column">
            <div class="d-flex flex-grow-1 flex-row overflow-auto">
                <t t-zone="main_sidebar"/>
                <div class="d-flex flex-column o_editor_center">
                    <div class="o_toolbar">
                        <t t-zone="tools"/>
                    </div>
                    <div class="d-flex flex-grow-1 overflow-auto">
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
                {
                    id: 'editable',
                    render: async (editor: JWEditor): Promise<VNode[]> => {
                        return parseEditable(editor, options.source);
                    },
                },
            ],
            componentZones: [
                ['main_template', ['root']],
                ['snippet_menu', ['main_sidebar']],
                ['snippetManipulators', ['snippetManipulators']],
                ['editable', ['main']],
            ],
            location: options.location,
        });
        this.configure(DomEditable, {
            autoFocus: true,
            source: options.source.firstElementChild as HTMLElement,
        });
        if (options.mode) {
            this.configure({
                modes: [options.mode],
            });
            this.configure({ mode: options.mode.id });
        }
    }

    /**
     * Get the value by rendering the "editable" component of the editor.
     */
    async getValue(): Promise<Node> {
        const renderer = this.plugins.get(Renderer);
        const layout = this.plugins.get(Layout);
        const domLayout = layout.engines.dom;
        const editable = domLayout.components.get('editable')[0];
        const nodes = await renderer.render<Node[]>('dom/html', editable);
        return nodes && nodes[0];
    }
}
