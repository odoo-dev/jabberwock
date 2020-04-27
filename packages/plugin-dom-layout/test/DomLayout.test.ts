import { expect } from 'chai';
import { JWEditor, Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DomLayout } from '../src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';
import { Char } from '../../plugin-char/src/Char';
import { VElement } from '../../core/src/VNodes/VElement';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { setSelection, testEditor } from '../../utils/src/testUtils';
import { Direction } from '../../core/src/VSelection';
import { DomSelectionDescription } from '../../plugin-dom-editable/src/EventNormalizer';
import { RelativePosition, VNode } from '../../core/src/VNodes/VNode';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { CharNode } from '../../plugin-char/src/CharNode';
import { Image } from '../../plugin-image/src/Image';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { ComponentDefinition } from '../../plugin-layout/src/LayoutEngine';
import { DomLayoutEngine } from '../src/ui/DomLayoutEngine';
import { Parser } from '../../plugin-parser/src/Parser';
import { BasicEditor } from '../../../bundles/BasicEditor';

const container = document.createElement('div');
container.classList.add('container');
const target = document.createElement('div');
target.classList.add('editable');

describe('DomLayout', () => {
    beforeEach(() => {
        document.body.appendChild(container);
        container.appendChild(target);
    });
    afterEach(() => {
        document.body.removeChild(container);
        container.innerHTML = '';
        target.innerHTML = '';
    });
    describe('default layout template', () => {
        it('sould not append the layout in the DOM without template, position or target', async () => {
            const editor = new JWEditor();
            await editor.start();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should replace the target by the default layout', async () => {
            const editor = new JWEditor();
            editor.configure(DomLayout, { location: [target, 'replace'] });
            await editor.start();
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add the default layout after the target', async () => {
            container.appendChild(document.createElement('div'));
            const editor = new JWEditor();
            editor.configure(DomLayout, { location: [target, 'after'] });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><jw-editor></jw-editor><div></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div><div></div>');
        });
        it('should add the default layout after the target (last node)', async () => {
            const editor = new JWEditor();
            editor.configure(DomLayout, { location: [target, 'after'] });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><jw-editor></jw-editor>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should throw an error if use an other root without any template (default missing)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(Layout, {
                componentZones: [['test', 'root']],
            });
            editor.configure(DomLayout, { location: [target, 'replace'] });
            let hasError = false;
            await editor.start().catch(error => {
                hasError = true;
                expect(error.message).to.include('default');
            });
            await editor.stop();
            expect(hasError).to.equal(true);
        });
    });
    describe('custom layout template', () => {
        it('should throw an error if the layout default zone is missing', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="main"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'replace']]],
            });
            let hasError = false;
            await editor.start().catch(error => {
                hasError = true;
                expect(error.message).to.include('default');
            });
            await editor.stop();
            expect(hasError).to.equal(true);
        });
        it('should replace the target by the template (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="main"/><t t-zone="default"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'replace']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal('<div class="a"><div class="b"></div></div>');
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add the template after the target (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="main"/><t t-zone="default"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'after']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><div class="a"><div class="b"></div></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add the template in all layouts', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(Layout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="main"/><t t-zone="default"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
            });
            editor.configure(DomLayout, {
                locations: [['aaa', [target, 'after']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><div class="a"><div class="b"></div></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add 2 templates after & after the target (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="tools"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'bbb',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="c"><div class="d"><t t-zone="main"/><t t-zone="default"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [
                    ['aaa', [target, 'after']],
                    ['bbb', [target, 'after']],
                ],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><div class="a"><div class="b"></div></div><div class="c"><div class="d"></div></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add 2 templates after & after the target (use VNode)', async () => {
            const a = new VElement({ htmlTag: 'a-a' });
            a.append(new VElement({ htmlTag: 'p' }));
            a.append(new ZoneNode(['main']));
            a.append(new ZoneNode(['default']));

            const b = new VElement({ htmlTag: 'b-b' });
            b.append(new VElement({ htmlTag: 'p' }));

            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render: async (): Promise<VNode[]> => [a],
                    },
                    {
                        id: 'bbb',
                        render: async (): Promise<VNode[]> => [b],
                    },
                ],
                locations: [
                    ['aaa', [target, 'after']],
                    ['bbb', [target, 'after']],
                ],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><a-a><p><br></p></a-a><b-b><p><br></p></b-b>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add 2 templates after & replace the target (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="tools"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'bbb',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="c"><div class="d"><t t-zone="main"/><t t-zone="default"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [
                    ['aaa', [target, 'after']],
                    ['bbb', [target, 'replace']],
                ],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="c"><div class="d"></div></div><div class="a"><div class="b"></div></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add 2 templates replace & after the target (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="tools"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'bbb',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="c"><div class="d"><t t-zone="main"/><t t-zone="default"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [
                    ['aaa', [target, 'replace']],
                    ['bbb', [target, 'after']],
                ],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="a"><div class="b"></div></div><div class="c"><div class="d"></div></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add 2 templates replace & replace the target (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="tools"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'bbb',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="c"><div class="d"><t t-zone="main"/><t t-zone="default"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [
                    ['aaa', [target, 'replace']],
                    ['bbb', [target, 'replace']],
                ],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="a"><div class="b"></div></div><div class="c"><div class="d"></div></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add 2 templates after the target, prepend container (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"><div class="b"><t t-zone="tools"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'bbb',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="c"><div class="d"><t t-zone="main"/><t t-zone="default"/></div></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [
                    ['aaa', [target.parentNode, 'prepend']],
                    ['bbb', [target, 'after']],
                ],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="a"><div class="b"></div></div><div class="editable"></div><div class="c"><div class="d"></div></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add 3 templates replace the target, prepend container, append container (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template = '<div>a<t t-zone="default"/></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                    {
                        id: 'bbb',
                        render(editor: JWEditor): Promise<VNode[]> {
                            return editor.plugins.get(Parser).parse('text/html', '<div>b</div>');
                        },
                    },
                    {
                        id: 'ccc',
                        render(editor: JWEditor): Promise<VNode[]> {
                            return editor.plugins.get(Parser).parse('text/html', '<div>c</div>');
                        },
                    },
                ],
                locations: [
                    ['aaa', [target.parentNode, 'append']],
                    ['bbb', [target.parentNode, 'prepend']],
                    ['ccc', [target, 'replace']],
                ],
            });
            await editor.start();
            expect(container.innerHTML).to.equal('<div>b</div><div>c</div><div>a</div>');
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add the template after the target (template as HTMLElement with selection)', async () => {
            const other = document.createElement('div');
            const template = document.createElement('t-temp');
            template.innerHTML = 'abcdef<t t-zone="main"></t><t t-zone="default"></t>';
            other.appendChild(template);
            container.appendChild(other);
            setSelection({
                anchorNode: template.firstChild,
                anchorOffset: 1,
                focusNode: template.firstChild,
                focusOffset: 2,
                direction: Direction.FORWARD,
            });

            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const layout = editor.plugins.get(Layout);
                            const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
                            return await domLayoutEngine.parseElement(template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'after']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><t-temp>abcdef</t-temp><div><t-temp>abcdef<t t-zone="main"></t><t t-zone="default"></t></t-temp></div>',
            );
            const domLayoutEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const charNodes = domLayoutEngine.getNodes(
                container.getElementsByTagName('t-temp')[0].firstChild as Node,
            );
            expect(editor.selection.anchor.nextSibling()).to.equal(charNodes[1]);
            expect(editor.selection.focus.nextSibling()).to.equal(charNodes[2]);
            expect(editor.selection.direction).to.equal(Direction.FORWARD);
            await editor.stop();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><div><t-temp>abcdef<t t-zone="main"></t><t t-zone="default"></t></t-temp></div>',
            );
        });
    });
    describe('create theme', () => {
        it('should use a theme and use the default location', async () => {
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [
                        {
                            id: 'aaa',
                            render(editor: JWEditor): Promise<VNode[]> {
                                const template =
                                    '<div class="a"><div class="b"><t t-zone="main"/><t t-zone="default"/></div></div>';
                                return editor.plugins.get(Parser).parse('text/html', template);
                            },
                        },
                    ],
                    componentZones: [['aaa', 'root']],
                };
                async start(): Promise<void> {}
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(Plugin);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            await editor.start();
            expect(container.innerHTML).to.equal('<div class="a"><div class="b"></div></div>');
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should use a theme with template who use custom location', async () => {
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout & DomLayout> = {
                    components: [
                        {
                            id: 'aaa',
                            render(editor: JWEditor): Promise<VNode[]> {
                                const template = '<div class="a"><t t-zone="main"/></div>';
                                return editor.plugins.get(Parser).parse('text/html', template);
                            },
                        },
                        {
                            id: 'bbb',
                            render(editor: JWEditor): Promise<VNode[]> {
                                const template = '<div class="b"><t t-zone="default"/></div>';
                                return editor.plugins.get(Parser).parse('text/html', template);
                            },
                        },
                    ],
                    domLocations: [['bbb', [container, 'prepend']]],
                    componentZones: [
                        ['aaa', 'root'],
                        ['bbb', 'root'],
                    ],
                };
                async start(): Promise<void> {}
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(Plugin);
            editor.configure(DomLayout, { location: [target, 'after'] });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="b"></div><div class="editable"></div><div class="a"></div>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should create the BasicEditor (with their template) and keep the selection', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<v>abc<w>de[f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy]z</v>',
                stepFunction: () => {
                    /* eslint-disable prettier/prettier */
                    expect(document.querySelector('jw-container-test').innerHTML).to.equal(
                        '<jw-editor>' +
                            '<jw-header></jw-header>' +
                            '<jw-body>' +
                            '<jw-test contenteditable="true">' +
                                '<v>abc<w>def<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xyz</v>' +
                            '</jw-test>' +
                            '</jw-body>' +
                            '<jw-footer></jw-footer>' +
                        '</jw-editor>',
                    );
                    /* eslint-enable prettier/prettier */
                },
                contentAfter: '<v>abc<w>de[f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy]z</v>',
            });
        });
    });
    describe('Loadables: layoutComponents', () => {
        it('should add component (vNode) into the main zone', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    const element = new VElement({ htmlTag: 'jw-test' });
                    element.append(new VElement({ htmlTag: 'p' }));
                    return [element];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<jw-editor><jw-test><p><br></p></jw-test></jw-editor>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add component (template as HTMLElement) into the main zone', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    const element = new VElement({ htmlTag: 'jw-test' });
                    element.append(new VElement({ htmlTag: 'p' }));
                    return [element];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<jw-editor><jw-test><p><br></p></jw-test></jw-editor>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add component (template as string) into the main zone', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins
                        .get(Parser)
                        .parse('text/html', '<jw-test><p>a</p></jw-test>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<jw-editor><jw-test><p>a</p></jw-test></jw-editor>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add component (template as HTMLElement with selection) into the main zone', async () => {
            const other = document.createElement('div');
            const template = document.createElement('t-temp');
            template.innerHTML = 'abcdef<t t-zone="main"></t><t t-zone="default"></t>';
            other.appendChild(template);
            container.appendChild(other);
            setSelection({
                anchorNode: template.firstChild,
                anchorOffset: 1,
                focusNode: template.firstChild,
                focusOffset: 2,
                direction: Direction.FORWARD,
            });

            const Component: ComponentDefinition = {
                id: 'test',
                async render(editor: JWEditor): Promise<VNode[]> {
                    const layout = editor.plugins.get(Layout);
                    const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
                    return await domLayoutEngine.parseElement(template);
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }

            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<jw-editor><t-temp>abcdef</t-temp></jw-editor>' +
                    '<div><t-temp>abcdef<t t-zone="main"></t><t t-zone="default"></t></t-temp></div>',
            );
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const charNodes = engine.getNodes(
                container.getElementsByTagName('t-temp')[0].firstChild as Node,
            );

            expect(editor.selection.anchor.nextSibling()).to.equal(charNodes[1]);
            expect(editor.selection.focus.nextSibling()).to.equal(charNodes[2]);
            expect(editor.selection.direction).to.equal(Direction.FORWARD);
            await editor.stop();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><div><t-temp>abcdef<t t-zone="main"></t><t t-zone="default"></t></t-temp></div>',
            );
        });
    });
    describe('getVNodes', () => {
        it('unknown node should return an empty list', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            await editor.start();
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            expect(engine.getNodes(container)).to.deep.equal([]);
            await editor.stop();
        });
        it('node inside the layout should return the vNodes', async () => {
            const element = new VElement({ htmlTag: 'jw-test' });
            const pNode = new VElement({ htmlTag: 'p' });
            element.append(pNode);
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    return [element];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const p = container.getElementsByTagName('p')[0] as Node;
            expect(engine.getNodes(p)).to.deep.equal([pNode]);

            await editor.stop();
        });
    });
    describe('getItems', () => {
        it('unknown vNode should return an empty list', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            await editor.start();
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            expect(engine.getDomNodes(new VElement({ htmlTag: 'p' }))).to.deep.equal([]);
            await editor.stop();
        });
        it('node inside the layout should return the DOM nodes', async () => {
            const element = new VElement({ htmlTag: 'jw-test' });
            const pNode = new VElement({ htmlTag: 'p' });
            element.append(pNode);
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    return [element];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const p = container.getElementsByTagName('p')[0] as Node;
            expect(engine.getDomNodes(pNode)).to.deep.equal([p]);
            await editor.stop();
        });
    });
    describe('parseSelection', () => {
        it('should parse the selection and return a VNode selection', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                async render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const body = container.getElementsByTagName('jw-editor')[0];
            const domSelection: DomSelectionDescription = {
                anchorNode: body.firstChild.firstChild,
                anchorOffset: 1,
                focusNode: body.lastChild.firstChild,
                focusOffset: 2,
                direction: Direction.FORWARD,
            };

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const abc = engine.getNodes(body.firstChild.firstChild);
            const def = engine.getNodes(body.lastChild.firstChild);

            const layout = editor.plugins.get(Layout);
            const domLayoutEngine = layout.engines.dom as DomLayoutEngine;

            expect(domLayoutEngine.parseSelection(domSelection)).to.deep.equal({
                anchorNode: abc[1],
                anchorPosition: RelativePosition.BEFORE,
                focusNode: def[2],
                direction: Direction.FORWARD,
                focusPosition: RelativePosition.BEFORE,
            });
            await editor.stop();
        });
        it('should parse the selection inside a child node create by the renderer (only his parent is linked to VNode)', async () => {
            class CustomNode extends ContainerNode {}
            class CustomDomRenderer extends AbstractRenderer<Node[]> {
                static id = HtmlDomRenderingEngine.id;
                engine: HtmlDomRenderingEngine;
                predicate = CustomNode;
                async render(): Promise<Node[]> {
                    const section = document.createElement('section');
                    section.innerHTML = '<div>abc</div>';
                    return [section];
                }
            }
            const custom = new CustomNode();
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    return [custom];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    renderers: [CustomDomRenderer],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const section = container.getElementsByTagName('section')[0];
            const div = section.firstChild;
            const domSelection: DomSelectionDescription = {
                anchorNode: div.firstChild,
                anchorOffset: 1,
                focusNode: div.firstChild,
                focusOffset: 2,
                direction: Direction.FORWARD,
            };

            const layout = editor.plugins.get(Layout);
            const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
            const selection = domLayoutEngine.parseSelection(domSelection);
            expect(selection).to.deep.equal({
                anchorNode: custom,
                anchorPosition: RelativePosition.INSIDE,
                focusNode: custom,
                direction: Direction.FORWARD,
                focusPosition: RelativePosition.INSIDE,
            });

            await editor.stop();
        });
        it('should parse the selection after a node create by the renderer', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                async render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<div>abc</div>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const domDiv = container.querySelector('div');
            const domSelection: DomSelectionDescription = {
                anchorNode: domDiv,
                anchorOffset: 1,
                focusNode: domDiv,
                focusOffset: 1,
                direction: Direction.FORWARD,
            };

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const vNode = engine.getNodes(domDiv.firstChild).pop();

            const layout = editor.plugins.get(Layout);
            const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
            const selection = domLayoutEngine.parseSelection(domSelection);
            expect(selection).to.deep.equal({
                anchorNode: vNode,
                anchorPosition: RelativePosition.AFTER,
                focusNode: vNode,
                direction: Direction.FORWARD,
                focusPosition: RelativePosition.AFTER,
            });

            await editor.stop();
        });
        it('should parse the selection who target a children offset node', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                async render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins
                        .get(Parser)
                        .parse('text/html', '<div>abc<img src="#"/></div>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const domDiv = container.querySelector('div');
            const domSelection: DomSelectionDescription = {
                anchorNode: domDiv,
                anchorOffset: 1,
                focusNode: domDiv,
                focusOffset: 1,
                direction: Direction.FORWARD,
            };

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const vNode = engine.getNodes(container.querySelector('img')).pop();

            const layout = editor.plugins.get(Layout);
            const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
            const selection = domLayoutEngine.parseSelection(domSelection);
            expect(selection).to.deep.equal({
                anchorNode: vNode,
                anchorPosition: RelativePosition.BEFORE,
                focusNode: vNode,
                direction: Direction.FORWARD,
                focusPosition: RelativePosition.BEFORE,
            });

            await editor.stop();
        });
        it('should parse the selection who target a sibling node add only in the DOM (without any renderer)', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                async render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<div>abc</div>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const body = container.querySelector('jw-editor');
            const custom = document.createElement('custom');
            custom.innerHTML = '+++';
            body.appendChild(custom);

            const domSelection: DomSelectionDescription = {
                anchorNode: custom.firstChild,
                anchorOffset: 1,
                focusNode: custom.firstChild,
                focusOffset: 1,
                direction: Direction.FORWARD,
            };

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const c = engine.getNodes(container.querySelector('div').firstChild).pop();

            const layout = editor.plugins.get(Layout);
            const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
            const selection = domLayoutEngine.parseSelection(domSelection);
            expect(selection).to.deep.equal({
                anchorNode: c,
                anchorPosition: RelativePosition.AFTER,
                focusNode: c,
                direction: Direction.FORWARD,
                focusPosition: RelativePosition.AFTER,
            });

            await editor.stop();
        });
        it('should parse the selection who target a existing child node', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins
                        .get(Parser)
                        .parse('text/html', '<div><div>abc</div></div>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const div = container.querySelector('div');

            const domSelection: DomSelectionDescription = {
                anchorNode: div,
                anchorOffset: 0,
                focusNode: div,
                focusOffset: 0,
                direction: Direction.FORWARD,
            };

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const a = engine.getNodes(div.firstChild.firstChild)[0];

            const layout = editor.plugins.get(Layout);
            const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
            const selection = domLayoutEngine.parseSelection(domSelection);
            expect(selection).to.deep.equal({
                anchorNode: a,
                anchorPosition: RelativePosition.BEFORE,
                focusNode: a,
                direction: Direction.FORWARD,
                focusPosition: RelativePosition.BEFORE,
            });

            await editor.stop();
        });
    });
    describe('renderSelection', () => {
        it('should not render the selection if the range is not in the root element of the vDocument', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<div><div><div>a[]</div></div><p>b</p></div>',
                stepFunction: async editor => {
                    const layout = editor.plugins.get(Layout);
                    const domLayout = layout.engines.dom as DomLayoutEngine;
                    domLayout.components
                        .get('editable')[0]
                        .children()[0]
                        .children()[0]
                        .remove();
                    await domLayout.redraw();
                },
                contentAfter: '<div><p>b</p></div>',
            });
        });
    });
    describe('redraw', () => {
        describe('selection', () => {
            it("shouldn't redraw a wrong selection", async () => {
                const Component: ComponentDefinition = {
                    id: 'test',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse('text/html', '<p>abc</p><p>def</p>');
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', 'main']],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                target.ownerDocument.getSelection().removeAllRanges();

                const domLayoutEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                domLayoutEngine.redraw();
                const domSelection = target.ownerDocument.getSelection();
                expect(domSelection.anchorNode).to.deep.equal(null);

                await editor.stop();
            });
            it('should redraw the selection', async () => {
                const Component: ComponentDefinition = {
                    id: 'test',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse('text/html', '<p>abc</p><p>def</p>');
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', 'main']],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const body = container.getElementsByTagName('jw-editor')[0];

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const abc = engine.getNodes(body.firstChild.firstChild);
                const def = engine.getNodes(body.lastChild.firstChild);
                editor.selection.set({
                    anchorNode: abc[1],
                    anchorPosition: RelativePosition.BEFORE,
                    focusNode: def[2],
                    direction: Direction.FORWARD,
                    focusPosition: RelativePosition.BEFORE,
                });
                await engine.redraw();

                const redrawedBody = container.getElementsByTagName('jw-editor')[0];
                const domSelection = target.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: redrawedBody.firstChild.firstChild,
                    anchorOffset: 1,
                    focusNode: redrawedBody.lastChild.firstChild,
                    focusOffset: 2,
                });

                await editor.stop();
            });
            it('should redraw the selection on void element', async () => {
                const Component: ComponentDefinition = {
                    id: 'test',
                    render(editor: JWEditor): Promise<VNode[]> {
                        const template = '<p><img src="#"></p><p>abc</p>';
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', 'main']],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Image);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const body = container.getElementsByTagName('jw-editor')[0];

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const img = engine.getNodes(body.firstChild.firstChild)[0];
                const abc = engine.getNodes(body.lastChild.firstChild);
                editor.selection.set({
                    anchorNode: img,
                    anchorPosition: RelativePosition.BEFORE,
                    focusNode: abc[2],
                    direction: Direction.FORWARD,
                    focusPosition: RelativePosition.BEFORE,
                });
                await engine.redraw();

                const redrawedBody = container.getElementsByTagName('jw-editor')[0];
                const domSelection = target.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: redrawedBody.firstChild,
                    anchorOffset: 0,
                    focusNode: redrawedBody.lastChild.firstChild,
                    focusOffset: 2,
                });

                await editor.stop();
            });
            it('should redraw the selection (backward)', async () => {
                const Component: ComponentDefinition = {
                    id: 'test',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse('text/html', '<p>abc</p><p>def</p>');
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', 'main']],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const body = container.getElementsByTagName('jw-editor')[0];

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const abc = engine.getNodes(body.firstChild.firstChild);
                const def = engine.getNodes(body.lastChild.firstChild);
                editor.selection.set({
                    anchorNode: def[1],
                    anchorPosition: RelativePosition.AFTER,
                    focusNode: abc[1],
                    direction: Direction.BACKWARD,
                    focusPosition: RelativePosition.BEFORE,
                });
                await engine.redraw();
                const domSelection = target.ownerDocument.getSelection();

                const redrawedBody = container.getElementsByTagName('jw-editor')[0];
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: redrawedBody.lastChild.firstChild,
                    anchorOffset: 2,
                    focusNode: redrawedBody.firstChild.firstChild,
                    focusOffset: 1,
                });

                await editor.stop();
            });
            it('should not redraw a selection in a part removed from the arch/DOM', async () => {
                const Component: ComponentDefinition = {
                    id: 'test',
                    render(editor: JWEditor): Promise<VNode[]> {
                        const template = '<div><p>abc</p><p>def</p></div>';
                        return editor.plugins.get(Parser).parse('text/html', template);
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', 'main']],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                document.getSelection().removeAllRanges();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const div = engine.getNodes(container.querySelector('div'))[0];
                const parent = div.parent;
                div.remove();

                await engine.redraw(parent);

                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');

                editor.selection.set({
                    anchorNode: div.descendants(CharNode)[0],
                    anchorPosition: RelativePosition.AFTER,
                    focusNode: div.descendants(CharNode)[0],
                    direction: Direction.BACKWARD,
                    focusPosition: RelativePosition.AFTER,
                });

                await engine.redraw();
                const domSelection = target.ownerDocument.getSelection();

                expect(domSelection.anchorNode).to.equal(null);

                await editor.stop();
            });
            it('should not redraw a selection in a fragment out of the arch', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                await editor.start();

                document.getSelection().removeAllRanges();

                const element = new VElement({ htmlTag: 'div' });
                const p = new VElement({ htmlTag: 'p' });
                element.append(p);

                editor.selection.set({
                    anchorNode: p,
                    anchorPosition: RelativePosition.INSIDE,
                    focusNode: p,
                    direction: Direction.BACKWARD,
                    focusPosition: RelativePosition.INSIDE,
                });

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw();

                const domSelection = target.ownerDocument.getSelection();
                expect(domSelection.anchorNode).to.equal(null);

                await editor.stop();
            });
        });
        it('should redraw new item in the DOM', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const b = engine.getNodes(container.getElementsByTagName('p')[0].firstChild)[1];
            const area = new VElement({ htmlTag: 'area' });
            b.after(area);

            expect(container.innerHTML).to.equal('<jw-editor><p>abc</p><p>def</p></jw-editor>');
            await engine.redraw(area);
            expect(container.innerHTML).to.equal(
                '<jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
            );

            await editor.stop();
        });
        it('should redraw same item in the DOM (with same DOM Node)', async () => {
            class CustomNode extends AtomicNode {}
            const div = document.createElement('div');
            let index = 0;
            class CustomDomRenderer extends AbstractRenderer<Node[]> {
                static id = HtmlDomRenderingEngine.id;
                engine: HtmlDomRenderingEngine;
                predicate = CustomNode;
                async render(): Promise<Node[]> {
                    index++;
                    div.className = 'redraw' + index;
                    return [div];
                }
            }
            const custom = new CustomNode();
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    return [custom];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                    renderers: [CustomDomRenderer],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            expect(container.innerHTML).to.equal(
                '<jw-editor><div class="redraw1"></div></jw-editor>',
            );
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            await engine.redraw(custom);
            expect(container.innerHTML).to.equal(
                '<jw-editor><div class="redraw2"></div></jw-editor>',
            );

            await editor.stop();
        });
        it('should redraw an item without DOM node when redraw it', async () => {
            class CustomNode extends AtomicNode {}
            const div = document.createElement('div');
            let index = 0;
            class CustomDomRenderer extends AbstractRenderer<Node[]> {
                static id = HtmlDomRenderingEngine.id;
                engine: HtmlDomRenderingEngine;
                predicate = CustomNode;
                async render(): Promise<Node[]> {
                    index++;
                    return index === 1 ? [div] : [];
                }
            }
            const custom = new CustomNode();
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    return [custom];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                    renderers: [CustomDomRenderer],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>');
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            await engine.redraw(custom);
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');

            await editor.stop();
        });
        it('should redraw all with new item', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const b = engine.getNodes(container.getElementsByTagName('p')[0].firstChild)[1];
            const area = new VElement({ htmlTag: 'area' });
            b.after(area);

            expect(container.innerHTML).to.equal('<jw-editor><p>abc</p><p>def</p></jw-editor>');
            await engine.redraw();
            expect(container.innerHTML).to.equal(
                '<jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
            );

            await editor.stop();
        });
        it('should redraw all with new item, with node before the editor', async () => {
            container.prepend(document.createElement('section'));
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const b = engine.getNodes(container.getElementsByTagName('p')[0].firstChild)[1];
            const area = new VElement({ htmlTag: 'area' });
            b.after(area);

            expect(container.innerHTML).to.equal(
                '<section></section><jw-editor><p>abc</p><p>def</p></jw-editor>',
            );
            await engine.redraw();
            expect(container.innerHTML).to.equal(
                '<section></section><jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
            );

            await editor.stop();
        });
        it('should throw an error if try to redraw with an altered DOM for the editor (removed target to replace)', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            document.getElementsByTagName('jw-editor')[0].remove();

            let hasFail = false;
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            await engine.redraw().catch(e => {
                expect(e.message).to.include('Impossible');
                hasFail = true;
            });

            expect(hasFail).to.equal(true);

            await editor.stop();
        });
        it('should redraw all with new item with altered DOM (remove target) but already the dom contains the editor component', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'after'] });
            editor.load(Plugin);
            await editor.start();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const b = engine.getNodes(container.getElementsByTagName('p')[0].firstChild)[1];
            const area = new VElement({ htmlTag: 'area' });
            b.after(area);

            target.remove();

            expect(container.innerHTML).to.equal('<jw-editor><p>abc</p><p>def</p></jw-editor>');
            await engine.redraw();
            expect(container.innerHTML).to.equal(
                '<jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
            );

            await editor.stop();
        });
        it('should update a template', async () => {
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [
                        {
                            id: 'test',
                            render(editor: JWEditor): Promise<VNode[]> {
                                const template = '<p>abc</p><p>def</p>';
                                return editor.plugins.get(Parser).parse('text/html', template);
                            },
                        },
                    ],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'template',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"></div><t t-zone="main"/><div class="b"><t t-zone="default"/></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                componentZones: [['template', 'root']],
                location: [target, 'replace'],
            });
            editor.load(Plugin);
            await editor.start();

            expect(container.innerHTML).to.equal(
                '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div>',
                'Test before changes',
            );

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const divDom = container.getElementsByTagName('div')[1];
            const p = engine.getNodes(divDom)[0];
            const area = new VElement({ htmlTag: 'area' });
            p.after(area);

            expect(container.innerHTML).to.equal(
                '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div>',
            );
            await engine.redraw();
            expect(container.innerHTML).to.equal(
                '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div><area>',
            );

            await editor.stop();
        });
        it('should redraw a template with altered DOM (remove last component)', async () => {
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [
                        {
                            id: 'test',
                            render(editor: JWEditor): Promise<VNode[]> {
                                const template = '<p>abc</p><p>def</p>';
                                return editor.plugins.get(Parser).parse('text/html', template);
                            },
                        },
                    ],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'template',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"></div><t t-zone="main"/><div class="b"><t t-zone="default"/></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                componentZones: [['template', 'root']],
                location: [target, 'replace'],
            });
            editor.load(Plugin);
            await editor.start();

            expect(container.innerHTML).to.equal(
                '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div>',
                'Test before changes',
            );

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const divDom = container.getElementsByTagName('div')[1];
            const p = engine.getNodes(divDom)[0];
            const area = new VElement({ htmlTag: 'area' });
            p.after(area);

            divDom.remove();

            expect(container.innerHTML).to.equal('<div class="a"><br></div><p>abc</p><p>def</p>');
            await engine.redraw();
            expect(container.innerHTML).to.equal(
                '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div><area>',
            );

            await editor.stop();
        });
        it('should redraw a template with altered DOM (remove first component)', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<div class="a"></div><t t-zone="main"/><div class="b"><t t-zone="default"/></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'replace']]],
            });
            editor.load(Plugin);
            await editor.start();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const divDom = container.getElementsByTagName('div')[0];
            const p = engine.getNodes(divDom)[0];
            const area = new VElement({ htmlTag: 'area' });
            p.after(area);

            divDom.remove();

            expect(container.innerHTML).to.equal('<p>abc</p><p>def</p><div class="b"></div>');
            await engine.redraw();
            expect(container.innerHTML).to.equal(
                '<div class="a"><br></div><area><p>abc</p><p>def</p><div class="b"></div>',
            );

            await editor.stop();
        });
        it('should throw an error if try to redraw with an altered DOM for the editor (removed target and editor component)', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'after'] });
            editor.load(Plugin);
            await editor.start();

            target.remove();
            document.getElementsByTagName('jw-editor')[0].remove();

            let hasFail = false;
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            await engine.redraw().catch(e => {
                expect(e.message).to.include('Impossible');
                hasFail = true;
            });

            expect(hasFail).to.equal(true);

            await editor.stop();
        });
        it('should throw an error if try to replace the target without any DOM node', async () => {
            class CustomNode extends AtomicNode {}
            const div = document.createElement('div');
            let index = 0;
            class CustomDomRenderer extends AbstractRenderer<Node[]> {
                static id = HtmlDomRenderingEngine.id;
                engine: HtmlDomRenderingEngine;
                predicate = CustomNode;
                async render(): Promise<Node[]> {
                    index++;
                    return index === 1 ? [div] : [];
                }
            }
            const custom = new CustomNode();
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    return [custom];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    componentZones: [['test', 'main']],
                    renderers: [CustomDomRenderer],
                };
            }
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        render(editor: JWEditor): Promise<VNode[]> {
                            const template = '<t t-zone="main"/><t t-zone="default"/>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'replace']]],
            });
            editor.load(Plugin);
            await editor.start();

            expect(container.innerHTML).to.equal('<div></div>');

            let hasFail = false;
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            await engine.redraw().catch(e => {
                expect(e.message).to.include('Impossible');
                hasFail = true;
            });

            expect(hasFail).to.equal(true);

            await editor.stop();
        });
    });
    describe('add & remove', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, {
                location: [target, 'replace'],
                components: [
                    {
                        id: 'aaa',
                        async render(): Promise<VNode[]> {
                            const area = new VElement({ htmlTag: 'div' });
                            area.append(new VElement({ htmlTag: 'area' }));
                            return [area];
                        },
                    },
                ],
            });
            await editor.start();
        });
        afterEach(async () => {
            await editor.stop();
        });
        it('should add a component in a zone', async () => {
            await editor.plugins.get(Layout).add('aaa', 'main');
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
            await editor.stop();
        });
        it('should add an existing component in unknown zone (go in default)', async () => {
            await editor.stop();
            editor.load(Layout, {
                components: [
                    {
                        id: 'template',
                        async render(): Promise<VNode[]> {
                            const template =
                                '<div class="a"><t t-zone="main"/></div><div class="b"><t t-zone="default"/></div>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                componentZones: [['template', 'root']],
            });
            await editor.start();

            expect(container.innerHTML).to.equal('<div class="a"></div><div class="b"></div>');

            await editor.plugins.get(Layout).add('aaa', 'totoZone');

            expect(container.innerHTML).to.equal(
                '<div class="a"></div><div class="b"><div><area></div></div>',
            );

            await editor.stop();
        });
        it('should add a component and show it by default', async () => {
            await editor.plugins.get(Layout).add('aaa', 'main');
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
        });
        it('should hide a component', async () => {
            await editor.plugins.get(Layout).add('aaa', 'main');
            await editor.execCommand('hide', { componentID: 'aaa' });
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
        });
        it('should show a component', async () => {
            await editor.plugins.get(Layout).add('aaa', 'main');
            await editor.execCommand('hide', { componentID: 'aaa' });
            await editor.execCommand('show', { componentID: 'aaa' });
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
        });
        it('should remove a component', async () => {
            const layout = editor.plugins.get(Layout);
            await layout.add('aaa', 'main');
            await layout.remove('aaa');
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
        });
        it('should remove a component without memory leak', async () => {
            const layout = editor.plugins.get(Layout);
            const root = layout.engines.dom.root;
            const zoneMain = root.descendants(ZoneNode).find(n => n.managedZones.includes('main'));
            await layout.add('aaa', 'main');
            const node = zoneMain.children().pop();
            expect(!!zoneMain.hidden.get(node)).to.equal(false, 'Component is visible');
            await editor.execCommand('hide', { componentID: 'aaa' });
            expect(zoneMain.hidden.get(node)).to.equal(true, 'Component is hidden');
            await layout.remove('aaa');
            expect(zoneMain.hidden.get(node)).to.equal(undefined);
        });
        it('should remove a component in all layout engines', async () => {
            await editor.plugins.get(Layout).add('aaa', 'main');
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
            await editor.plugins.get(Layout).remove('aaa');
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
        });
    });
});
