import { expect } from 'chai';
import { Theme } from '../src/Theme';
import JWEditor, { JWEditorConfig, Loadables } from '../../core/src/JWEditor';
import { Char } from '../../plugin-char/src/Char';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { VNode, RelativePosition } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { Layout } from '../../plugin-layout/src/Layout';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { Toolbar } from '../../plugin-toolbar/src/Toolbar';
import { click } from '../../utils/src/testUtils';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Html } from '../../plugin-html/src/Html';

const container = document.createElement('div');
container.classList.add('container');

describe('Theme', () => {
    let editor: JWEditor;
    beforeEach(async () => {
        document.body.appendChild(container);
        const target = document.createElement('div');
        target.classList.add('editable');
        container.appendChild(target);

        editor = new JWEditor();
        editor.load(Html);
        editor.load(Char);
        editor.configure(Theme, {
            components: [
                {
                    id: 'default',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse(
                                'text/html',
                                `<div class="row"><div class="col"><t-placeholder/></div></div>`,
                            );
                    },
                },
                {
                    id: 'second',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse('text/html', `<section id="second"><t-placeholder/></section>`);
                    },
                },
                {
                    label: 'Super theme',
                    id: 'third',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse(
                                'text/html',
                                `<table><tr><td>1</td><td><t-placeholder/></td><td>2</td></tr></table>`,
                            );
                    },
                },
            ],
        });
        editor.configure(DomLayout, {
            components: [
                {
                    id: 'editable',
                    async render(editor: JWEditor): Promise<VNode[]> {
                        const article = new TagNode({ htmlTag: 'ARTICLE' });
                        editor.selection.setAt(article, RelativePosition.INSIDE);
                        return [article];
                    },
                },
            ],
            componentZones: [['editable', ['main']]],
            location: [target, 'replace'],
        });
        const config: JWEditorConfig & { loadables: Loadables<Layout> } = {
            loadables: {
                components: [
                    {
                        id: 'editor',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<jw-editor><t t-zone="tools"/><t-theme><t t-zone="default"/><t t-zone="main"/></t-theme></jw-editor>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                componentZones: [['editor', ['root']]],
            },
        };
        editor.configure(config);
    });
    afterEach(async () => {
        await editor.stop();
        document.body.removeChild(container);
        container.innerHTML = '';
    });
    it('should use the default theme', async () => {
        await editor.start();
        expect(container.innerHTML).to.equal(
            '<jw-editor><div class="row"><div class="col"><article></article></div></div></jw-editor>',
        );
    });
    it('should use a selected theme', async () => {
        const config: JWEditorConfig & { loadables: Loadables<Layout> } = {
            loadables: {
                components: [
                    {
                        id: 'editor',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<jw-editor><t-theme name="second"><t t-zone="default"/><t t-zone="main"/></t-theme></jw-editor>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                componentZones: [['editor', ['root']]],
            },
        };
        editor.configure(config);
        await editor.start();
        expect(container.innerHTML).to.equal(
            '<jw-editor><section id="second"><article></article></section></jw-editor>',
        );
    });
    it('should change the theme', async () => {
        await editor.start();
        await editor.execCommand('changeTheme', { theme: 'third' });
        expect(container.innerHTML).to.equal(
            '<jw-editor><table><tr><td>1</td><td><article></article></td><td>2</td></tr></table></jw-editor>',
        );
    });
    it('should change the theme 3x', async () => {
        await editor.start();
        await editor.execCommand('changeTheme', { theme: 'third' });
        await editor.execCommand('changeTheme', { theme: 'second' });
        await editor.execCommand('changeTheme', { theme: 'third' });
        expect(container.innerHTML).to.equal(
            '<jw-editor><table><tr><td>1</td><td><article></article></td><td>2</td></tr></table></jw-editor>',
        );
    });
    it('should change the theme with the toolbar', async () => {
        editor.configure(Toolbar, { layout: ['ThemeButton'] });
        await editor.start();

        /* eslint-disable prettier/prettier */
        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                    '<jw-toolbar>',
                        '<jw-group name="themes">',
                            '<jw-button name="theme-default" aria-pressed="true" class="pressed">Theme: default</jw-button>',
                            '<jw-button name="theme-second" aria-pressed="false">Theme: second</jw-button>',
                            '<jw-button name="theme-third" aria-pressed="false">Super theme</jw-button>',
                        '</jw-group>',
                    '</jw-toolbar>',
                    '<div class="row"><div class="col"><article></article></div></div>',
                '</jw-editor>',
            ].join(''),
        );

        const dom = container.querySelector('[name="theme-third"]');
        await click(dom);

        expect(container.innerHTML).to.equal(
            [
                '<jw-editor>',
                    '<jw-toolbar>',
                        '<jw-group name="themes">',
                            '<jw-button name="theme-default" aria-pressed="false" class="">Theme: default</jw-button>',
                            '<jw-button name="theme-second" aria-pressed="false">Theme: second</jw-button>',
                            '<jw-button name="theme-third" aria-pressed="true" class="pressed">Super theme</jw-button>',
                        '</jw-group>',
                    '</jw-toolbar>',
                    '<table><tr><td>1</td><td><article></article></td><td>2</td></tr></table>',
                '</jw-editor>',
            ].join(''),
        );
        /* eslint-enable prettier/prettier */
    });
    it('should change the theme with domObjectNative', async () => {
        class CustomNode extends ContainerNode {}
        class CustomDomRenderer extends NodeRenderer<DomObject> {
            static id = DomObjectRenderingEngine.id;
            engine: DomObjectRenderingEngine;
            predicate = CustomNode;
            async render(): Promise<DomObject> {
                const section = document.createElement('section');
                section.innerHTML = '<div>abc<t-placeholder></t-placeholder>def</div>';
                return { dom: [section] };
            }
        }
        class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
            loadables: Loadables<Renderer & Layout> = {
                renderers: [CustomDomRenderer],
            };
        }
        editor.load(Plugin);
        editor.configure(Theme, {
            components: [
                {
                    id: 'domy',
                    async render(): Promise<VNode[]> {
                        return [new CustomNode()];
                    },
                },
            ],
        });

        await editor.start();
        await editor.execCommand('changeTheme', { theme: 'domy' });
        expect(container.innerHTML).to.equal(
            '<jw-editor><section><div>abc<article></article>def</div></section></jw-editor>',
        );
    });
});
