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
import { DomZonePosition, ComponentDefinition } from '../plugin-layout/src/LayoutEngine';
import { HtmlDomRenderingEngine } from '../plugin-html/src/HtmlDomRenderingEngine';
import { DomHelpers } from '../plugin-dom-helpers/src/DomHelpers';
import { Odoo } from '../plugin-odoo/src/Odoo';
import { parseEditable } from '../utils/src/configuration';
import { Dialog } from '../plugin-dialog/src/Dialog';
import { Shadow } from '../plugin-shadow/src/Shadow';
import { FontAwesome } from '../plugin-fontawesome/src/FontAwesome';
import { ModeDefinition } from '../core/src/Mode';
import './odooLayout.css';
import { Textarea } from '../plugin-textarea/src/Textarea';
import { FollowRange } from '../plugin-dom-follow-range/src/FollowRange';
import { Input } from '../plugin-input/src/Input';
import { FontSize } from '../plugin-font-size/src/FontSize';
import { History } from '../plugin-history/src/History';
import { Iframe } from '../plugin-iframe/src/Iframe';
import { ThemeNode } from '../plugin-theme/src/ThemeNode';
import { DevicePreview } from '../plugin-device-preview/src/DevicePreview';
import { Button } from '../plugin-button/src/Button';
import { Loadables } from '../core/src/JWEditor';
import { Mail } from '../plugin-mail/src/Mail';
import { Theme, ThemeComponent } from '../plugin-theme/src/Theme';
import { Template, TemplateName, TemplateConfiguration } from '../plugin-template/src/Template';
import { ZoneNode } from '../plugin-layout/src/ZoneNode';
import { DividerNode } from '../plugin-divider/src/DividerNode';
import { Attributes } from '../plugin-xml/src/Attributes';
import { Strikethrough } from '../plugin-strikethrough/src/Strikethrough';

interface OdooWebsiteEditorOptions {
    source: HTMLElement;
    location?: [Node, DomZonePosition];
    customCommands?: Record<CommandIdentifier, CommandImplementation>;
    snippetMenuElement?: HTMLElement;
    snippetManipulators?: HTMLElement;
    interface?: string;
    devicePreview?: boolean;
    templates?: {
        components: ComponentDefinition[];
        templateConfigurations: Record<TemplateName, TemplateConfiguration>;
    };
    themes?: ThemeComponent[];
    toolbarLayout?: ToolbarLayout;
    mode?: ModeDefinition;
    plugins?: [typeof JWPlugin, JWPluginConfig?][];
}

const defaultToolbarLayout = [
    ['BoldButton', 'ItalicButton', 'UnderlineButton', 'StrikethroughButton'],
    [
        'OdooHeading1ToggleButton',
        'OdooHeading2ToggleButton',
        'OdooPreToggleButton',
        'OdooBlockquoteToggleButton',
    ],
    ['UnorderedListButton', 'ChecklistButton'],
    ['OdooLinkToggleButton'],
];
export class OdooWebsiteEditor extends JWEditor {
    constructor(options: OdooWebsiteEditorOptions) {
        super();
        class CustomPlugin extends JWPlugin {
            commands = Object.assign(options.customCommands || {});
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
                [Strikethrough],
                [Input],
                [FontSize],
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
                [Mail],
                [DomHelpers],
                [Odoo],
                [OdooVideo],
                [CustomPlugin],
                [FollowRange],
                [History],
                [Iframe],
                [Button],
                ...(options.plugins || []),
            ],
        });
        this.configure(Toolbar, {
            layout: [...(options.toolbarLayout || defaultToolbarLayout)],
        });
        const loadables: Loadables<Keymap> = {
            shortcuts: [
                {
                    pattern: 'CTRL+K',
                    selector: [(node: VNode): boolean => !Link.isLink(node)],
                    commandId: 'openLinkDialog',
                },
            ],
        };
        this.load(loadables);

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
                            .parse('text/html', options.interface || defaultTemplate);
                    },
                },
                {
                    id: 'snippet_menu',
                    render(): Promise<VNode[]> {
                        const node: VNode = options.snippetMenuElement
                            ? new HtmlNode({ domNode: (): Node => options.snippetMenuElement })
                            : new LineBreakNode();
                        return Promise.resolve([node]);
                    },
                },
                {
                    id: 'snippetManipulators',
                    render(): Promise<VNode[]> {
                        const node: VNode = options.snippetMenuElement
                            ? new HtmlNode({ domNode: (): Node => options.snippetManipulators })
                            : new LineBreakNode();
                        return Promise.resolve([node]);
                    },
                },
                {
                    id: 'main',
                    render: async (): Promise<VNode[]> => {
                        const div = new DividerNode();
                        div.modifiers.get(Attributes).set('contentEditable', 'true');
                        div.modifiers.get(Attributes).classList.add('note-editable');
                        div.modifiers.get(Attributes).style.set('width', '100%');
                        const zone = new ZoneNode({ managedZones: ['editable'] });
                        zone.editable = true;
                        div.append(zone);
                        const snippetManipulators = new ZoneNode({
                            managedZones: ['snippetManipulators'],
                        });
                        div.append(snippetManipulators);
                        if (options.devicePreview) {
                            const theme = new ThemeNode();
                            theme.append(div);
                            return [theme];
                        }
                        return [div];
                    },
                },
                {
                    id: 'editable',
                    render: async (editor: JWEditor): Promise<VNode[]> => {
                        if (typeof options.source === 'string') {
                            let source: string = options.source;
                            if (!source.length && !options.templates) {
                                source = '<p><br></p>';
                            }
                            return editor.plugins.get(Parser).parse('text/html', source);
                        } else {
                            return parseEditable(editor, options.source);
                        }
                    },
                },
            ],
            componentZones: [
                ['main_template', ['root']],
                ['snippet_menu', ['main_sidebar']],
                ['snippetManipulators', ['snippetManipulators']],
            ],
            location: options.location,
            pressedActionablesClassName: 'active',
        });
        this.configure(DomEditable, {
            autoFocus: true,
            source: options.source.firstElementChild as HTMLElement,
        });
        this.configure(Table, {
            minRowCount: 3,
            minColumnCount: 3,
            inlineUI: true,
        });

        if (options.devicePreview) {
            this.configure(DevicePreview, {
                getTheme(editor: JWEditor) {
                    const layout = editor.plugins.get(Layout);
                    const domLayout = layout.engines.dom;
                    return domLayout.components.main[0] as ThemeNode;
                },
            });
        }

        if (options.mode) {
            this.configure({
                modes: [options.mode],
            });
            this.configure({ mode: options.mode.id });
        }

        if (options.templates) {
            this.configure(Template, {
                components: options.templates.components,
                templateConfigurations: options.templates.templateConfigurations,
            });
        }
        if (options.themes) {
            this.configure(Theme, {
                components: options.themes,
            });
        }
    }

    /**
     * Get the value by rendering the "editable" component of the editor.
     */
    async getValue<T>(format = HtmlDomRenderingEngine.id): Promise<T> {
        const renderer = this.plugins.get(Renderer);
        const layout = this.plugins.get(Layout);
        const domLayout = layout.engines.dom;
        const editable = domLayout.components.editable[0];
        const nodes = await renderer.render<T>(format, editable);
        return nodes && nodes[0];
    }
}
