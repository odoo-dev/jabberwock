import { expect } from 'chai';
import { JWEditor, Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DomLayout } from '../src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';
import { Char } from '../../plugin-char/src/Char';
import { VElement } from '../../core/src/VNodes/VElement';
import { MarkerNode } from '../../core/src/VNodes/MarkerNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import {
    setSelection,
    testEditor,
    renderTextualSelection,
    nextTick,
    click,
} from '../../utils/src/testUtils';
import { Direction } from '../../core/src/VSelection';
import { DomSelectionDescription } from '../../plugin-dom-editable/src/EventNormalizer';
import { RelativePosition, VNode } from '../../core/src/VNodes/VNode';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { CharNode } from '../../plugin-char/src/CharNode';
import { Image } from '../../plugin-image/src/Image';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { ComponentDefinition } from '../../plugin-layout/src/LayoutEngine';
import { DomLayoutEngine } from '../src/DomLayoutEngine';
import { Parser } from '../../plugin-parser/src/Parser';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { BoldFormat } from '../../plugin-bold/src/BoldFormat';
import { Inline } from '../../plugin-inline/src/Inline';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectFragment,
    DomObjectText,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Bold } from '../../plugin-bold/src/Bold';
import { Italic } from '../../plugin-italic/src/Italic';
import { Underline } from '../../plugin-underline/src/Underline';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';
import { LineBreak } from '../../plugin-linebreak/src/LineBreak';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { parseElement } from '../../utils/src/configuration';
import { Html } from '../../plugin-html/src/Html';
import { flat } from '../../utils/src/utils';
import {
    removeNodeTemp,
    beforeNodeTemp,
    afterNodeTemp,
    wrapNodeTemp,
} from '../../core/src/VNodes/AbstractNode';
import {
    nextSiblingNodeTemp,
    previousNodeTemp,
    nextNodeTemp,
} from '../../core/src/VNodes/AbstractNode';

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
                componentZones: [['test', ['root']]],
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
            editor.load(Html);
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
            editor.load(Html);
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
        it('should replace the target by the template which contains string', async () => {
            const editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<jw-editor><div>abc</div><t t-zone="default"/></jw-editor>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'replace']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal('<jw-editor><div>abc</div></jw-editor>');
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should replace the target by the template which contains string and format', async () => {
            const editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            const template =
                                '<jw-editor><div>abc<u><b>de<i>f</i></b></u>ghi</div><t t-zone="default"/></jw-editor>';
                            return editor.plugins.get(Parser).parse('text/html', template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'replace']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<jw-editor><div>abc<u><b>de<i>f</i></b></u>ghi</div></jw-editor>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should add the template after the target (template as string)', async () => {
            const editor = new JWEditor();
            editor.load(Html);
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
            editor.load(Html);
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
            editor.load(Html);
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
            a.append(new ZoneNode({ managedZones: ['main'] }));
            a.append(new ZoneNode({ managedZones: ['default'] }));

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
            editor.load(Html);
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
            editor.load(Html);
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
            editor.load(Html);
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
            editor.load(Html);
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
            editor.load(Html);
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
            other.id = 'other';
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
            editor.load(Html);
            editor.load(Char);
            editor.configure(DomLayout, {
                components: [
                    {
                        id: 'aaa',
                        async render(editor: JWEditor): Promise<VNode[]> {
                            return parseElement(editor, template);
                        },
                    },
                ],
                locations: [['aaa', [target, 'after']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div>' +
                    '<t-temp>abcdef</t-temp>' +
                    '<div id="other"><t-temp>abcdef<t t-zone="main"></t><t t-zone="default"></t></t-temp></div>',
            );
            const domLayoutEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const charNodes = domLayoutEngine.getNodes(
                container.getElementsByTagName('t-temp')[0].firstChild as Node,
            );
            expect(nextSiblingNodeTemp(editor.selection.anchor)).to.equal(charNodes[1]);
            expect(nextSiblingNodeTemp(editor.selection.focus)).to.equal(charNodes[2]);
            expect(editor.selection.direction).to.equal(Direction.FORWARD);
            await editor.stop();
            expect(container.innerHTML).to.equal(
                '<div class="editable"></div><div id="other"><t-temp>abcdef<t t-zone="main"></t><t t-zone="default"></t></t-temp></div>',
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
                    componentZones: [['aaa', ['root']]],
                };
                async start(): Promise<void> {}
            }
            const editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.load(Plugin);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            await editor.start();
            expect(container.innerHTML).to.equal('<div class="a"><div class="b"></div></div>');
            await editor.stop();
            expect(container.innerHTML).to.equal('<div class="editable"></div>');
        });
        it('should use a theme with template which use custom location', async () => {
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
                        ['aaa', ['root']],
                        ['bbb', ['root']],
                    ],
                };
                async start(): Promise<void> {}
            }
            const editor = new JWEditor();
            editor.load(Html);
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
                    expect(document.querySelector('jw-body').innerHTML).to.equal(
                        '<jw-test contenteditable="true">' +
                            '<v>abc<w>def<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xyz</v>' +
                            '</jw-test>',
                    );
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
                    componentZones: [['test', ['main']]],
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
                    componentZones: [['test', ['main']]],
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
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
                    return await parseElement(editor, template);
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', ['main']]],
                };
            }

            const editor = new JWEditor();
            editor.load(Html);
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

            expect(nextSiblingNodeTemp(editor.selection.anchor)).to.equal(charNodes[1]);
            expect(nextSiblingNodeTemp(editor.selection.focus)).to.equal(charNodes[2]);
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
                    componentZones: [['test', ['main']]],
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
                    componentZones: [['test', ['main']]],
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
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
            class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                static id = DomObjectRenderingEngine.id;
                engine: DomObjectRenderingEngine;
                predicate = CustomNode;
                async render(): Promise<DomObject> {
                    return {
                        tag: 'SECTION',
                        children: [{ tag: 'DIV', children: [{ text: 'abc' }] }],
                    };
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
                    renderers: [CustomHtmlObjectRenderer],
                    componentZones: [['test', ['main']]],
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
        it('should parse the selection inside a child node create by the renderer (only his parent is linked to VNode, only htmlDom renderer)', async () => {
            class CustomNode extends ContainerNode {}
            class CustomDomRenderer extends NodeRenderer<DomObject> {
                static id = DomObjectRenderingEngine.id;
                engine: DomObjectRenderingEngine;
                predicate = CustomNode;
                async render(): Promise<DomObject> {
                    const section = document.createElement('section');
                    section.innerHTML = '<div>abc</div>';
                    return { dom: [section] };
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
                    componentZones: [['test', ['main']]],
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
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
        it('should parse the selection which target a children offset node', async () => {
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
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.load(Image);
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
        it('should parse the selection which target a sibling node add only in the DOM (without any renderer)', async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                async render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<div>abc</div>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
        it('should parse the selection which target a existing child node', async () => {
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
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
                    editor.memory.create('test').switchTo('test'); // Unfreeze the memory for test.

                    removeNodeTemp(
                        domLayout.components
                            .get('editable')[0]
                            .children()[0]
                            .children()[0],
                    );
                    document.getSelection().removeAllRanges();
                    await domLayout.redraw();
                },
                contentAfter: '<div><p>b</p></div>',
            });
        });
        it("shouldn't redraw a wrong selection", async () => {
            const Component: ComponentDefinition = {
                id: 'test',
                render(editor: JWEditor): Promise<VNode[]> {
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
                    return editor.plugins.get(Parser).parse('text/html', '<p>abc</p><p>def</p>');
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Layout> = {
                    components: [Component],
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
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
                    componentZones: [['test', ['main']]],
                };
            }
            const editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            document.getSelection().removeAllRanges();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const div = engine.getNodes(container.querySelector('div'))[0];
            const parent = div.parent;
            removeNodeTemp(div);

            await engine.redraw([parent]);

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
        describe('complex location', () => {
            it('should redraw a selection in a custom fragment with children which have same rendering', async () => {
                class CustomNode extends AtomicNode {}
                const custom = new CustomNode();
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        const domObject: DomObjectFragment = {
                            children: [
                                {
                                    text: 'a',
                                },
                                {
                                    tag: 'SPAN',
                                },
                                {
                                    text: 'a',
                                },
                            ],
                        };
                        this.engine.locate([node], domObject.children[0] as DomObjectText);
                        this.engine.locate([node], domObject.children[1] as DomObjectElement);
                        this.engine.locate([node], domObject.children[2] as DomObjectText);
                        return domObject;
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                beforeNodeTemp(custom, new CharNode({ char: 'X' }));
                afterNodeTemp(custom, new CharNode({ char: 'Y' }));
                editor.selection.set({
                    anchorNode: custom,
                    anchorPosition: RelativePosition.AFTER,
                    focusNode: custom,
                    direction: Direction.BACKWARD,
                    focusPosition: RelativePosition.AFTER,
                });

                document.getSelection().removeAllRanges();
                await engine.redraw([
                    custom.parent,
                    previousNodeTemp(custom),
                    nextNodeTemp(custom),
                ]);

                const domEditor = container.getElementsByTagName('jw-editor')[0];

                let childNodes = [...domEditor.childNodes] as Node[];
                let domSelection = target.ownerDocument.getSelection();
                expect(childNodes.indexOf(domSelection.anchorNode)).to.deep.equal(3);
                expect(domSelection.anchorOffset).to.deep.equal(1);

                // redraw without changes
                await engine.redraw([custom]);

                childNodes = [...domEditor.childNodes] as Node[];
                domSelection = target.ownerDocument.getSelection();
                expect(childNodes.indexOf(domSelection.anchorNode)).to.deep.equal(
                    3,
                    'after redraw',
                );
                expect(domSelection.anchorOffset).to.deep.equal(1, 'after redraw');

                await editor.stop();
            });
        });
    });
    describe('render', () => {
        it('should render text which contain range', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'a[b]c',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];

                    const renderer = editor.plugins.get(Renderer);
                    const rendered = await renderer.render<DomObject>('dom/object', editable);
                    const textNodes = editable.children();

                    expect(rendered && 'children' in rendered && rendered.children).to.deep.equal(
                        textNodes,
                    );

                    const renderedText = await renderer.render<DomObject>(
                        'dom/object',
                        textNodes[0],
                    );
                    expect(renderedText).to.deep.equal({ text: 'abc' });
                },
                contentAfter: 'a[b]c',
            });
        });
        it('should render text with format', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'a[<i>b]</i>c',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];

                    const renderer = editor.plugins.get(Renderer);
                    const rendered = await renderer.render<DomObject>('dom/object', editable);
                    const textNodes = editable.children();

                    expect(
                        rendered &&
                            'children' in rendered &&
                            rendered.children.map(n => 'id' in n && n.id),
                    ).to.deep.equal(textNodes.map(n => n.id));

                    const renderedText0 = await renderer.render('dom/object', textNodes[0]);
                    expect(renderedText0).to.deep.equal({ text: 'a' });

                    const renderedText1 = await renderer.render('dom/object', textNodes[1]);
                    expect(renderedText1).to.deep.equal({
                        tag: 'I',
                        attributes: {},
                        children: [{ text: 'b' }],
                    });
                    const renderedText2 = await renderer.render('dom/object', textNodes[2]);
                    expect(renderedText2).to.deep.equal({ text: 'c' });
                },
                contentAfter: 'a[<i>b]</i>c',
            });
        });
        it('should render text and linebreak with format', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'a[b<br>c]d',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const renderer = editor.plugins.get(Renderer);
                    const br = editable.children()[2];

                    await editor.execBatch(() => {
                        new BoldFormat().applyTo(br);
                        return editor.execCommand<Inline>('toggleFormat', {
                            FormatClass: BoldFormat,
                        });
                    });
                    expect(await renderer.render('dom/object', br)).to.deep.equal({
                        tag: 'B',
                        attributes: {},
                        children: [
                            { text: 'b' },
                            { children: [{ tag: 'BR', attributes: {} }] },
                            { text: 'c' },
                        ],
                    });
                },
                contentAfter: 'a[<b>b<br>c]</b>d',
            });
        });
    });
    describe('redraw with minimum mutation', () => {
        let observer: MutationObserver;
        let mutationNumber: number;
        beforeEach(() => {
            mutationNumber = 0;
            observer = new MutationObserver(mutations => {
                mutationNumber += mutations.length;
            });
            observer.observe(document.body, {
                characterData: true, // monitor text content changes
                childList: true, // monitor child nodes addition or removal
                subtree: true, // extend monitoring to all children of the target
                attributes: true, // monitor attribute changes
            });
        });
        afterEach(() => {
            observer.disconnect();
        });
        describe('all', () => {
            it('should redraw text and add format', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<i>[b]</i>c',
                    stepFunction: async (editor: JWEditor) => {
                        await nextTick();
                        mutationNumber = 0;

                        await editor.execCommand<Inline>('toggleFormat', {
                            FormatClass: BoldFormat,
                        });

                        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                        const editable = domEngine.components.get('editable')[0];

                        const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                        expect(domEditable.innerHTML).to.equal('a<b><i>b</i></b>c');

                        const renderer = editor.plugins.get(Renderer);
                        const rendered = await renderer.render<DomObject>('dom/object', editable);
                        const textNodes = editable.children();

                        expect(
                            rendered && 'children' in rendered && rendered.children,
                        ).to.deep.equal(textNodes);

                        expect(mutationNumber).to.equal(4, 'add <b>, move <i>, 2 toolbar update');

                        const renderedText1 = await renderer.render('dom/object', textNodes[1]);
                        expect(renderedText1).to.deep.equal({
                            tag: 'B',
                            attributes: {},
                            children: [
                                {
                                    tag: 'I',
                                    attributes: {},
                                    children: [{ text: 'b' }],
                                },
                            ],
                        });
                    },
                    contentAfter: 'a[<b><i>b]</i></b>c',
                });
            });
            it('should redraw all with new item', async () => {
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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const b = engine.getNodes(container.getElementsByTagName('p')[0].firstChild)[1];
                const area = new VElement({ htmlTag: 'area' });
                afterNodeTemp(b, area);

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor><p>abc</p><p>def</p></jw-editor>');
                await engine.redraw();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'update text, add <area>, add text');

                await editor.stop();
            });
            it('should redraw all with new item, with node before the editor', async () => {
                container.prepend(document.createElement('section'));
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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const b = engine.getNodes(container.getElementsByTagName('p')[0].firstChild)[1];
                const area = new VElement({ htmlTag: 'area' });
                afterNodeTemp(b, area);

                expect(container.innerHTML).to.equal(
                    '<section></section><jw-editor><p>abc</p><p>def</p></jw-editor>',
                );

                await nextTick();
                mutationNumber = 0;

                await engine.redraw();
                expect(container.innerHTML).to.equal(
                    '<section></section><jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'update text, add <area>, add text');

                await editor.stop();
            });
            it('should throw an error if try to redraw with an altered DOM for the editor (removed target to replace)', async () => {
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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                document.getElementsByTagName('jw-editor')[0].remove();

                await nextTick();
                mutationNumber = 0;

                let hasFail = false;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw().catch(e => {
                    expect(e.message).to.include('Impossible');
                    hasFail = true;
                });

                expect(hasFail).to.equal(true);

                expect(mutationNumber).to.equal(0, 'no update');

                await editor.stop();
            });
            it('should redraw all with new item with altered DOM (remove target) but already the dom contains the editor component', async () => {
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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'after'] });
                editor.load(Plugin);
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const b = engine.getNodes(container.getElementsByTagName('p')[0].firstChild)[1];
                const area = new VElement({ htmlTag: 'area' });
                afterNodeTemp(b, area);

                target.remove();

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor><p>abc</p><p>def</p></jw-editor>');
                await engine.redraw();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
                );

                expect(mutationNumber).to.equal(
                    3,
                    'update text, add <area>, add text, do not need to update the parent',
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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
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
                    componentZones: [['template', ['root']]],
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
                const div = engine.getNodes(divDom)[0];
                const area = new VElement({ htmlTag: 'area' });
                afterNodeTemp(div, area);

                expect(container.innerHTML).to.equal(
                    '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div>',
                );

                await nextTick();
                mutationNumber = 0;

                await engine.redraw();
                expect(container.innerHTML).to.equal(
                    '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div><area>',
                );

                expect(mutationNumber).to.equal(1, 'add <area>');

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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
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
                    componentZones: [['template', ['root']]],
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
                afterNodeTemp(p, area);

                divDom.remove();

                expect(container.innerHTML).to.equal(
                    '<div class="a"><br></div><p>abc</p><p>def</p>',
                );

                await nextTick();
                mutationNumber = 0;

                await engine.redraw();
                expect(container.innerHTML).to.equal(
                    '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div><area>',
                );

                expect(mutationNumber).to.equal(2, 're-insert <div>, insert <area>');

                await editor.stop();
            });
            it('should redraw a template with altered DOM (remove first component)', async () => {
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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
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
                afterNodeTemp(p, area);

                divDom.remove();

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<p>abc</p><p>def</p><div class="b"></div>');
                await engine.redraw();
                expect(container.innerHTML).to.equal(
                    '<div class="a"><br></div><area><p>abc</p><p>def</p><div class="b"></div>',
                );

                expect(mutationNumber).to.equal(2, 're-insert <div>, insert <area>');

                await editor.stop();
            });
            it('should throw an error if try to redraw with an altered DOM for the editor (removed target and editor component)', async () => {
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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'after'] });
                editor.load(Plugin);
                await editor.start();

                target.remove();
                document.getElementsByTagName('jw-editor')[0].remove();

                await nextTick();
                mutationNumber = 0;

                let hasFail = false;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw().catch(e => {
                    expect(e.message).to.include('Impossible');
                    hasFail = true;
                });

                expect(hasFail).to.equal(true);

                expect(mutationNumber).to.equal(0, 'no update');

                await editor.stop();
            });
            it('should throw an error if try to replace the target without any DOM node', async () => {
                class CustomNode extends AtomicNode {}
                const div = document.createElement('div');
                let index = 0;
                class CustomDomRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        index++;
                        return { dom: index === 1 ? [div] : [] };
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomDomRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
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

                await nextTick();
                mutationNumber = 0;

                let hasFail = false;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw().catch(e => {
                    expect(e.message).to.include('Impossible');
                    hasFail = true;
                });

                expect(hasFail).to.equal(true);

                expect(mutationNumber).to.equal(1, 'remove <div>');

                await editor.stop();
            });
        });
        describe('text', () => {
            let editor: JWEditor;
            let div: VNode;
            beforeEach(async () => {
                editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Bold);
                editor.load(Italic);
                editor.load(Underline);
                editor.load(LineBreak);
                editor.configure(DomLayout, {
                    location: [target, 'replace'],
                    components: [
                        {
                            id: 'aaa',
                            async render(editor: JWEditor): Promise<VNode[]> {
                                [div] = await editor.plugins
                                    .get(Parser)
                                    .parse('text/html', '<div><p>abcdef</p><p>123456</p></div>');
                                return [div];
                            },
                        },
                    ],
                    componentZones: [['aaa', ['main']]],
                });
                await editor.start();
            });
            afterEach(async () => {
                await editor.stop();
            });
            it('should delete the last characters in a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const f = p.children()[5];
                const e = p.children()[4];
                removeNodeTemp(f);
                removeNodeTemp(e);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcd</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should delete the last characters in a paragraph (in VNode and Dom)', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const f = p.children()[5];
                const e = p.children()[4];
                removeNodeTemp(f);
                removeNodeTemp(e);
                text.textContent = 'abcd';

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, f, e]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcd</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(0);
            });
            it('should delete the first characters in a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const a = p.children()[0];
                const b = p.children()[1];
                removeNodeTemp(a);
                removeNodeTemp(b);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>cdef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should delete characters in a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const c = p.children()[2];
                const d = p.children()[3];
                removeNodeTemp(c);
                removeNodeTemp(d);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should delete characters in a paragraph with split in DOM', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild as Text;

                const p = div.firstChild();
                const c = p.children()[2];
                const d = p.children()[3];
                removeNodeTemp(c);
                removeNodeTemp(d);

                const text2 = text.splitText(3);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abef</p><p>123456</p></div></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same ab');
                expect(pDom.lastChild === text2).to.equal(true, 'Use same ef');

                expect(mutationNumber).to.equal(2, 'abc => ab ; def => ef');
            });
            it('should delete characters in a paragraph with split in DOM and removed Text', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild as Text;

                const p = div.firstChild();
                const b = p.children()[1];
                const c = p.children()[2];
                const d = p.children()[3];
                removeNodeTemp(b);
                removeNodeTemp(c);
                removeNodeTemp(d);

                const text2 = text.splitText(2);
                const text3 = text2.splitText(2);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>aef</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect([...pDom.childNodes]).to.deep.equal([text, text3], 'Use the same texts');

                expect(mutationNumber).to.equal(2, 'ab => a ; remove cd');
            });
            it('should delete characters in a paragraph with split in DOM', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild as Text;

                const p = div.firstChild();
                const c = p.children()[2];
                const d = p.children()[3];
                removeNodeTemp(c);
                removeNodeTemp(d);

                const text2 = text.splitText(3);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abef</p><p>123456</p></div></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same ab');
                expect(pDom.lastChild === text2).to.equal(true, 'Use same ef');

                expect(mutationNumber).to.equal(2, 'abc => ab ; def => ef');
            });
            it('should replace a character in a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const c = p.children()[2];
                const d = p.children()[3];
                const x = new CharNode({ char: 'x' });
                afterNodeTemp(c, x);
                removeNodeTemp(c);
                removeNodeTemp(d);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abxef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should delete the last character and replace ce previous in a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const f = p.children()[5];
                const e = p.children()[4];
                const z = new CharNode({ char: 'z' });
                beforeNodeTemp(e, z);
                removeNodeTemp(f);
                removeNodeTemp(e);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcdz</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should replace a character in a paragraph with same chars', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const c = p.children()[2];
                const x = new CharNode({ char: 'x' });
                const x2 = new CharNode({ char: 'x' });
                const x3 = new CharNode({ char: 'x' });
                afterNodeTemp(c, x);
                afterNodeTemp(x, x2);
                afterNodeTemp(x2, x3);

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcxxxdef</p><p>123456</p></div></jw-editor>',
                );

                removeNodeTemp(x2);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcxxdef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should add char identique to the previous in a paragraph', async () => {
                await editor.stop();
                editor.configure(DomLayout, {
                    components: [
                        {
                            id: 'aaa',
                            async render(editor: JWEditor): Promise<VNode[]> {
                                [div] = await editor.plugins
                                    .get(Parser)
                                    .parse('text/html', '<div><p>1.000.0</p></div>');
                                return [div];
                            },
                        },
                    ],
                });
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const add0 = new CharNode({ char: '0' });
                afterNodeTemp(p.children()[4], add0);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(pDom.outerHTML).to.equal('<p>1.0000.0</p>');
                expect(mutationNumber).to.equal(1);
            });
            it('should remove char identique to the previous and next in a paragraph', async () => {
                await editor.stop();
                editor.configure(DomLayout, {
                    components: [
                        {
                            id: 'aaa',
                            async render(editor: JWEditor): Promise<VNode[]> {
                                [div] = await editor.plugins
                                    .get(Parser)
                                    .parse('text/html', '<div><p>1.000.0</p></div>');
                                return [div];
                            },
                        },
                    ],
                });
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const char0 = p.children()[3];
                removeNodeTemp(char0);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(pDom.outerHTML).to.equal('<p>1.00.0</p>');
                expect(mutationNumber).to.equal(1);
            });
            it('should merge 2 paragraphs which contains simple text', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p1 = div.firstChild();
                const p2 = div.lastChild();
                const chars = p2.children();
                p2.mergeWith(p1);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([div, p1, ...chars, p2]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcdef123456</p></div></jw-editor>',
                );

                await nextTick();

                expect(mutationNumber).to.equal(3, 'abcdef => abcdef123456 ; remove p & text');
            });
            it('should remove paragraphs content', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p1 = div.firstChild();
                const chars = p1.children();
                p1.empty();

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p1, ...chars]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(!!text.parentNode).to.equal(false);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p><br></p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(2, 'add <br>, remove text');
            });
            it('should merge to paragraphs which contains br and text', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text2 = pDom.nextElementSibling.firstChild;

                const p1 = div.firstChild();
                const chars = p1.children();
                p1.empty();

                await engine.redraw([p1, ...chars]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p><br></p><p>123456</p></div></jw-editor>',
                );

                const p2 = div.lastChild();
                const chars2 = p2.children();
                p2.mergeWith(p1);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([div, p1, ...chars2, p2]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text2).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(4, 'add text; remove <br>; remove <p> & text');
            });
            it('should merge to paragraphs with selection', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p1 = div.firstChild();
                const p2 = div.lastChild();
                editor.selection.setAt(p2.firstChild(), RelativePosition.BEFORE);
                const chars = p2.children();
                p2.mergeWith(p1);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([div, p1, ...chars, p2]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                renderTextualSelection();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcdef[]123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'update text; remove <p> & text');
            });
            it('should add characters at the end of a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const g = new CharNode({ char: 'g' });
                const h = new CharNode({ char: 'h' });
                p.append(g, h);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, g, h]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcdefgh</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'update text');
            });
            it('should split a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const f = p.children()[5];
                const e = p.children()[4];
                const newP = new VElement({ htmlTag: 'P' });
                newP.append(e, f);
                afterNodeTemp(p, newP);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes, newP, ...newP.childVNodes]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcd</p><p>ef</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(2, 'update text; add <p> & text');
            });
            it('should make bold all chars', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;
                const pDom2 = pDom.nextElementSibling;
                const text2 = pDom2.firstChild;

                const p = div.firstChild();
                const p2 = div.lastChild();
                for (const char of p.children(InlineNode)) {
                    new BoldFormat().applyTo(char);
                }
                for (const char of p2.children(InlineNode)) {
                    new BoldFormat().applyTo(char);
                }

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([...p.children(), ...p2.children()]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p><b>abcdef</b></p><p><b>123456</b></p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild.firstChild).to.equal(text);
                expect(pDom2.firstChild.firstChild).to.equal(text2);

                expect(mutationNumber).to.equal(4, 'add bold & text; add bold & text');
            });
            it('should make bold p', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');

                const p = div.firstChild();
                const p2 = div.lastChild();

                new BoldFormat().applyTo(p);
                new BoldFormat().applyTo(p2);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, p2]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><b><p>abcdef</p><p>123456</p></b></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');

                expect(mutationNumber).to.equal(3, 'parent bold, move into bold');
            });
            it('should split a paragraph within a format node', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const p2 = div.lastChild();
                for (const char of p.children(InlineNode)) {
                    new BoldFormat().applyTo(char);
                }

                await engine.redraw([...p.children(), ...p2.children()]);

                const dBold = pDom.firstChild;

                const f = p.children()[5];
                const e = p.children()[4];
                const newP = new VElement({ htmlTag: 'P' });
                newP.append(e, f);
                afterNodeTemp(p, newP);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes, newP, ...newP.childVNodes]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p><b>abcd</b></p><p><b>ef</b></p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === dBold).to.equal(true, 'Use same bold');
                expect(dBold.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(2, 'update text; add <p> & <b> & text');
            });
            it('should add a linebreak in a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const lineBreak = new LineBreakNode();
                afterNodeTemp(p.children()[2], lineBreak);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abc<br>def</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'update text; add <br> & text');
            });
            it('should remove a linebreak in a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const lineBreak = new LineBreakNode();
                afterNodeTemp(p.children()[2], lineBreak);

                await engine.redraw([p, ...p.childVNodes]);

                removeNodeTemp(lineBreak);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abc<br>def</p><p>123456</p></div></jw-editor>',
                );

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...p.childVNodes]);

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');

                expect(pDom.childNodes.length).to.equal(2);
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcdef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'remove <br>');

                const marker = new MarkerNode();
                afterNodeTemp(p.children()[3], marker);
                const location = engine._domReconciliationEngine.getLocations(marker);
                expect(location).to.deep.equal(
                    [pDom.lastChild, 1],
                    'location in the second text node',
                );
            });
            it('should redraw a br', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');

                const p = div.firstChild();
                const children = p.children();
                p.empty();

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p, ...children]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p><br></p><p>123456</p></div></jw-editor>',
                );

                expect(pDom.childNodes.length).to.equal(1);
                const br = pDom.firstChild;
                expect(br.nodeName).to.equal('BR');

                expect(engine.getNodes(pDom)).to.deep.equal([p], '<p> to VNode');

                expect(mutationNumber).to.equal(2, 'remove text; insert <br>');

                const marker = new MarkerNode();
                p.prepend(marker);

                let location = engine._domReconciliationEngine.getLocations(marker);
                expect(location).to.deep.equal([pDom, 0], 'location with a new marker');

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([p]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p><br></p><p>123456</p></div></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild).to.equal(br);
                location = engine._domReconciliationEngine.getLocations(marker);
                expect(location).to.deep.equal([pDom, 0]);

                expect(mutationNumber).to.equal(0);
            });
            it('should delete a starting char of a paragraph and a linebreak in altered dom', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                const p = div.firstChild();
                const lineBreak = new LineBreakNode();
                const d = p.children()[3];
                afterNodeTemp(p.children()[2], lineBreak);

                editor.selection.setAt(d, RelativePosition.AFTER);

                await engine.redraw([p, ...p.childVNodes]);

                removeNodeTemp(d);
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;
                const br = pDom.childNodes[1];
                const text2 = pDom.lastChild;
                text2.textContent = 'ef';
                engine.markForRedraw(new Set([br, text2]));

                mutationNumber = 0;
                const promise = engine.redraw([p, ...p.childVNodes]);

                pDom.removeChild(br);

                await promise;

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(pDom.innerHTML).to.equal('abc<br>ef');

                expect(mutationNumber).to.equal(3);
            });
            it('should add style on char', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');

                const p = div.firstChild();
                const children = p.children();
                const bold = new BoldFormat();
                bold.applyTo(children[1]);
                bold.applyTo(children[2]);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([children[1], children[2]]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>a<b>bc</b>def</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(mutationNumber).to.equal(3, 'update text, add bold, add text');
            });
            it('should remove style on char', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');

                const p = div.firstChild();
                const children = p.children();
                const bold = new BoldFormat();
                bold.applyTo(children[1]);
                bold.applyTo(children[2]);

                await engine.redraw([children[1], children[2]]);

                children[1].modifiers.remove(bold);
                children[2].modifiers.remove(bold);

                await nextTick();
                mutationNumber = 0;

                await engine.redraw([children[1], children[2]]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>abcdef</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(mutationNumber).to.equal(
                    3,
                    'remove bold, update text, remove text in removed <b>',
                );
            });
        });
        describe('update VNodes and DomNodes with minimum mutations', () => {
            it('should split a paragraph and keep the created nodes', async () => {
                const Component: ComponentDefinition = {
                    id: 'test',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse('text/html', '<section><div><p>abcd</p></div></section>');
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                // update dom

                const sectionDom = container.querySelector('section');
                const divDom = sectionDom.querySelector('div');
                const pDom = divDom.querySelector('p');
                const textDom = pDom.firstChild;

                const newTextDom = document.createTextNode('ab');
                pDom.insertBefore(newTextDom, textDom);
                textDom.textContent = 'cd';
                const newPDom = document.createElement('p');
                divDom.appendChild(newPDom);
                newPDom.appendChild(textDom);

                // update VNode

                const layout = editor.plugins.get(Layout);
                const domLayout = layout.engines.dom as DomLayoutEngine;
                const section = domLayout.components.get('test')[0];
                const div = section.firstChild();
                const p = div.firstChild();
                const p2 = p.splitAt(p.childVNodes[2]);
                // Add an other char to check if the dom are effectively redrawed.
                p2.append(new CharNode({ char: 'z' }));

                await nextTick();
                mutationNumber = 0;

                // redraw
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const nodesWithChanges = new Set([pDom, textDom, newPDom, newTextDom, divDom]);
                engine.markForRedraw(nodesWithChanges);
                await engine.redraw([
                    div,
                    ...div.childVNodes,
                    ...flat(div.childVNodes.map(n => n.childVNodes)),
                ]);

                expect(sectionDom.innerHTML).to.equal('<div><p>ab</p><p>cdz</p></div>');
                expect(container.querySelector('section') === sectionDom).to.equal(
                    true,
                    'Use same <section>',
                );
                expect(divDom.firstChild === pDom).to.equal(true, 'Use same first <P>');
                expect(pDom.firstChild === newTextDom).to.equal(true, 'Use same text ab');
                expect(divDom.lastChild === newPDom).to.equal(true, 'Use same second <P>');
                expect(newPDom.firstChild === textDom).to.equal(true, 'Use same text cd');

                expect(mutationNumber).to.equal(1, 'Only one mutation: cd => cdz');

                await editor.stop();
            });
            it('should split a paragraph and keep the created nodes', async () => {
                const Component: ComponentDefinition = {
                    id: 'test',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse('text/html', '<section><div><p>abcd</p></div></section>');
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                // update dom

                const sectionDom = container.querySelector('section');
                const divDom = sectionDom.querySelector('div');
                const pDom = divDom.querySelector('p');
                const textDom = pDom.firstChild;

                const newTextDom = document.createTextNode('ab');
                pDom.insertBefore(newTextDom, textDom);
                textDom.textContent = 'cd';
                const newPDom = document.createElement('p');
                divDom.appendChild(newPDom);
                newPDom.appendChild(textDom);

                // update VNode

                const layout = editor.plugins.get(Layout);
                const domLayout = layout.engines.dom as DomLayoutEngine;
                const section = domLayout.components.get('test')[0];
                const div = section.firstChild();
                const p = div.firstChild();
                p.splitAt(p.childVNodes[2]);

                await nextTick();
                mutationNumber = 0;

                // redraw
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const nodesWithChanges = new Set([pDom, textDom, newPDom, newTextDom, divDom]);
                engine.markForRedraw(nodesWithChanges);
                await engine.redraw([
                    div,
                    ...div.childVNodes,
                    ...flat(div.childVNodes.map(n => n.childVNodes)),
                ]);

                expect(sectionDom.innerHTML).to.equal('<div><p>ab</p><p>cd</p></div>');
                expect(container.querySelector('section') === sectionDom).to.equal(
                    true,
                    'Use same <section>',
                );
                expect(divDom.firstChild === pDom).to.equal(true, 'Use same first <P>');
                expect(pDom.firstChild === newTextDom).to.equal(true, 'Use same text ab');
                expect(divDom.lastChild === newPDom).to.equal(true, 'Use same second <P>');
                expect(newPDom.firstChild === textDom).to.equal(true, 'Use same text cd');

                expect(mutationNumber).to.equal(0, 'No mutation, use all dom modifications');

                await editor.stop();
            });
        });
        describe('nodes', () => {
            it('should add a item which return a fragment dom object', async () => {
                class CustomNode extends AtomicNode {}
                class CustomDomRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        return { children: [{ tag: 'AREA' }] };
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        const div = new VElement({ htmlTag: 'DIV' });
                        div.append(new CharNode({ char: 'a' }));
                        return [div];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        componentZones: [['test', ['main']]],
                        renderers: [CustomDomRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const custom = new CustomNode();
                const layout = editor.plugins.get(Layout);
                const domLayout = layout.engines.dom as DomLayoutEngine;
                const div = domLayout.components.get('test')[0];
                div.prepend(custom);

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor><div>a</div></jw-editor>');
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([div, custom]);
                expect(container.innerHTML).to.equal('<jw-editor><div><area>a</div></jw-editor>');

                expect(mutationNumber).to.equal(1, 'add <area>');

                await editor.stop();
            });
            it('should redraw an item from an empty DOM which use DOM renderer', async () => {
                class CustomNode extends AtomicNode {}
                const div = document.createElement('div');
                let index = 0;
                class CustomDomRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        index++;
                        return { dom: index === 1 ? [] : [div] };
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomDomRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>');

                expect(mutationNumber).to.equal(1, 'add <div>');

                await editor.stop();
            });
            it('should redraw an item by an empty DOM which use DOM renderer', async () => {
                class CustomNode extends AtomicNode {}
                const div = document.createElement('div');
                let index = 0;
                class CustomDomRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        index++;
                        return { dom: index === 1 ? [div] : [] };
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomDomRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>');
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');

                expect(mutationNumber).to.equal(1, 'remove <div>');

                await editor.stop();
            });
            it('should redraw twice an item by an empty DOM which use DOM renderer', async () => {
                class CustomNode extends AtomicNode {}
                class CustomDomRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        return { dom: [document.createElement('div')] };
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomDomRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>');
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>');

                expect(mutationNumber).to.equal(2, 'remove <div>, add <div>');

                await editor.stop();
            });
            it('should redraw an item from an empty DOM which use Object Render domNodes', async () => {
                class CustomNode extends AtomicNode {}
                let index = 0;
                class CustomObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        index++;
                        return {
                            dom: index === 1 ? [] : [document.createElement('div')],
                        };
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomObjectRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>');

                expect(mutationNumber).to.equal(1, 'add <div>');

                await editor.stop();
            });
            it('should redraw an item to an empty DOM which use Object Render domNodes', async () => {
                class CustomNode extends AtomicNode {}
                let index = 0;
                class CustomObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        index++;
                        return {
                            dom: index === 1 ? [document.createElement('div')] : [],
                        };
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomObjectRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>');
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');

                expect(mutationNumber).to.equal(1, 'remove <div>');

                await editor.stop();
            });
            it('should toggle redraw an item emtpty/none-empty which use Object Render domNodes', async () => {
                class CustomNode extends AtomicNode {}
                let index = 0;
                class CustomObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        index++;
                        return {
                            dom: index % 2 ? [document.createElement('div')] : [],
                        };
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomObjectRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                await nextTick();

                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>', '1st');
                mutationNumber = 0;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>', '1st empty');
                expect(mutationNumber).to.equal(1, 'remove <div>');
                mutationNumber = 0;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>', '2nd');
                expect(mutationNumber).to.equal(1, 'add <div>');
                mutationNumber = 0;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>', '2nd empty');
                expect(mutationNumber).to.equal(1, 'remove <div>');

                await editor.stop();
            });
            it('should redraw same item in the DOM (with same DOM Node) and update className', async () => {
                class CustomNode extends AtomicNode {}
                const div = document.createElement('div');
                let index = 0;
                class CustomDomRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(): Promise<DomObject> {
                        index++;
                        div.className = 'redraw' + index;
                        return { dom: [div] };
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomDomRenderer],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div class="redraw1"></div></jw-editor>',
                );
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div class="redraw2"></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'update className');

                await editor.stop();
            });
            it('should redraw new item in the DOM', async () => {
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
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const b = engine.getNodes(pDom.firstChild)[1];
                const area = new VElement({ htmlTag: 'custom' });
                afterNodeTemp(b, area);

                await nextTick();
                mutationNumber = 0;

                expect(container.innerHTML).to.equal('<jw-editor><p>abc</p><p>def</p></jw-editor>');
                await engine.redraw([area.parent, ...area.parent.childVNodes]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><p>ab<custom><br></custom>c</p><p>def</p></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(3, 'update text, add custom, add text');

                await editor.stop();
            });
            it('should redraw a wrapped item', async () => {
                const p = new VElement({ htmlTag: 'P' });
                p.append(new CharNode({ char: 'a' }));

                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [p];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const area = new VElement({ htmlTag: 'custom' });
                wrapNodeTemp(p, area);

                mutationNumber = 0;
                await engine.redraw([area, area.parent, p]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><custom><p>a</p></custom></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(2, 'insert custom node, move p into custom');

                await editor.stop();
            });
            it('should redraw a unwrapped item', async () => {
                const p = new VElement({ htmlTag: 'P' });
                p.append(new CharNode({ char: 'a' }));

                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [p];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const area = new VElement({ htmlTag: 'custom' });

                wrapNodeTemp(p, area);
                await engine.redraw([area, p.parent, p]);

                area.unwrap();

                mutationNumber = 0;
                await engine.redraw([area, p.parent, p]);
                expect(container.innerHTML).to.equal('<jw-editor><p>a</p></jw-editor>');

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(3);

                await editor.stop();
            });
            it('should redraw the wrapped layoutContainer children', async () => {
                const p = new VElement({ htmlTag: 'P' });
                p.append(new CharNode({ char: 'a' }));

                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [p];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const area = new VElement({ htmlTag: 'custom' });

                wrapNodeTemp(engine.root.firstChild().firstChild(), area);

                mutationNumber = 0;
                await engine.redraw([area, area.parent, p]);
                expect(container.innerHTML).to.equal(
                    '<custom><jw-editor><p>a</p></jw-editor></custom>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(2, 'insert custom node, move p into custom');

                await editor.stop();
            });
            it('should redraw the unwrapped layoutContainer children', async () => {
                const p = new VElement({ htmlTag: 'P' });
                p.append(new CharNode({ char: 'a' }));

                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [p];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Layout> = {
                        components: [Component],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const area = new VElement({ htmlTag: 'custom' });
                const layoutContainer = engine.root.firstChild();
                const layoutchild = layoutContainer.firstChild();
                wrapNodeTemp(layoutchild, area);
                await engine.redraw([layoutContainer, area, layoutchild]);

                area.unwrap();

                mutationNumber = 0;
                await engine.redraw([layoutContainer, area, layoutchild]);
                expect(container.innerHTML).to.equal('<jw-editor><p>a</p></jw-editor>');

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(3);

                await editor.stop();
            });
            it('should not have mutation when redraw a custom node without change', async () => {
                class CustomNode extends ContainerNode {
                    sectionAttr = 1;
                    divAttr = 1;
                }
                const custom = new CustomNode();
                const customChild = new CustomNode();
                custom.append(customChild);
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        return {
                            tag: 'SECTION',
                            children: [
                                {
                                    tag: 'DIV',
                                    children: [
                                        {
                                            text: 'abc',
                                        },
                                    ],
                                    attributes: {
                                        attr: node.divAttr.toString(),
                                    },
                                },
                                ...node.children(),
                            ],
                            attributes: {
                                attr: node.sectionAttr.toString(),
                            },
                        };
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                mutationNumber = 0;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([custom]);

                expect(container.querySelector('section').outerHTML).to.equal(
                    '<section attr="1"><div attr="1">abc</div>' +
                        '<section attr="1"><div attr="1">abc</div></section>' +
                        '</section>',
                );

                expect(mutationNumber).to.equal(0);

                await editor.stop();
            });
            it('should not have mutation when redraw a child custom node without change', async () => {
                class CustomNode extends ContainerNode {
                    sectionAttr = 1;
                    divAttr = 1;
                }
                const custom = new CustomNode();
                const customChild = new CustomNode();
                custom.append(customChild);
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        return {
                            tag: 'SECTION',
                            children: [
                                {
                                    tag: 'DIV',
                                    children: [
                                        {
                                            text: 'abc',
                                        },
                                    ],
                                    attributes: {
                                        attr: node.divAttr.toString(),
                                    },
                                },
                                ...node.children(),
                            ],
                            attributes: {
                                attr: node.sectionAttr.toString(),
                            },
                        };
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                mutationNumber = 0;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw([customChild]);

                expect(container.querySelector('section').outerHTML).to.equal(
                    '<section attr="1"><div attr="1">abc</div>' +
                        '<section attr="1"><div attr="1">abc</div></section>' +
                        '</section>',
                );

                expect(mutationNumber).to.equal(0);

                await editor.stop();
            });
            it('should redraw an attribute in a custom node', async () => {
                class CustomNode extends ContainerNode {
                    sectionAttr = 1;
                    divAttr = 1;
                }
                const custom = new CustomNode();
                const customChild = new CustomNode();
                custom.append(customChild);
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        return {
                            tag: 'SECTION',
                            children: [
                                {
                                    tag: 'DIV',
                                    children: [
                                        {
                                            text: 'abc',
                                        },
                                    ],
                                    attributes: {
                                        attr: node.divAttr.toString(),
                                    },
                                },
                                ...node.children(),
                            ],
                            attributes: {
                                attr: node.sectionAttr.toString(),
                            },
                        };
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                mutationNumber = 0;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                custom.sectionAttr = 2;
                await engine.redraw([custom]);

                expect(container.querySelector('section').outerHTML).to.equal(
                    '<section attr="2"><div attr="1">abc</div>' +
                        '<section attr="1"><div attr="1">abc</div></section>' +
                        '</section>',
                );

                expect(mutationNumber).to.equal(1);

                await editor.stop();
            });
            it('should redraw a child attribute in a custom node', async () => {
                class CustomNode extends ContainerNode {
                    sectionAttr = 1;
                    divAttr = 1;
                }
                const custom = new CustomNode();
                const customChild = new CustomNode();
                custom.append(customChild);
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        return {
                            tag: 'SECTION',
                            children: [
                                {
                                    tag: 'DIV',
                                    children: [
                                        {
                                            text: 'abc',
                                        },
                                    ],
                                    attributes: {
                                        attr: node.divAttr.toString(),
                                    },
                                },
                                ...node.children(),
                            ],
                            attributes: {
                                attr: node.sectionAttr.toString(),
                            },
                        };
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                mutationNumber = 0;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                custom.divAttr = 2;
                await engine.redraw([custom]);

                expect(container.querySelector('section').outerHTML).to.equal(
                    '<section attr="1"><div attr="2">abc</div>' +
                        '<section attr="1"><div attr="1">abc</div></section>' +
                        '</section>',
                );

                expect(mutationNumber).to.equal(1);

                await editor.stop();
            });
            it('should redraw an attribute in a child custom node', async () => {
                class CustomNode extends ContainerNode {
                    sectionAttr = 1;
                    divAttr = 1;
                }
                const custom = new CustomNode();
                const customChild = new CustomNode();
                custom.append(customChild);
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        return {
                            tag: 'SECTION',
                            children: [
                                {
                                    tag: 'DIV',
                                    children: [
                                        {
                                            text: 'abc',
                                        },
                                    ],
                                    attributes: {
                                        attr: node.divAttr.toString(),
                                    },
                                },
                                ...node.children(),
                            ],
                            attributes: {
                                attr: node.sectionAttr.toString(),
                            },
                        };
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                mutationNumber = 0;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                customChild.sectionAttr = 2;
                await engine.redraw([customChild]);

                expect(container.querySelector('section').outerHTML).to.equal(
                    '<section attr="1"><div attr="1">abc</div>' +
                        '<section attr="2"><div attr="1">abc</div></section>' +
                        '</section>',
                );

                expect(mutationNumber).to.equal(1);

                await editor.stop();
            });
            it('should redraw a child attribute in a child custom node', async () => {
                class CustomNode extends ContainerNode {
                    sectionAttr = 1;
                    divAttr = 1;
                }
                const custom = new CustomNode();
                const customChild = new CustomNode();
                custom.append(customChild);
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        return {
                            tag: 'SECTION',
                            children: [
                                {
                                    tag: 'DIV',
                                    children: [
                                        {
                                            text: 'abc',
                                        },
                                    ],
                                    attributes: {
                                        attr: node.divAttr.toString(),
                                    },
                                },
                                ...node.children(),
                            ],
                            attributes: {
                                attr: node.sectionAttr.toString(),
                            },
                        };
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                mutationNumber = 0;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                customChild.divAttr = 2;
                await engine.redraw([customChild]);

                expect(container.querySelector('section').outerHTML).to.equal(
                    '<section attr="1"><div attr="1">abc</div>' +
                        '<section attr="1"><div attr="2">abc</div></section>' +
                        '</section>',
                );

                expect(mutationNumber).to.equal(1);

                await editor.stop();
            });
            it('should remove some attributes on everything', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<p style="background-color: red;">[a<span style="background-color: white;">b</span>c<span style="color: green; background-color: yellow;">d</span>e]</p>',
                    stepFunction: async editor => {
                        await nextTick();
                        mutationNumber = 0;
                        await editor.execCommand('uncolorBackground');
                        expect(mutationNumber).to.equal(
                            6,
                            'remove 3 formats + remove 2 empty styles',
                        );
                    },
                    contentAfter: '<p>[a<span>b</span>c<span style="color: green;">d</span>e]</p>',
                });
            });
            it('should not have mutation when redraw a custom fragment with children which have same rendering', async () => {
                class CustomNode extends AtomicNode {}
                const custom = new CustomNode();
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        const domObject: DomObjectFragment = {
                            children: [
                                {
                                    text: 'a',
                                },
                                {
                                    tag: 'SPAN',
                                },
                                {
                                    text: 'a',
                                },
                            ],
                        };
                        this.engine.locate([node], domObject.children[0] as DomObjectText);
                        this.engine.locate([node], domObject.children[1] as DomObjectElement);
                        this.engine.locate([node], domObject.children[2] as DomObjectText);
                        return domObject;
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                // redraw without changes
                mutationNumber = 0;
                await engine.redraw([custom]);
                expect(mutationNumber).to.equal(0);

                await editor.stop();
            });
            it('should not have mutation when redraw a custom fragment (with siblings) with children which have same rendering', async () => {
                class CustomNode extends AtomicNode {}
                const custom = new CustomNode();
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        const domObject: DomObjectFragment = {
                            children: [
                                {
                                    text: 'a',
                                },
                                {
                                    tag: 'SPAN',
                                },
                                {
                                    text: 'a',
                                },
                            ],
                        };
                        this.engine.locate([node], domObject.children[0] as DomObjectText);
                        this.engine.locate([node], domObject.children[1] as DomObjectElement);
                        this.engine.locate([node], domObject.children[2] as DomObjectText);
                        return domObject;
                    }
                }
                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();

                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                beforeNodeTemp(custom, new CharNode({ char: 'X' }));
                afterNodeTemp(custom, new CharNode({ char: 'Y' }));

                mutationNumber = 0;
                await engine.redraw([
                    custom.parent,
                    previousNodeTemp(custom),
                    nextNodeTemp(custom),
                ]);
                expect(mutationNumber).to.equal(2, 'add 2 text');

                // redraw without changes
                mutationNumber = 0;
                await engine.redraw([custom]);
                expect(mutationNumber).to.equal(0);

                await editor.stop();
            });
            it('should redraw to changed nodes with the same layout', async () => {
                class CustomNode extends ContainerNode {}
                const span = new CustomNode();
                const a = new CharNode({ char: 'a' });
                span.append(a);

                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        const domObject: DomObject = {
                            tag: 'DIV',
                            children: [
                                {
                                    tag: 'SPAN',
                                    children: node.children(),
                                },
                            ],
                        };
                        return domObject;
                    }
                }

                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [span];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                const a2 = new CharNode({ char: 'a' });
                afterNodeTemp(a, a2);
                removeNodeTemp(a);

                // redraw with changes but identical result
                mutationNumber = 0;
                await engine.redraw([span, a, a2]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><span>a</span></div></jw-editor>',
                );
                expect(mutationNumber).to.equal(0);

                await editor.stop();
            });
            it('should redraw to changed nodes with the same layout and have lowerCase tag', async () => {
                class CustomNode extends ContainerNode {}
                const span = new CustomNode();
                const a = new CharNode({ char: 'a' });
                span.append(a);

                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        const domObject: DomObject = {
                            tag: 'DIV',
                            children: [
                                {
                                    tag: 'span',
                                    children: node.children(),
                                },
                            ],
                        };
                        return domObject;
                    }
                }

                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [span];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                const a2 = new CharNode({ char: 'a' });
                afterNodeTemp(a, a2);
                removeNodeTemp(a);

                // redraw with changes but identical result
                mutationNumber = 0;
                await engine.redraw([span, a, a2]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><span>a</span></div></jw-editor>',
                );
                expect(mutationNumber).to.equal(0);

                await editor.stop();
            });
            it('should redraw to changed nodes with changind tag', async () => {
                class CustomNode extends ContainerNode {}
                const span = new CustomNode();
                const a = new CharNode({ char: 'a' });
                span.append(a);

                let render = 0;

                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(node: CustomNode): Promise<DomObject> {
                        const domObject: DomObject = {
                            tag: 'DIV',
                            children: [
                                {
                                    tag: render++ ? 'font' : 'span',
                                    children: node.children(),
                                },
                            ],
                        };
                        return domObject;
                    }
                }

                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [span];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomHtmlObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><span>a</span></div></jw-editor>',
                );

                const a2 = new CharNode({ char: 'a' });
                afterNodeTemp(a, a2);
                removeNodeTemp(a);

                // redraw with changes but identical result
                mutationNumber = 0;
                await engine.redraw([span, a, a2]);

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><font>a</font></div></jw-editor>',
                );
                expect(mutationNumber).to.equal(3);

                await editor.stop();
            });
            it('should redraw with custom node with a structure which change', async () => {
                class CustomNode extends ContainerNode {
                    layout = 0;
                }
                const custom = new CustomNode();
                const article = new VElement({ htmlTag: 'ARTICLE' });
                custom.append(article);

                class CustomDomObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(custom: CustomNode): Promise<DomObject> {
                        let domObject: DomObject;
                        if (custom.layout) {
                            domObject = {
                                tag: 'DIV',
                                children: [
                                    {
                                        tag: 'HEAD',
                                        children: [{ text: 'a' }],
                                    },
                                    {
                                        tag: 'CONTENT',
                                        children: custom.children(),
                                    },
                                    {
                                        tag: 'FOOT',
                                        children: [{ text: 'b' }],
                                    },
                                ],
                            };
                        } else {
                            domObject = {
                                tag: 'SECTION',
                                children: custom.children(),
                            };
                        }
                        return domObject;
                    }
                }

                const Component: ComponentDefinition = {
                    id: 'test',
                    async render(): Promise<VNode[]> {
                        return [custom];
                    },
                };
                class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Renderer & Layout> = {
                        components: [Component],
                        renderers: [CustomDomObjectRenderer],
                        componentZones: [['test', ['main']]],
                    };
                }
                const editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);

                await editor.start();
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                expect(container.innerHTML).to.equal(
                    '<jw-editor><section><article><br></article></section></jw-editor>',
                    'after start',
                );

                custom.layout = 1;
                mutationNumber = 0;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><head>a</head><content><article><br></article></content><foot>b</foot></div></jw-editor>',
                    'first change',
                );
                expect(mutationNumber).to.equal(3, 'add {div}, move {article}, remove {section}');

                custom.layout = 0;
                mutationNumber = 0;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section><article><br></article></section></jw-editor>',
                    'second change',
                );
                expect(mutationNumber).to.equal(
                    8,
                    'add {section}, move {article}, remove {div, head, a, content, foot, b}',
                );

                custom.layout = 1;
                mutationNumber = 0;
                await engine.redraw([custom]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><head>a</head><content><article><br></article></content><foot>b</foot></div></jw-editor>',
                    'third change',
                );
                expect(mutationNumber).to.equal(
                    3,
                    'second time: add {div}, move {article}, remove {section}',
                );

                await editor.stop();
            });
            describe('style nodes', () => {
                let editor: JWEditor;
                let div: VNode;
                beforeEach(async () => {
                    editor = new JWEditor();
                    editor.load(Html);
                    editor.load(Char);
                    editor.configure(DomLayout, {
                        location: [target, 'replace'],
                        components: [
                            {
                                id: 'aaa',
                                async render(editor: JWEditor): Promise<VNode[]> {
                                    [div] = await editor.plugins
                                        .get(Parser)
                                        .parse('text/html', '<div><p>1</p><p>2</p><p>3</p></div>');
                                    return [div];
                                },
                            },
                        ],
                        componentZones: [['aaa', ['main']]],
                    });
                    await editor.start();
                });
                afterEach(async () => {
                    await editor.stop();
                });
                it('should add a style node', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const text = pDom.firstChild;

                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    div.firstChild().modifiers.prepend(attributes);

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p style="color: red;">1</p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(1, 'add style');
                });
                it('should remove a style node', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const text = pDom.firstChild;

                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    div.firstChild().modifiers.prepend(attributes);
                    await engine.redraw([div.firstChild()]);
                    div.firstChild().modifiers.remove(attributes);

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p>1</p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(2, 'remove style, remove attribute');
                });
                it('should add two style nodes', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const p2 = container.querySelectorAll('p')[2];

                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    div.firstChild().modifiers.prepend(attributes);

                    const attributes2 = new Attributes();
                    attributes2.set('style', 'border: 1px solid black; color: red;');
                    div.lastChild().modifiers.prepend(attributes2);

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild(), div.lastChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(p2).to.equal(container.querySelectorAll('p')[2]);
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p style="color: red;">1</p><p>2</p><p style="border: 1px solid black; color: red;">3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(3, 'add style, add 2 styles');
                });
                it('should update a style node', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const text = pDom.firstChild;
                    const p2 = container.querySelectorAll('p')[2];

                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    div.firstChild().modifiers.prepend(attributes);
                    const attributes2 = new Attributes();
                    attributes2.set('style', 'border: 1px solid black; color: red;');
                    div.lastChild().modifiers.prepend(attributes2);
                    await engine.redraw([div.firstChild(), div.lastChild()]);

                    attributes.set('style', 'color: blue;');

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                    expect(p2).to.equal(container.querySelectorAll('p')[2]);
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p style="color: blue;">1</p><p>2</p><p style="border: 1px solid black; color: red;">3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(1, 'update style');
                });
                it('should update two style nodes', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const p2 = container.querySelectorAll('p')[2];

                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    div.firstChild().modifiers.prepend(attributes);
                    const attributes2 = new Attributes();
                    attributes2.set('style', 'border: 1px solid black; color: red;');
                    div.lastChild().modifiers.prepend(attributes2);
                    await engine.redraw([div.firstChild(), div.lastChild()]);
                    attributes.set('style', 'color: blue;');
                    attributes2.set('style', 'border: 2px solid black; color: blue;');

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild(), div.lastChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(p2).to.equal(container.querySelectorAll('p')[2]);
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p style="color: blue;">1</p><p>2</p><p style="border: 2px solid black; color: blue;">3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(3, 'add style, add 2 styles');
                });
                it('should update a the style but keep custom style from animation', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const p2 = container.querySelectorAll('p')[2];

                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    div.firstChild().modifiers.prepend(attributes);
                    const attributes2 = new Attributes();
                    attributes2.set('style', 'border: 1px solid black; color: red;');
                    div.lastChild().modifiers.prepend(attributes2);
                    await engine.redraw([div.firstChild(), div.lastChild()]);
                    attributes.set('style', 'color: blue;');
                    attributes2.set('style', 'border: 2px solid black; color: blue;');
                    container.querySelector('p').style.background = 'black';
                    container.querySelectorAll('p')[2].style.background = 'black';

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild(), div.lastChild()]);

                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p style="color: blue; background: black;">1</p><p>2</p><p style="border: 2px solid black; color: blue; background: black;">3</p></div></jw-editor>',
                    );
                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(p2 === container.querySelectorAll('p')[2]).to.equal(
                        true,
                        'Use the second <P>',
                    );

                    expect(mutationNumber).to.equal(3, 'add style, add 2 styles');
                });
                it('should update a the style but do not keep style from the previous element', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

                    const p = div.firstChild();

                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    p.modifiers.prepend(attributes);
                    await engine.redraw([p]);
                    attributes.set('style', 'color: blue;');
                    container.querySelector('p').style.background = 'black';

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([p]);

                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p style="color: blue; background: black;">1</p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(1, 'add a style');

                    const p2 = new VElement({ htmlTag: 'P' });

                    const attributes2 = new Attributes();
                    attributes2.set('class', 'aaa');
                    p2.modifiers.prepend(attributes2);
                    removeNodeTemp(p);
                    div.prepend(p2);

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([p2, div, p]);

                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p class="aaa"><br></p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(3, 'remove <p>, add <p>, add style');
                });
            });
            describe('className nodes', () => {
                let editor: JWEditor;
                let div: VNode;
                beforeEach(async () => {
                    editor = new JWEditor();
                    editor.load(Html);
                    editor.load(Char);
                    editor.configure(DomLayout, {
                        location: [target, 'replace'],
                        components: [
                            {
                                id: 'aaa',
                                async render(editor: JWEditor): Promise<VNode[]> {
                                    [div] = await editor.plugins
                                        .get(Parser)
                                        .parse('text/html', '<div><p>1</p><p>2</p><p>3</p></div>');
                                    return [div];
                                },
                            },
                        ],
                        componentZones: [['aaa', ['main']]],
                    });
                    await editor.start();
                });
                afterEach(async () => {
                    await editor.stop();
                });
                it('should add classNames', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const text = pDom.firstChild;

                    const attributes = new Attributes();
                    attributes.set('class', 'a b');
                    div.firstChild().modifiers.prepend(attributes);

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p class="a b">1</p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(2, 'add 2 classNames');
                });
                it('should remove a className', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const text = pDom.firstChild;

                    const attributes = new Attributes();
                    attributes.set('class', 'a b c d');
                    div.firstChild().modifiers.prepend(attributes);
                    await engine.redraw([div.firstChild()]);
                    attributes.set('class', 'd a');

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p class="a d">1</p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(2, 'remove 2 classNames');
                });
                it('should remove all classNames', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const text = pDom.firstChild;

                    const attributes = new Attributes();
                    attributes.set('class', 'a b c d');
                    div.firstChild().modifiers.prepend(attributes);
                    await engine.redraw([div.firstChild()]);
                    div.firstChild().modifiers.remove(attributes);

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p>1</p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(5, 'remove 4 className, remove attribute');
                });
                it('should remove a className but keep className added by animation', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const text = pDom.firstChild;

                    const attributes = new Attributes();
                    attributes.set('class', 'a b c d');
                    div.firstChild().modifiers.prepend(attributes);
                    await engine.redraw([div.firstChild()]);
                    container.querySelector('p').classList.add('animation');
                    attributes.set('class', 'd a');

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p class="a d animation">1</p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(2, 'remove 2 classNames');
                });
                it('should remove all classNames but keep className added by animation', async () => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const pDom = container.querySelector('p');
                    const text = pDom.firstChild;

                    const attributes = new Attributes();
                    attributes.set('class', 'a b c d');
                    div.firstChild().modifiers.prepend(attributes);
                    await engine.redraw([div.firstChild()]);
                    container.querySelector('p').classList.add('animation');
                    div.firstChild().modifiers.remove(attributes);

                    await nextTick();
                    mutationNumber = 0;

                    await engine.redraw([div.firstChild()]);

                    expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                    expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div><p class="animation">1</p><p>2</p><p>3</p></div></jw-editor>',
                    );

                    expect(mutationNumber).to.equal(4, 'remove 4 classNames');
                });
            });
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
            await editor?.stop();
        });
        it('should add a component in a zone', async () => {
            await editor.execBatch(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
            await editor.stop();
        });
        it('should add an existing component in unknown zone (go in default)', async () => {
            await editor.stop();
            editor.load(Html);

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
                componentZones: [['template', ['root']]],
            });
            await editor.start();

            expect(container.innerHTML).to.equal('<div class="a"></div><div class="b"></div>');

            await editor.execBatch(() => {
                return editor.plugins.get(Layout).append('aaa', 'totoZone');
            });

            expect(container.innerHTML).to.equal(
                '<div class="a"></div><div class="b"><div><area></div></div>',
            );

            await editor.stop();
        });
        it('should add a component and show it by default', async () => {
            await editor.execBatch(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
        });
        it('should hide a component', async () => {
            await editor.execBatch(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            await editor.execCommand('hide', { componentId: 'aaa' });
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
        });
        it('should show a component', async () => {
            await editor.execBatch(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            await editor.execCommand('hide', { componentId: 'aaa' });
            await editor.execCommand('show', { componentId: 'aaa' });
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
        });
        it('should remove a component', async () => {
            const layout = editor.plugins.get(Layout);
            await editor.execBatch(async () => {
                await layout.append('aaa', 'main');
                await layout.remove('aaa');
            });
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
        });
        it('should remove a component without memory leak', async () => {
            const layout = editor.plugins.get(Layout);
            const root = layout.engines.dom.root;
            const zoneMain = root.descendants(ZoneNode).find(n => n.managedZones.includes('main'));
            await editor.execBatch(() => {
                return layout.append('aaa', 'main');
            });
            const node = zoneMain.children().slice(-1)[0];
            await editor.execBatch(async () => {
                zoneMain.children().pop();
            });
            expect(!!zoneMain.hidden[node.id]).to.equal(false, 'Component is visible');
            await editor.execCommand('hide', { componentId: 'aaa' });
            expect(zoneMain.hidden[node.id]).to.equal(true, 'Component is hidden');
            await editor.execBatch(() => {
                return layout.remove('aaa');
            });
            expect(zoneMain.hidden[node.id]).to.equal(undefined);
        });
        it('should remove a component in all layout engines', async () => {
            await editor.execBatch(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
            await editor.execBatch(() => {
                return editor.plugins.get(Layout).remove('aaa');
            });
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
        });
    });
    describe('redraw with attach/detach', () => {
        class CustomNode extends ContainerNode {
            sectionAttr = 1;
            divAttr = 1;
        }
        let flag = 0;
        let editor: JWEditor;
        let custom: CustomNode;
        let customChild: CustomNode;
        before(() => {
            class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                static id = DomObjectRenderingEngine.id;
                engine: DomObjectRenderingEngine;
                predicate = CustomNode;
                async render(node: CustomNode): Promise<DomObject> {
                    const onClick = (): void => {
                        flag++;
                    };
                    return {
                        tag: 'SECTION',
                        children: [
                            {
                                tag: 'DIV',
                                children: [
                                    {
                                        text: 'abc',
                                    },
                                ],
                                attributes: {
                                    attr: node.divAttr.toString(),
                                },
                            },
                            ...node.children(),
                        ],
                        attributes: {
                            attr: node.sectionAttr.toString(),
                        },
                        attach: (el: HTMLElement): void => {
                            el.addEventListener('click', onClick);
                        },
                        detach: (el: HTMLElement): void => {
                            el.removeEventListener('click', onClick);
                        },
                    };
                }
            }
            const Component: ComponentDefinition = {
                id: 'test',
                async render(): Promise<VNode[]> {
                    custom = new CustomNode();
                    customChild = new CustomNode();
                    custom.append(customChild);
                    return [custom];
                },
            };
            class Plugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer & Layout> = {
                    components: [Component],
                    renderers: [CustomHtmlObjectRenderer],
                    componentZones: [['test', ['main']]],
                };
            }
            editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
        });
        beforeEach(async () => {
            await editor.start();
        });
        afterEach(async () => {
            await editor.stop();
        });
        it('should have the good rendering', async () => {
            expect(container.querySelector('section').outerHTML).to.equal(
                '<section attr="1"><div attr="1">abc</div>' +
                    '<section attr="1"><div attr="1">abc</div></section>' +
                    '</section>',
            );
            await editor.stop();
            await editor.start();
            expect(container.querySelector('section').outerHTML).to.equal(
                '<section attr="1"><div attr="1">abc</div>' +
                    '<section attr="1"><div attr="1">abc</div></section>' +
                    '</section>',
            );
        });
        it('should add a listener on an element', async () => {
            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should remove listener on close', async () => {
            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);

            await editor.stop();
            await editor.start();

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw without change', async () => {
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

            await engine.redraw([custom]);

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw self attribute', async () => {
            await editor.execBatch(async () => {
                custom.sectionAttr = 2;
            });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw child attribute', async () => {
            await editor.execBatch(async () => {
                custom.divAttr = 2;
            });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw childNode without change', async () => {
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

            await engine.redraw([customChild]);

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw childNode self attribute', async () => {
            await editor.execBatch(async () => {
                customChild.sectionAttr = 2;
            });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw childNode child attribute', async () => {
            await editor.execBatch(async () => {
                customChild.divAttr = 2;
            });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw when remove child', async () => {
            await editor.execBatch(async () => {
                removeNodeTemp(customChild);
            });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);
        });
        it('should keep (detach & attach) listener when redraw when add child', async () => {
            await editor.execBatch(async () => {
                const child = new CustomNode();
                child.sectionAttr = 2;
                custom.append(child);
            });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);

            flag = 0;
            await click(container.querySelector('section section:last-child'));
            expect(flag).to.equal(2);
        });
    });
});
