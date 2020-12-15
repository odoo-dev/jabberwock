import { expect } from 'chai';
import { JWEditor, Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DomLayout } from '../src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';
import { Char } from '../../plugin-char/src/Char';
import { TagNode } from '../../core/src/VNodes/TagNode';
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
import { triggerEvent, setDomSelection } from '../../plugin-dom-editable/test/eventNormalizerUtils';
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
import { parseElement, parseEditable } from '../../utils/src/configuration';
import { Html } from '../../plugin-html/src/Html';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';
import { ChangesLocations } from '../../core/src/Memory/Memory';
import { ItalicFormat } from '../../plugin-italic/src/ItalicFormat';
import { DividerNode } from '../../plugin-divider/src/DividerNode';
import { ImageNode } from '../../plugin-image/src/ImageNode';
import { ParagraphNode } from '../../plugin-paragraph/src/ParagraphNode';
import { FontAwesomeNode } from '../../plugin-fontawesome/src/FontAwesomeNode';
import { VersionableArray } from '../../core/src/Memory/VersionableArray';
import { FontAwesome } from '../../plugin-fontawesome/src/FontAwesome';
import { Divider } from '../../plugin-divider/src/Divider';
import { Heading } from '../../plugin-heading/src/Heading';

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
            expect(hasError).to.equal(true);
            hasError = false;
            await editor.stop().catch(error => {
                hasError = true;
                expect(error.message).to.include('default');
            });
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
            expect(hasError).to.equal(true);
            hasError = false;
            await editor.stop().catch(error => {
                hasError = true;
                expect(error.message).to.include('default');
            });
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
            const a = new TagNode({ htmlTag: 'a-a' });
            a.append(new TagNode({ htmlTag: 'p' }));
            a.append(new ZoneNode({ managedZones: ['main'] }));
            a.append(new ZoneNode({ managedZones: ['default'] }));

            const b = new TagNode({ htmlTag: 'b-b' });
            b.append(new TagNode({ htmlTag: 'p' }));

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
            expect(editor.selection.anchor.nextSibling()).to.equal(charNodes[1]);
            expect(editor.selection.focus.nextSibling()).to.equal(charNodes[2]);
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
                    const element = new TagNode({ htmlTag: 'jw-test' });
                    element.append(new TagNode({ htmlTag: 'p' }));
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
                    const element = new TagNode({ htmlTag: 'jw-test' });
                    element.append(new TagNode({ htmlTag: 'p' }));
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
            const element = new TagNode({ htmlTag: 'jw-test' });
            const pNode = new TagNode({ htmlTag: 'p' });
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
    describe('getDomNodes', () => {
        it('unknown vNode should return an empty list', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            await editor.start();
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            expect(engine.getDomNodes(new TagNode({ htmlTag: 'p' }))).to.deep.equal([]);
            await editor.stop();
        });
        it('node inside the layout should return the DOM nodes', async () => {
            const element = new TagNode({ htmlTag: 'jw-test' });
            const pNode = new TagNode({ htmlTag: 'p' });
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
        it('should return the icon DOM nodes', async () => {
            const element = new TagNode({ htmlTag: 'jw-test' });
            const pNode = new TagNode({ htmlTag: 'p' });
            element.append(pNode);
            const fa = new FontAwesomeNode({
                htmlTag: 'I',
                faClasses: new VersionableArray('fa', 'fa-clock'),
            });
            pNode.append(fa);
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
            editor.load(FontAwesome);
            editor.configure(DomLayout, { location: [target, 'replace'] });
            editor.load(Plugin);
            await editor.start();

            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
            const domFa = container.querySelector('i');
            expect(engine.getDomNodes(fa)).to.deep.equal([domFa]);
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
        describe('basic', () => {
            it('should not render the selection if the range is not in the root element of the vDocument', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div><div><div>a[]</div></div><p>b</p></div>',
                    stepFunction: async editor => {
                        const layout = editor.plugins.get(Layout);
                        const domLayout = layout.engines.dom as DomLayoutEngine;
                        await editor.execCommand(() => {
                            domLayout.components.editable[0]
                                .children()[0]
                                .children()[0]
                                .remove();
                            document.getSelection().removeAllRanges();
                        });
                    },
                    contentAfter: '<div><p>b</p></div>',
                });
            });
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
                domLayoutEngine.redraw({ add: [], move: [], remove: [], update: [] });
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

                await editor.execCommand(() => {
                    editor.selection.set({
                        anchorNode: abc[1],
                        anchorPosition: RelativePosition.BEFORE,
                        focusNode: def[2],
                        direction: Direction.FORWARD,
                        focusPosition: RelativePosition.BEFORE,
                    });
                });

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

                await editor.execCommand(() => {
                    editor.selection.set({
                        anchorNode: img,
                        anchorPosition: RelativePosition.BEFORE,
                        focusNode: abc[2],
                        direction: Direction.FORWARD,
                        focusPosition: RelativePosition.BEFORE,
                    });
                });

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
                await editor.execCommand(() => {
                    editor.selection.set({
                        anchorNode: def[1],
                        anchorPosition: RelativePosition.AFTER,
                        focusNode: abc[1],
                        direction: Direction.BACKWARD,
                        focusPosition: RelativePosition.BEFORE,
                    });
                });
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
                await editor.execCommand(() => {
                    div.remove();
                });

                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');

                await editor.execCommand(() => {
                    editor.selection.set({
                        anchorNode: div.descendants(CharNode)[0],
                        anchorPosition: RelativePosition.AFTER,
                        focusNode: div.descendants(CharNode)[0],
                        direction: Direction.BACKWARD,
                        focusPosition: RelativePosition.AFTER,
                    });
                });

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

                const element = new TagNode({ htmlTag: 'div' });
                const p = new TagNode({ htmlTag: 'p' });

                await editor.execCommand(() => {
                    element.append(p);
                    editor.selection.set({
                        anchorNode: p,
                        anchorPosition: RelativePosition.INSIDE,
                        focusNode: p,
                        direction: Direction.BACKWARD,
                        focusPosition: RelativePosition.INSIDE,
                    });
                });

                const domSelection = target.ownerDocument.getSelection();
                expect(domSelection.anchorNode).to.equal(null);

                await editor.stop();
            });
            it('should render a selection at start of an inline adjacent to a block', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div><p>abc</p>[]def</div>',
                    contentAfter: '<div><p>abc</p>[]def</div>',
                });
            });
        });
        describe('when handle user events', () => {
            it('should insert char (ubuntu chrome)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>hell[]</p>',
                    stepFunction: async (editor: JWEditor) => {
                        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                        const editable = domEngine.components.editable[0];
                        const domEditable = domEngine.getDomNodes(editable)[0] as Element;

                        const text = domEditable.firstChild.firstChild;
                        triggerEvent(domEditable, 'keydown', { key: 'o', code: 'KeyO' });
                        triggerEvent(domEditable, 'keypress', { key: 'o', code: 'KeyO' });
                        triggerEvent(domEditable, 'beforeinput', {
                            data: 'o',
                            inputType: 'insertText',
                        });
                        text.textContent = 'hello';
                        triggerEvent(domEditable, 'input', { data: 'o', inputType: 'insertText' });
                        setDomSelection(text, 5, text, 5);

                        await nextTick();
                        await nextTick();
                    },
                    contentAfter: '<p>hello[]</p>',
                });
            });
            it('should insert multiples key in same stack (oi<backspace>) (ubuntu chrome)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>hell[]</p>',
                    stepFunction: async (editor: JWEditor) => {
                        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                        const editable = domEngine.components.editable[0];
                        const domEditable = domEngine.getDomNodes(editable)[0] as Element;

                        const text = domEditable.firstChild.firstChild;
                        triggerEvent(domEditable, 'keydown', { key: 'o', code: 'KeyO' });
                        triggerEvent(domEditable, 'keypress', { key: 'o', code: 'KeyO' });
                        triggerEvent(domEditable, 'beforeinput', {
                            data: 'o',
                            inputType: 'insertText',
                        });
                        text.textContent = 'hello';
                        triggerEvent(domEditable, 'input', { data: 'o', inputType: 'insertText' });
                        setDomSelection(text, 5, text, 5);
                        triggerEvent(domEditable, 'keydown', { key: 'i', code: 'KeyI' });
                        triggerEvent(domEditable, 'keypress', { key: 'i', code: 'KeyI' });
                        triggerEvent(domEditable, 'beforeinput', {
                            data: 'i',
                            inputType: 'insertText',
                        });
                        text.textContent = 'helloi';
                        triggerEvent(domEditable, 'input', { data: 'i', inputType: 'insertText' });
                        setDomSelection(text, 6, text, 6);
                        triggerEvent(domEditable, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                        });
                        triggerEvent(domEditable, 'keypress', {
                            key: 'Backspace',
                            code: 'Backspace',
                        });
                        triggerEvent(domEditable, 'beforeinput', {
                            inputType: 'deleteContentBackward',
                        });
                        text.textContent = 'hello';
                        triggerEvent(domEditable, 'input', { inputType: 'deleteContentBackward' });
                        setDomSelection(text, 5, text, 5);

                        await nextTick();
                        await nextTick();
                    },
                    contentAfter: '<p>hello[]</p>',
                });
            });
        });
        describe('complex location', () => {
            it('should redraw a selection in a custom fragment with children which have same rendering (1)', async () => {
                class CustomNode extends AtomicNode {}
                const custom = new CustomNode();
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(
                        node: CustomNode,
                        worker: RenderingEngineWorker<DomObject>,
                    ): Promise<DomObject> {
                        const domObject: DomObjectFragment = {
                            children: [
                                {
                                    text: 'a',
                                },
                                {
                                    tag: 'SPAN',
                                },
                                {
                                    text: 'b',
                                },
                            ],
                        };
                        worker.locate([node], domObject.children[0] as DomObjectText);
                        worker.locate([node], domObject.children[1] as DomObjectElement);
                        worker.locate([node], domObject.children[2] as DomObjectText);
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

                document.getSelection().removeAllRanges();

                await editor.execCommand(() => {
                    custom.before(new CharNode({ char: 'X' }));
                    custom.after(new CharNode({ char: 'Y' }));
                    editor.selection.set({
                        anchorNode: custom,
                        anchorPosition: RelativePosition.BEFORE,
                        focusNode: custom,
                        direction: Direction.BACKWARD,
                        focusPosition: RelativePosition.BEFORE,
                    });
                });

                const domEditor = container.getElementsByTagName('jw-editor')[0];

                let childNodes = [...domEditor.childNodes] as Node[];
                let domSelection = target.ownerDocument.getSelection();

                expect(childNodes.indexOf(domSelection.anchorNode)).to.deep.equal(0);
                expect(domSelection.anchorOffset).to.deep.equal(1);

                // redraw without real changes
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });

                childNodes = [...domEditor.childNodes] as Node[];
                domSelection = target.ownerDocument.getSelection();
                expect(childNodes.indexOf(domSelection.anchorNode)).to.deep.equal(
                    0,
                    'after redraw',
                );
                expect(domSelection.anchorOffset).to.deep.equal(1, 'after redraw');

                await editor.stop();
            });
            it('should redraw a selection in a custom fragment with children which have same rendering (2)', async () => {
                class CustomNode extends AtomicNode {}
                const custom = new CustomNode();
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(
                        node: CustomNode,
                        worker: RenderingEngineWorker<DomObject>,
                    ): Promise<DomObject> {
                        const domObject: DomObjectFragment = {
                            children: [
                                {
                                    text: 'a',
                                },
                                {
                                    tag: 'SPAN',
                                },
                                {
                                    text: 'b',
                                },
                            ],
                        };
                        worker.locate([node], domObject.children[0] as DomObjectText);
                        worker.locate([node], domObject.children[1] as DomObjectElement);
                        worker.locate([node], domObject.children[2] as DomObjectText);
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

                document.getSelection().removeAllRanges();

                await editor.execCommand(() => {
                    custom.before(new CharNode({ char: 'X' }));
                    custom.after(new CharNode({ char: 'Y' }));
                    editor.selection.set({
                        anchorNode: custom,
                        anchorPosition: RelativePosition.AFTER,
                        focusNode: custom,
                        direction: Direction.BACKWARD,
                        focusPosition: RelativePosition.AFTER,
                    });
                });

                const domEditor = container.getElementsByTagName('jw-editor')[0];

                let childNodes = [...domEditor.childNodes] as Node[];
                let domSelection = target.ownerDocument.getSelection();

                expect(childNodes.indexOf(domSelection.anchorNode)).to.deep.equal(3);
                expect(domSelection.anchorOffset).to.deep.equal(1);

                // redraw without real changes
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });

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
                    const editable = domEngine.components.editable[0];

                    const renderer = editor.plugins.get(Renderer);
                    const rendered = await renderer.render<DomObject>('object/html', editable);
                    const textNodes = editable.children();

                    expect(rendered && 'children' in rendered && rendered.children).to.deep.equal(
                        textNodes,
                    );

                    const renderedText = await renderer.render<DomObject>(
                        'object/html',
                        textNodes[1],
                    );
                    expect(renderedText).to.deep.equal({ text: 'b' });
                },
                contentAfter: 'a[b]c',
            });
        });
        it('should render text with format', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'a[<i>b]</i>c',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.editable[0];

                    const renderer = editor.plugins.get(Renderer);
                    const rendered = await renderer.render<DomObject>('object/html', editable);
                    const textNodes = editable.children();

                    expect(
                        rendered &&
                            'children' in rendered &&
                            rendered.children.map(n => 'id' in n && n.id),
                    ).to.deep.equal(textNodes.map(n => n.id));

                    const renderedText0 = await renderer.render('object/html', textNodes[0]);
                    expect(renderedText0).to.deep.equal({ text: 'a' });

                    const renderedText1 = await renderer.render('object/html', textNodes[1]);
                    expect(renderedText1).to.deep.equal({
                        tag: 'I',
                        children: [{ text: 'b' }],
                    });
                    const renderedText2 = await renderer.render('object/html', textNodes[2]);
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
                    const editable = domEngine.components.editable[0];
                    const renderer = editor.plugins.get(Renderer);
                    const br = editable.children()[2];
                    await editor.execCommand(async context => {
                        new BoldFormat().applyTo(br);
                        await context.execCommand<Inline>('toggleFormat', {
                            FormatClass: BoldFormat,
                        });
                    });
                    expect(await renderer.render('object/html', br)).to.deep.equal({
                        tag: 'B',
                        children: [{ tag: 'BR' }],
                    });
                },
                contentAfter: 'a[<b>b<br>c]</b>d',
            });
        });
        it('should not render a changed node already removed', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<section><p>abc[]d</p></section>',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.editable[0];
                    const section = editable.firstChild();

                    let nbError = 0;
                    const logError = console.error;
                    console.error = (...args): void => {
                        nbError++;
                        logError.call(console, ...args);
                    };

                    await editor.execCommand(() => {
                        section.empty();
                    });
                    await editor.execCommand(() => {
                        editor.selection.set({
                            anchorNode: section,
                            anchorPosition: RelativePosition.INSIDE,
                            focusNode: section,
                            direction: Direction.FORWARD,
                            focusPosition: RelativePosition.INSIDE,
                        });
                    });

                    expect(nbError).to.be.equal(0, 'No error found');
                    console.error = logError;
                },
                contentAfter: '<section>[]<br></section>',
            });
        });
        it('should not render a changed node already removed (2)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<section><div><p>abc[]d</p></div></section>',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.editable[0];
                    const section = editable.firstChild();

                    let nbError = 0;
                    const logError = console.error;
                    console.error = (...args): void => {
                        nbError++;
                        logError.call(console, ...args);
                    };

                    await editor.execCommand(() => {
                        section.empty();
                    });
                    await editor.execCommand(() => {
                        editor.selection.set({
                            anchorNode: section,
                            anchorPosition: RelativePosition.INSIDE,
                            focusNode: section,
                            direction: Direction.FORWARD,
                            focusPosition: RelativePosition.INSIDE,
                        });
                    });

                    expect(nbError).to.be.equal(0, 'No error found');
                    console.error = logError;
                },
                contentAfter: '<section>[]<br></section>',
            });
        });
        it('should not render a changed node already removed (3)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<section><div><p>abc[]d</p></div></section>',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.editable[0];
                    const section = editable.firstChild();
                    const leaf = section.firstLeaf();

                    let nbError = 0;
                    const logError = console.error;
                    console.error = (...args): void => {
                        nbError++;
                        logError.call(console, ...args);
                    };

                    await editor.execCommand(() => {
                        section.empty();
                    });
                    await editor.execCommand(() => {
                        leaf['data-yop'] = 'o';
                    });

                    expect(nbError).to.be.equal(0, 'No error found');
                    console.error = logError;
                },
                contentAfter: '<section><br></section>',
            });
        });
        it('should not render a changed node already removed (4)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<section><div><p>abc[]d</p></div></section>',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.editable[0];
                    const section = editable.firstChild();
                    const div = section.firstChild();

                    let nbError = 0;
                    const logError = console.error;
                    console.error = (...args): void => {
                        nbError++;
                        logError.call(console, ...args);
                    };

                    await editor.execCommand(() => {
                        section.empty();
                    });
                    await editor.execCommand(() => {
                        div.append(div.firstChild().firstChild());
                    });

                    expect(nbError).to.be.equal(0, 'No error found');
                    console.error = logError;
                },
                contentAfter: '<section><br></section>',
            });
        });
        it('should use the selection remove an ancestor of the selection', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<div><p>abcdef</p></div>',
                stepFunction: async (editor: JWEditor) => {
                    let nbError = 0;
                    const logError = console.error;
                    console.error = (...args): void => {
                        nbError++;
                        logError.call(console, ...args);
                    };

                    const engine = editor.plugins.get(Layout).engines.dom;
                    const div = engine.components.editable[0].firstChild();
                    let newDiv: DividerNode;
                    await editor.execCommand(() => {
                        newDiv = new DividerNode();
                        div.after(newDiv);
                        const d = new DividerNode();
                        newDiv.append(d);
                        const newImage = new ImageNode();
                        d.append(newImage);
                        const newP = new ParagraphNode();
                        d.append(newP);
                        newP.append(new CharNode({ char: '1' }));
                        newP.append(new CharNode({ char: '2' }));
                        newP.append(new CharNode({ char: '3' }));
                    });
                    await editor.execCommand('setSelection', {
                        vSelection: {
                            anchorNode: newDiv.firstLeaf(),
                            anchorPosition: RelativePosition.BEFORE,
                            focusNode: newDiv.firstLeaf(),
                            focusPosition: RelativePosition.AFTER,
                            direction: Direction.FORWARD,
                        },
                    });
                    await editor.execCommand(() => newDiv.remove());

                    await editor.execCommand(async context => {
                        newDiv.firstChild().editable = true;
                        await context.execCommand('setSelection', {
                            vSelection: {
                                anchorNode: div.firstLeaf(),
                                anchorPosition: RelativePosition.BEFORE,
                                focusNode: div.firstLeaf(),
                                focusPosition: RelativePosition.AFTER,
                                direction: Direction.FORWARD,
                            },
                        });
                    });

                    console.error = logError;
                    expect(nbError).to.be.equal(0, 'No error found');
                },
                contentAfter: '<div><p>[a]bcdef</p></div>',
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
        describe('features and layout container', () => {
            it('should redraw with a new item, with node before the editor', async () => {
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
                const area = new TagNode({ htmlTag: 'area' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    b.after(area);
                    expect(container.innerHTML).to.equal(
                        '<section></section><jw-editor><p>abc</p><p>def</p></jw-editor>',
                    );
                });
                expect(container.innerHTML).to.equal(
                    '<section></section><jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'update text, add <area>, add text');

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
                const area = new TagNode({ htmlTag: 'area' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    div.after(area);
                    expect(container.innerHTML).to.equal(
                        '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div>',
                    );
                });

                expect(container.innerHTML).to.equal(
                    '<div class="a"><br></div><p>abc</p><p>def</p><div class="b"></div><area>',
                );

                expect(mutationNumber).to.equal(1, 'add <area>');

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
                const changes: ChangesLocations = {
                    add: [],
                    move: [],
                    remove: [],
                    update: engine.root.descendants().map(node => [node, ['id']]),
                };
                await engine.redraw(changes).catch(e => {
                    expect(e.message).to.include('Impossible');
                    hasFail = true;
                });

                expect(hasFail).to.equal(true);

                expect(mutationNumber).to.equal(1, 'remove <div>');

                await editor.stop();
            });
        });
        describe('altered DOM', () => {
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
                const changes: ChangesLocations = {
                    add: [],
                    move: [],
                    remove: [],
                    update: engine.root.descendants().map(node => [node, ['id']]),
                };
                await engine.redraw(changes).catch(e => {
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
                const area = new TagNode({ htmlTag: 'area' });

                target.remove();
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    b.after(area);
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><p>abc</p><p>def</p></jw-editor>',
                    );
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
                );

                expect(mutationNumber).to.equal(
                    3,
                    'update text, add <area>, add text, do not need to update the parent',
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
                const area = new TagNode({ htmlTag: 'area' });

                divDom.remove();
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.after(area);
                    expect(container.innerHTML).to.equal(
                        '<div class="a"><br></div><p>abc</p><p>def</p>',
                    );
                });

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
                const area = new TagNode({ htmlTag: 'area' });

                divDom.remove();
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.after(area);
                    expect(container.innerHTML).to.equal(
                        '<p>abc</p><p>def</p><div class="b"></div>',
                    );
                });

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
                const changes: ChangesLocations = {
                    add: [],
                    move: [],
                    remove: [],
                    update: engine.root.descendants().map(node => [node, ['id']]),
                };
                await engine.redraw(changes).catch(e => {
                    expect(e.message).to.include('Impossible');
                    hasFail = true;
                });

                expect(hasFail).to.equal(true);

                expect(mutationNumber).to.equal(0, 'no update');

                await editor.stop();
            });
            it('should update text with an altered DOM', async () => {
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

                const pDom = container.querySelector('p');
                const text = pDom.firstChild as Text;
                text.textContent = '';
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const [p] = engine.getNodes(pDom);
                    p.children()[1].remove(); // b
                });

                expect(container.innerHTML).to.equal('<jw-editor><p>ac</p><p>def</p></jw-editor>');
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect([...pDom.childNodes]).to.deep.equal([text], 'Use the same text');

                expect(mutationNumber).to.equal(1, '"" => ac');

                await editor.stop();
            });
            it('should update container with new childVNode and an altered DOM from animation', async () => {
                const Component: ComponentDefinition = {
                    id: 'test',
                    render(editor: JWEditor): Promise<VNode[]> {
                        return editor.plugins
                            .get(Parser)
                            .parse(
                                'text/html',
                                '<div class="o_snippet">' +
                                    '<h1>title</h1>' +
                                    '<section>content</section>' +
                                    '</div>',
                            );
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
                editor.load(Divider);
                editor.load(Heading);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
                await editor.start();

                // An animation (element added for the laayout but not in our VDoc) altere the dom.
                const snippetDom = container.querySelector('.o_snippet');
                const divDom = document.createElement('div');
                divDom.classList.add('animation');
                divDom.innerHTML = 'a';
                snippetDom.prepend(divDom);
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const [snippet] = engine.getNodes(snippetDom);
                    const div = new DividerNode();
                    div.modifiers.get(Attributes).classList.add('new_div');
                    div.append(new CharNode({ char: 'b' }));
                    snippet.firstChild().after(div);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor>' +
                        '<div class="o_snippet">' +
                        '<div class="animation">a</div>' +
                        '<h1>title</h1>' +
                        '<div class="new_div">b</div>' +
                        '<section>content</section>' +
                        '</div>' +
                        '</jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'insert div');

                await editor.stop();
            });
        });
        describe('BasicEditor', () => {
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
                        const editable = domEngine.components.editable[0];

                        const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                        expect(domEditable.innerHTML).to.equal('a<b><i>b</i></b>c');

                        const renderer = editor.plugins.get(Renderer);
                        const rendered = await renderer.render<DomObject>('object/html', editable);
                        const textNodes = editable.children();

                        expect(
                            rendered && 'children' in rendered && rendered.children,
                        ).to.deep.equal(textNodes);

                        expect(mutationNumber).to.equal(5, 'add <b>, move <i>, 3 toolbar update');

                        const renderedText1 = await renderer.render('object/html', textNodes[1]);
                        expect(renderedText1).to.deep.equal({
                            tag: 'B',
                            children: [
                                {
                                    tag: 'I',
                                    children: [{ text: 'b' }],
                                },
                            ],
                        });
                    },
                    contentAfter: 'a[<b><i>b]</i></b>c',
                });
            });
            it('should remove the first char in an execBatch', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>ab[]</div>',
                    stepFunction: async editor => {
                        mutationNumber = 0;
                        await editor.execCommand(async () => {
                            const layout = editor.plugins.get(Layout);
                            const domEngine = layout.engines.dom;
                            domEngine.components.editable[0].firstLeaf().remove();
                        });
                        expect(document.querySelector('jw-test').innerHTML).to.equal(
                            '<div>b</div>',
                        );
                        expect(mutationNumber).to.equal(
                            2,
                            'update text, update toolbar history button',
                        );
                    },
                    contentAfter: '<div>b[]</div>',
                });
            });
            it('should use command delete to merge a paragraph into an empty paragraph', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[]<br></p><p>abc</p>',
                    stepFunction: async editor => {
                        mutationNumber = 0;
                        await editor.execCommand('deleteForward');
                        expect(document.querySelector('jw-test').innerHTML).to.equal('<p>abc</p>');
                        expect(mutationNumber).to.equal(
                            4,
                            'remove <p>, remove <br>, update toolbar history button',
                        );
                    },
                    contentAfter: '<p>[]abc</p>',
                });
            });
            it('should set, then unset the background color of two characters', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]d</p>',
                    stepFunction: async editor => {
                        mutationNumber = 0;
                        await editor.execCommand('colorBackground', { color: 'red' });
                        expect(document.querySelector('jw-test').innerHTML).to.equal(
                            '<p>a<span style="background-color: red;">bc</span>d</p>',
                        );
                        expect(mutationNumber).to.equal(
                            7,
                            'update text, add <span>, add text, add text, 2 update toolbar',
                        );
                        mutationNumber = 0;
                        await editor.execCommand('uncolorBackground');
                        expect(document.querySelector('jw-test').innerHTML).to.equal('<p>abcd</p>');
                        expect(mutationNumber).to.equal(
                            4,
                            'remove <span>, add text, update toolbar',
                        );
                    },
                    contentAfter: '<p>a[bc]d</p>',
                });
            });
            it('should remove some attributes on the selected text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<p style="background-color: red;">[a<span style="background-color: white;">b</span>c<span style="color: green; background-color: yellow;">d</span>e]</p>',
                    stepFunction: async editor => {
                        await nextTick();
                        mutationNumber = 0;
                        await editor.execCommand('uncolorBackground');
                        expect(document.querySelector('jw-test').innerHTML).to.equal(
                            '<p style="background-color: red;">a<span>b</span>c<span style="color: green;">d</span>e</p>',
                        );
                        expect(mutationNumber).to.equal(
                            5,
                            'remove 2 formats + remove 1 empty styles, update toolbar',
                        );
                    },
                    contentAfter:
                        '<p style="background-color: red;">[a<span>b</span>c<span style="color: green;">d</span>e]</p>',
                });
            });
            it('should render linebreak with format', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a[b<br>c]d',
                    stepFunction: async (editor: JWEditor) => {
                        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                        const editable = domEngine.components.editable[0];

                        mutationNumber = 0;

                        const renderer = editor.plugins.get(Renderer);
                        const br = editable.children()[2];

                        await editor.execCommand(() => {
                            new BoldFormat().applyTo(br);
                        });

                        expect(await renderer.render('object/html', br)).to.deep.equal({
                            tag: 'B',
                            children: [{ tag: 'BR' }],
                        });
                        expect(mutationNumber).to.equal(
                            3,
                            'add b, move br, update toolbar history button',
                        );
                    },
                    contentAfter: 'a[b<b><br></b>c]d',
                });
            });
            it('should render linebreak with format then the siblings char', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a[b<br>c]d',
                    stepFunction: async (editor: JWEditor) => {
                        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                        const editable = domEngine.components.editable[0];

                        const renderer = editor.plugins.get(Renderer);
                        const br = editable.children()[2];

                        mutationNumber = 0;

                        await editor.execCommand(() => {
                            new BoldFormat().applyTo(br);
                        });

                        const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                        expect(domEditable.innerHTML).to.equal('ab<b><br></b>cd');
                        expect(await renderer.render('object/html', br)).to.deep.equal({
                            tag: 'B',
                            children: [{ tag: 'BR' }],
                        });
                        expect(mutationNumber).to.equal(
                            3,
                            'remove br, add b, update toolbar history button',
                        );

                        mutationNumber = 0;

                        await editor.execCommand<Inline>('toggleFormat', {
                            FormatClass: BoldFormat,
                        });

                        expect(domEditable.innerHTML).to.equal('a<b>b<br>c</b>d');
                        expect(await renderer.render('object/html', br)).to.deep.equal({
                            tag: 'B',
                            children: [{ tag: 'BR' }],
                        });
                        expect(mutationNumber).to.equal(
                            10,
                            'change text, add b, create text, add text, remove br, create text, add text, change text, 2 toolbar changes',
                        );
                    },
                    contentAfter: 'a[<b>b<br>c]</b>d',
                });
            });
            it('should render text and linebreak with format', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a[b<br>c]d',
                    stepFunction: async (editor: JWEditor) => {
                        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                        const editable = domEngine.components.editable[0];

                        const renderer = editor.plugins.get(Renderer);
                        const br = editable.children()[2];

                        await editor.execCommand(async context => {
                            new BoldFormat().applyTo(br);

                            mutationNumber = 0;

                            await context.execCommand<Inline>('toggleFormat', {
                                FormatClass: BoldFormat,
                            });
                        });

                        const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                        expect(domEditable.innerHTML).to.equal('a<b>b<br>c</b>d');
                        expect(await renderer.render('object/html', br)).to.deep.equal({
                            tag: 'B',
                            children: [{ tag: 'BR' }],
                        });
                        expect(mutationNumber).to.equal(
                            11,
                            'change text, add b, crete text, add text, move br, create text, add text, change text, 3 toolbar changes',
                        );
                    },
                    contentAfter: 'a[<b>b<br>c]</b>d',
                });
            });
            it('should render a linebreak with format between formatted char', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<b>[b</b><br><b>c]</b>d',
                    stepFunction: async (editor: JWEditor) => {
                        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                        const editable = domEngine.components.editable[0];

                        const br = editable.children()[2];

                        mutationNumber = 0;

                        await editor.execCommand(() => {
                            new BoldFormat().applyTo(br);
                        });

                        const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                        expect(domEditable.innerHTML).to.equal('a<b>b<br>c</b>d');

                        const renderer = editor.plugins.get(Renderer);
                        expect(await renderer.render('object/html', br)).to.deep.equal({
                            tag: 'B',
                            children: [{ tag: 'BR' }],
                        });
                        expect(mutationNumber).to.equal(
                            6,
                            'remove second b, move br, move text, update toolbar history button',
                        );
                    },
                    contentAfter: 'a[<b>b<br>c]</b>d',
                });
            });
            it('should replace a formating text by the copy-past of same text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'aa[a<b>bbb</b>ccc]',
                    stepFunction: async (editor: JWEditor) => {
                        const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                        const editable = domEngine.components.editable[0];
                        const domEditable = domEngine.getDomNodes(editable)[0] as Element;

                        mutationNumber = 0;
                        triggerEvent(domEditable, 'keydown', {
                            key: 'v',
                            code: 'KeyV',
                            ctrlKey: true,
                        });
                        const dataTransfer = new DataTransfer();
                        dataTransfer.setData('text/plain', 'abbbccc');
                        triggerEvent(domEditable, 'paste', { clipboardData: dataTransfer });
                        await nextTick();
                        await nextTick();

                        expect(domEditable.innerHTML).to.equal('aaabbbccc');

                        triggerEvent(domEditable, 'mousedown', {
                            button: 2,
                            detail: 1,
                            clientX: 65,
                            clientY: 30,
                        });
                        const text = domEditable.lastChild as Text;
                        setDomSelection(
                            text,
                            text.textContent.length - 2,
                            text,
                            text.textContent.length - 2,
                        );
                        await nextTick();
                        setDomSelection(
                            text,
                            text.textContent.length - 2,
                            text,
                            text.textContent.length,
                        );
                        await nextTick();
                        triggerEvent(domEditable, 'click', {
                            button: 2,
                            detail: 0,
                            clientX: 80,
                            clientY: 30,
                        });
                        triggerEvent(domEditable, 'mouseup', {
                            button: 2,
                            detail: 0,
                            clientX: 80,
                            clientY: 30,
                        });

                        expect(domEditable.childNodes.length).to.equal(
                            2,
                            'at least keep the first text node',
                        );

                        await nextTick();
                        await nextTick();

                        expect(domEditable.childNodes.length).to.equal(
                            2,
                            'at least keep the first text node',
                        );
                    },
                    contentAfter: 'aaabbbc[cc]',
                });
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
                                const domContainer = document.createElement('div');
                                domContainer.innerHTML = '<div><p>abcdef</p><p>123456</p></div>';
                                [div] = await parseEditable(
                                    editor,
                                    domContainer.firstChild as HTMLElement,
                                );
                                return [div];
                            },
                        },
                    ],
                    componentZones: [['aaa', ['main']]],
                });
                await editor.start();
                mutationNumber = 0;
            });
            afterEach(async () => {
                await editor.stop();
            });
            it('should delete the last characters in a paragraph', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const f = p.children()[5];
                const e = p.children()[4];

                await editor.execCommand(() => {
                    f.remove();
                    e.remove();
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcd</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should delete the last characters in a paragraph (in VNode and Dom)', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                text.textContent = 'abcd';
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p = div.firstChild();
                    const f = p.children()[5];
                    const e = p.children()[4];
                    f.remove();
                    e.remove();
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcd</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(0);
            });
            it('should delete the first characters in a paragraph', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p = div.firstChild();
                    const a = p.children()[0];
                    const b = p.children()[1];
                    a.remove();
                    b.remove();
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>cdef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should delete characters in a paragraph', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p = div.firstChild();
                    const c = p.children()[2];
                    const d = p.children()[3];
                    c.remove();
                    d.remove();
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should delete characters in a paragraph with split in DOM', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild as Text;

                const text2 = text.splitText(3);
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p = div.firstChild();
                    const c = p.children()[2];
                    const d = p.children()[3];
                    c.remove();
                    d.remove();
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abef</p><p>123456</p></div></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same ab');
                expect(pDom.lastChild === text2).to.equal(true, 'Use same ef');

                expect(mutationNumber).to.equal(2, 'abc => ab ; def => ef');
            });
            it('should delete characters in a paragraph with split in DOM and removed Text', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild as Text;

                const text2 = text.splitText(2);
                const text3 = text2.splitText(2);
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p = div.firstChild();
                    const b = p.children()[1];
                    const c = p.children()[2];
                    const d = p.children()[3];
                    b.remove();
                    c.remove();
                    d.remove();
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>aef</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect([...pDom.childNodes]).to.deep.equal([text, text3], 'Use the same texts');

                expect(mutationNumber).to.equal(2, 'ab => a ; remove cd');
            });
            it('should delete characters in a paragraph with split in DOM', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild as Text;

                const text2 = text.splitText(3);
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p = div.firstChild();
                    const c = p.children()[2];
                    const d = p.children()[3];
                    c.remove();
                    d.remove();
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abef</p><p>123456</p></div></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same ab');
                expect(pDom.lastChild === text2).to.equal(true, 'Use same ef');

                expect(mutationNumber).to.equal(2, 'abc => ab ; def => ef');
            });
            it('should replace a character in a paragraph', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p = div.firstChild();
                    const c = p.children()[2];
                    const d = p.children()[3];
                    const x = new CharNode({ char: 'x' });
                    c.after(x);
                    c.remove();
                    d.remove();
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abxef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should delete the last character and replace ce previous in a paragraph', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p = div.firstChild();
                    const f = p.children()[5];
                    const e = p.children()[4];
                    const z = new CharNode({ char: 'z' });
                    e.before(z);
                    f.remove();
                    e.remove();
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcdz</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1);
            });
            it('should replace a character in a paragraph with same chars', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const c = p.children()[2];
                const x = new CharNode({ char: 'x' });
                const x2 = new CharNode({ char: 'x' });
                const x3 = new CharNode({ char: 'x' });

                await editor.execCommand(() => {
                    c.after(x);
                    x.after(x2);
                    x2.after(x3);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcxxxdef</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                mutationNumber = 0;
                await editor.execCommand(() => {
                    x2.remove();
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcxxdef</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P> (2)');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text (2)');
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

                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const add0 = new CharNode({ char: '0' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.children()[4].after(add0);
                });

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

                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const char0 = p.children()[3];

                mutationNumber = 0;
                await editor.execCommand(() => {
                    char0.remove();
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(pDom.outerHTML).to.equal('<p>1.00.0</p>');
                expect(mutationNumber).to.equal(1);
            });
            it('should merge 2 paragraphs which contains simple text', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p1 = div.firstChild();
                const p2 = div.lastChild();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p2.mergeWith(p1);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcdef123456</p></div></jw-editor>',
                );

                await nextTick();

                expect(mutationNumber).to.equal(3, 'abcdef => abcdef123456 ; remove p & text');
            });
            it('should remove paragraphs content', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p1 = div.firstChild();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p1.empty();
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(!!text.parentNode).to.equal(false);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p><br></p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(2, 'add <br>, remove text');
            });
            it('should merge to paragraphs which contains br and text', async () => {
                const pDom = container.querySelector('p');
                const text2 = pDom.nextElementSibling.firstChild;

                const p1 = div.firstChild();

                await editor.execCommand(() => {
                    p1.empty();
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p><br></p><p>123456</p></div></jw-editor>',
                );

                const p2 = div.lastChild();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p2.mergeWith(p1);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text2).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(4, 'add text; remove <br>; remove <p> & text');
            });
            it('should merge two paragraphs with selection', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p1 = div.firstChild();
                const p2 = div.lastChild();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    editor.selection.setAt(p2.firstChild(), RelativePosition.BEFORE);
                    p2.mergeWith(p1);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcdef123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                renderTextualSelection();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcdef[]123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'update text; remove <p> & text');
            });
            it('should add characters at the end of a paragraph', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const g = new CharNode({ char: 'g' });
                const h = new CharNode({ char: 'h' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.append(g, h);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcdefgh</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'update text');
            });
            it('should split a paragraph', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const f = p.children()[5];
                const e = p.children()[4];
                const newP = new TagNode({ htmlTag: 'P' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    newP.append(e, f);
                    p.after(newP);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcd</p><p>ef</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(2, 'update text; add <p> & text');
            });
            it('should split a paragraph with formatted text (firefox)', async () => {
                const divDom = container.querySelector('div');
                const pDom = container.querySelector('p');

                const p = div.firstChild();
                await editor.execCommand(() => {
                    p.children()[1].modifiers.append(new BoldFormat());
                    p.children()[5].modifiers.append(new ItalicFormat());
                });

                expect(divDom.innerHTML).to.equal('<p>a<b>b</b>cde<i>f</i></p>' + '<p>123456</p>');

                await editor.execCommand(async () => {
                    p.splitAt(p.children()[4]);

                    // Update dom in same time (like firefox).

                    const a = pDom.childNodes[0];
                    const b = pDom.childNodes[1];
                    const cde = pDom.childNodes[2] as Text;
                    const e = cde.splitText(2);
                    const newPDom = document.createElement('p');
                    divDom.insertBefore(newPDom, pDom);
                    newPDom.appendChild(a);
                    newPDom.appendChild(b);
                    newPDom.appendChild(cde);

                    const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    domEngine.markForRedraw(new Set([e, cde, newPDom, a, b]));

                    await nextTick();
                    mutationNumber = 0;
                });

                expect(divDom.innerHTML).to.equal(
                    '<p>a<b>b</b>cd</p>' + '<p>e<i>f</i></p>' + '<p>123456</p>',
                );

                expect(mutationNumber).to.equal(6, 'TODO: reduce this to 0 mutations !');
            });
            it('should make bold all chars', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;
                const pDom2 = pDom.nextElementSibling;
                const text2 = pDom2.firstChild;

                const p = div.firstChild();
                const p2 = div.lastChild();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    for (const char of p.children(InlineNode)) {
                        new BoldFormat().applyTo(char);
                    }
                    for (const char of p2.children(InlineNode)) {
                        new BoldFormat().applyTo(char);
                    }
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p><b>abcdef</b></p><p><b>123456</b></p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild.firstChild).to.equal(text);
                expect(pDom2.firstChild.firstChild).to.equal(text2);

                expect(mutationNumber).to.equal(4, 'add bold & text; add bold & text');
            });
            it('should make bold p', async () => {
                const pDom = container.querySelector('p');

                const p = div.firstChild();
                const p2 = div.lastChild();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    new BoldFormat().applyTo(p);
                    new BoldFormat().applyTo(p2);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><b><p>abcdef</p><p>123456</p></b></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');

                expect(mutationNumber).to.equal(3, 'parent bold, move into bold');
            });
            it('should split a paragraph within a format node', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();

                await editor.execCommand(() => {
                    for (const char of p.children(InlineNode)) {
                        new BoldFormat().applyTo(char);
                    }
                });

                const dBold = pDom.firstChild;

                const f = p.children()[5];
                const e = p.children()[4];
                const newP = new TagNode({ htmlTag: 'P' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    newP.append(e, f);
                    p.after(newP);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p><b>abcd</b></p><p><b>ef</b></p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === dBold).to.equal(true, 'Use same bold');
                expect(dBold.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(2, 'update text; add <p> & <b> & text');
            });
            it('should add a linebreak in a paragraph', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const lineBreak = new LineBreakNode();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.children()[2].after(lineBreak);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abc<br>def</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'update text; add <br> & text');
            });
            it('should remove a linebreak in a paragraph', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const p = div.firstChild();
                const lineBreak = new LineBreakNode();

                await editor.execCommand(() => {
                    p.children()[2].after(lineBreak);
                });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    lineBreak.remove();
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><div contenteditable="true"><p>abc<br>def</p><p>123456</p></div></jw-editor>',
                    );
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');

                expect(pDom.childNodes.length).to.equal(2);
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcdef</p><p>123456</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'remove <br>');

                await editor.execCommand(() => {
                    const marker = new MarkerNode();
                    p.children()[3].after(marker);
                    const location = engine._domReconciliationEngine.getLocations(marker);
                    expect(location).to.deep.equal(
                        [pDom.lastChild, 1],
                        'location in the second text node',
                    );
                });
            });
            it('should redraw a br', async () => {
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const pDom = container.querySelector('p');

                const p = div.firstChild();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.empty();
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p><br></p><p>123456</p></div></jw-editor>',
                );

                expect(pDom.childNodes.length).to.equal(1);
                const br = pDom.firstChild;
                expect(br.nodeName).to.equal('BR');

                expect(engine.getNodes(pDom)).to.deep.equal([p], '<p> to VNode');

                expect(mutationNumber).to.equal(2, 'remove text; insert <br>');

                const marker = new MarkerNode();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.prepend(marker);
                });

                let location = engine._domReconciliationEngine.getLocations(marker);
                expect(location).to.deep.equal([pDom, 0], 'location with a new marker');

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p><br></p><p>123456</p></div></jw-editor>',
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

                await editor.execCommand(() => {
                    p.children()[2].after(lineBreak);
                    editor.selection.setAt(d, RelativePosition.AFTER);
                });

                const pDom = container.querySelector('p');
                const text = pDom.firstChild;
                const br = pDom.childNodes[1];
                const text2 = pDom.lastChild;
                text2.textContent = 'ef';
                engine.markForRedraw(new Set([br, text2]));

                mutationNumber = 0;
                const promise = editor.execCommand(() => {
                    d.remove();
                });

                pDom.removeChild(br);

                await promise;

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(pDom.innerHTML).to.equal('abc<br>ef');

                expect(mutationNumber).to.equal(3);
            });
            it('should add style on char', async () => {
                const pDom = container.querySelector('p');

                const p = div.firstChild();
                const children = p.children();
                const bold = new BoldFormat();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    bold.applyTo(children[1]);
                    bold.applyTo(children[2]);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>a<b>bc</b>def</p><p>123456</p></div></jw-editor>',
                );
                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(mutationNumber).to.equal(
                    5,
                    'update text, move text in bold, add text, add bold, add text',
                );
            });
            it('should remove style on char', async () => {
                const pDom = container.querySelector('p');

                const p = div.firstChild();
                const children = p.children();
                const bold = new BoldFormat();

                await editor.execCommand(() => {
                    bold.applyTo(children[1]);
                    bold.applyTo(children[2]);
                });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    children[1].modifiers.remove(bold);
                    children[2].modifiers.remove(bold);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div contenteditable="true"><p>abcdef</p><p>123456</p></div></jw-editor>',
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

                await nextTick();

                // update VNode

                const layout = editor.plugins.get(Layout);
                const domLayout = layout.engines.dom as DomLayoutEngine;
                const section = domLayout.components.test[0];
                const div = section.firstChild();
                const p = div.firstChild();

                const nodesWithChanges = new Set([pDom, textDom, newPDom, newTextDom, divDom]);
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                engine.markForRedraw(nodesWithChanges);

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p2 = p.splitAt(p.childVNodes[2]);
                    // Add an other char to check if the dom are effectively redrawed.
                    p2.append(new CharNode({ char: 'z' }));
                });

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
            it('should split a paragraph and keep the created nodes (2)', async () => {
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

                await nextTick();

                // update VNode

                const layout = editor.plugins.get(Layout);
                const domLayout = layout.engines.dom as DomLayoutEngine;
                const section = domLayout.components.test[0];
                const div = section.firstChild();
                const p = div.firstChild();
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const nodesWithChanges = new Set([pDom, textDom, newPDom, newTextDom, divDom]);
                engine.markForRedraw(nodesWithChanges);

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.splitAt(p.childVNodes[2]);
                });

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
            it('should redraw with a new item', async () => {
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
                const area = new TagNode({ htmlTag: 'area' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    b.after(area);
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><p>abc</p><p>def</p></jw-editor>',
                    );
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><p>ab<area>c</p><p>def</p></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'update text, add <area>, add text');

                await editor.stop();
            });
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
                        const div = new TagNode({ htmlTag: 'DIV' });
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
                const div = domLayout.components.test[0];

                mutationNumber = 0;
                await editor.execCommand(() => {
                    div.prepend(custom);
                    expect(container.innerHTML).to.equal('<jw-editor><div>a</div></jw-editor>');
                });

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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
                expect(container.innerHTML).to.equal('<jw-editor></jw-editor>', '1st empty');
                expect(mutationNumber).to.equal(1, 'remove <div>');
                mutationNumber = 0;
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
                expect(container.innerHTML).to.equal('<jw-editor><div></div></jw-editor>', '2nd');
                expect(mutationNumber).to.equal(1, 'add <div>');
                mutationNumber = 0;
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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
                const area = new TagNode({ htmlTag: 'custom' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    b.after(area);
                    expect(container.innerHTML).to.equal(
                        '<jw-editor><p>abc</p><p>def</p></jw-editor>',
                    );
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><p>ab<custom><br></custom>c</p><p>def</p></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(3, 'update text, add custom, add text');

                await editor.stop();
            });
            it('should redraw a wrapped item', async () => {
                const p = new TagNode({ htmlTag: 'P' });
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

                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const area = new TagNode({ htmlTag: 'custom' });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    p.wrap(area);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><custom><p>a</p></custom></jw-editor>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(2, 'insert custom node, move p into custom');

                await editor.stop();
            });
            it('should redraw a unwrapped item', async () => {
                const p = new TagNode({ htmlTag: 'P' });
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

                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const area = new TagNode({ htmlTag: 'custom' });

                await editor.execCommand(() => {
                    p.wrap(area);
                });

                await editor.execCommand(() => {
                    area.unwrap();
                    mutationNumber = 0;
                });

                expect(container.innerHTML).to.equal('<jw-editor><p>a</p></jw-editor>');

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(3);

                await editor.stop();
            });
            it('should redraw the wrapped layoutContainer children', async () => {
                const p = new TagNode({ htmlTag: 'P' });
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

                const area = new TagNode({ htmlTag: 'custom' });

                await editor.execCommand(() => {
                    engine.root
                        .firstChild()
                        .firstChild()
                        .wrap(area);
                    mutationNumber = 0;
                });

                expect(container.innerHTML).to.equal(
                    '<custom><jw-editor><p>a</p></jw-editor></custom>',
                );

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');

                expect(mutationNumber).to.equal(2, 'insert custom node, move p into custom');

                await editor.stop();
            });
            it('should redraw the unwrapped layoutContainer children', async () => {
                const p = new TagNode({ htmlTag: 'P' });
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

                const area = new TagNode({ htmlTag: 'custom' });
                const layoutContainer = engine.root.firstChild();
                const layoutchild = layoutContainer.firstChild();

                await editor.execCommand(() => {
                    layoutchild.wrap(area);
                });

                await editor.execCommand(() => {
                    area.unwrap();
                    mutationNumber = 0;
                });

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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });

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
                await engine.redraw({
                    add: [],
                    move: [],
                    remove: [],
                    update: [[customChild, ['id']]],
                });

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
                    divAttr2 = '';
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
                                        'empty-str-attr': node.divAttr2.toString(),
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
                await editor.execCommand(() => {
                    custom.sectionAttr = 2;
                });

                expect(container.querySelector('section').outerHTML).to.equal(
                    '<section attr="2"><div attr="1" empty-str-attr="">abc</div>' +
                        '<section attr="1"><div attr="1" empty-str-attr="">abc</div></section>' +
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
                await editor.execCommand(() => {
                    custom.divAttr = 2;
                });

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
                await editor.execCommand(() => {
                    customChild.sectionAttr = 2;
                });

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
                await editor.execCommand(() => {
                    customChild.divAttr = 2;
                });

                expect(container.querySelector('section').outerHTML).to.equal(
                    '<section attr="1"><div attr="1">abc</div>' +
                        '<section attr="1"><div attr="2">abc</div></section>' +
                        '</section>',
                );

                expect(mutationNumber).to.equal(1);

                await editor.stop();
            });
            it('should not have mutation when redraw a custom fragment with children which have same rendering', async () => {
                class CustomNode extends AtomicNode {}
                const custom = new CustomNode();
                class CustomHtmlObjectRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(
                        node: CustomNode,
                        worker: RenderingEngineWorker<DomObject>,
                    ): Promise<DomObject> {
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
                        worker.locate([node], domObject.children[0] as DomObjectText);
                        worker.locate([node], domObject.children[1] as DomObjectElement);
                        worker.locate([node], domObject.children[2] as DomObjectText);
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
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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
                    async render(
                        node: CustomNode,
                        worker: RenderingEngineWorker<DomObject>,
                    ): Promise<DomObject> {
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
                        worker.locate([node], domObject.children[0] as DomObjectText);
                        worker.locate([node], domObject.children[1] as DomObjectElement);
                        worker.locate([node], domObject.children[2] as DomObjectText);
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

                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.before(new CharNode({ char: 'X' }));
                    custom.after(new CharNode({ char: 'Y' }));
                });
                expect(mutationNumber).to.equal(2, 'add 2 text');

                // redraw without changes
                mutationNumber = 0;
                const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });
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

                mutationNumber = 0;
                await editor.execCommand(() => {
                    a.after(new CharNode({ char: 'a' }));
                    a.remove();
                });

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

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const a2 = new CharNode({ char: 'a' });
                    a.after(a2);
                    a.remove();
                });

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

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><span>a</span></div></jw-editor>',
                );

                mutationNumber = 0;
                await editor.execCommand(() => {
                    a.after(new CharNode({ char: 'a' }));
                    a.remove();
                });

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
                const article = new TagNode({ htmlTag: 'ARTICLE' });
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

                expect(container.innerHTML).to.equal(
                    '<jw-editor><section><article><br></article></section></jw-editor>',
                    'after start',
                );

                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.layout = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><head>a</head><content><article><br></article></content><foot>b</foot></div></jw-editor>',
                    'first change',
                );
                expect(mutationNumber).to.equal(3, 'add {div}, move {article}, remove {section}');

                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.layout = 0;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section><article><br></article></section></jw-editor>',
                    'second change',
                );
                expect(mutationNumber).to.equal(
                    8,
                    'add {section}, move {article}, remove {div, head, content, foot, a, b}',
                );

                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.layout = 1;
                });
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
        });
        describe('node rewritten by another node', () => {
            enum CustomeType {
                'normal' = 'default',
                'useObject' = 'useObject',
                'changeTag' = 'changeTag',
                'changeTagAndUseObject' = 'changeTagAndUseObject',
                'useAttributes' = 'useAttributes',
                'useAttributesAndUseObject' = 'useAttributesAndUseObject',
            }
            class CustomNode extends ContainerNode {
                parentValue = 0;
            }
            class CustomChild extends AtomicNode {
                value = 0;
                constructor(public type: CustomeType) {
                    super();
                }
            }
            let custom: CustomNode;
            let editor: JWEditor;
            beforeEach(() => {
                custom = new CustomNode();
                class CustomRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomNode;
                    async render(
                        custom: CustomNode,
                        worker: RenderingEngineWorker<DomObject>,
                    ): Promise<DomObject> {
                        const parent = {
                            tag: 'PARENT',
                            children: [],
                        };
                        const children = custom.children() as CustomChild[];
                        const domObjects = (await worker.render(children)) as DomObjectElement[];
                        for (const index in children) {
                            const child = children[index];
                            const childObject = domObjects[index];
                            const sub: DomObjectElement = {
                                tag: 'WRAP',
                                children: [],
                            };
                            worker.depends(custom, sub);
                            worker.depends(sub, custom);

                            parent.children.push(sub);
                            switch (child.type) {
                                case 'useObject':
                                    sub.children.push(childObject);
                                    // Child is an origin of this parent because the rendering depend of the content.
                                    worker.depends(child, sub);
                                    worker.depends(sub, child);
                                    break;
                                case 'changeTag':
                                    childObject.tag = 'CHILD-BIS';
                                    sub.children.push(child);
                                    // Custom is an origin beacuse this rendering change the tag.
                                    worker.depends(custom, childObject);
                                    worker.depends(childObject, custom);
                                    break;
                                case 'changeTagAndUseObject':
                                    childObject.tag = 'CHILD-BIS';
                                    sub.children.push(childObject);
                                    // Child is an origin of this parent because the rendering depend of the content.
                                    worker.depends(child, sub);
                                    worker.depends(sub, child);
                                    // Custom is an origin beacuse this rendering change the tag.
                                    worker.depends(custom, childObject);
                                    worker.depends(childObject, custom);
                                    break;
                                case 'useAttributes':
                                    sub.attributes = childObject.attributes;
                                    delete childObject.attributes;
                                    sub.children.push(child);
                                    // Child is an origin of this parent because the rendering depend of the attributes.
                                    worker.depends(child, sub);
                                    worker.depends(sub, child);
                                    // Custom is an origin beacuse this rendering remove attributes.
                                    worker.depends(childObject, custom);
                                    worker.depends(custom, childObject);
                                    break;
                                case 'useAttributesAndUseObject':
                                    sub.attributes = childObject.attributes;
                                    delete childObject.attributes;
                                    sub.children.push(childObject);
                                    // Child is an origin of this parent because the rendering depend of the content + attributes.
                                    worker.depends(child, sub);
                                    worker.depends(sub, child);
                                    // Custom is an origin beacuse this rendering remove attributes.
                                    worker.depends(custom, childObject);
                                    worker.depends(childObject, custom);
                                    break;
                                default:
                                    parent.children.push(child);
                                    break;
                            }
                        }
                        return parent;
                    }
                }
                class CustomChildRenderer extends NodeRenderer<DomObject> {
                    static id = DomObjectRenderingEngine.id;
                    engine: DomObjectRenderingEngine;
                    predicate = CustomChild;
                    async render(child: CustomChild): Promise<DomObject> {
                        const parent = {
                            tag: 'CHILD',
                            attributes: {
                                'value': child.value.toString(),
                            },
                        };
                        return parent;
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
                        componentZones: [['test', ['main']]],
                        renderers: [CustomRenderer, CustomChildRenderer],
                    };
                }
                editor = new JWEditor();
                editor.load(Char);
                editor.configure(DomLayout, { location: [target, 'replace'] });
                editor.load(Plugin);
            });
            afterEach(async () => {
                await editor.stop();
            });

            it('should render node rendering used by his parent', async () => {
                const child = new CustomChild(CustomeType.useObject);
                custom.append(child);
                await editor.start();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child value="0"></child></wrap></parent></jw-editor>',
                );
                await editor.stop();
            });
            it('should redraw node rendering used by his parent when change node value', async () => {
                const child = new CustomChild(CustomeType.useObject);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    child.value = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child value="1"></child></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(1, 'update attributes');
                await editor.stop();
            });
            it('should redraw node rendering used by his parent when change parent value', async () => {
                const child = new CustomChild(CustomeType.useObject);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.parentValue = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child value="0"></child></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(0, 'update attributes');
                await editor.stop();
            });
            it('should render node rendering tag updated by his parent', async () => {
                const child = new CustomChild(CustomeType.changeTag);
                custom.append(child);
                await editor.start();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child-bis value="0"></child-bis></wrap></parent></jw-editor>',
                );
                await editor.stop();
            });
            it('should redraw node rendering tag updated by his parent when change node value', async () => {
                const child = new CustomChild(CustomeType.changeTag);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    child.value = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child-bis value="1"></child-bis></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(1, 'update attributes');
                await editor.stop();
            });
            it('should redraw node rendering tag updated by his parent when change parent value', async () => {
                const child = new CustomChild(CustomeType.changeTag);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.parentValue = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child-bis value="0"></child-bis></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(0, 'update attributes');
                await editor.stop();
            });
            it('should render node rendering tag updated and used by his parent', async () => {
                const child = new CustomChild(CustomeType.changeTagAndUseObject);
                custom.append(child);
                await editor.start();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child-bis value="0"></child-bis></wrap></parent></jw-editor>',
                );
                await editor.stop();
            });
            it('should redraw node rendering tag updated and used by his parent when change node value', async () => {
                const child = new CustomChild(CustomeType.changeTagAndUseObject);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    child.value = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child-bis value="1"></child-bis></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(1, 'update attributes');
                await editor.stop();
            });
            it('should redraw node rendering tag updated and used by his parent when change parent value', async () => {
                const child = new CustomChild(CustomeType.changeTagAndUseObject);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.parentValue = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap><child-bis value="0"></child-bis></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(0, 'update attributes');
                await editor.stop();
            });
            it('should render node rendering attributes updated by his parent', async () => {
                const child = new CustomChild(CustomeType.useAttributes);
                custom.append(child);
                await editor.start();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap value="0"><child></child></wrap></parent></jw-editor>',
                );
                await editor.stop();
            });
            it('should redraw node rendering attributes updated by his parent when change node value', async () => {
                const child = new CustomChild(CustomeType.useAttributes);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    child.value = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap value="1"><child></child></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(1, 'update attributes');
                await editor.stop();
            });
            it('should redraw node rendering attributes updated by his parent when change parent value', async () => {
                const child = new CustomChild(CustomeType.useAttributes);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.parentValue = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap value="0"><child></child></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(0, 'update attributes');
                await editor.stop();
            });
            it('should render node rendering attributes updated and node used by his parent', async () => {
                const child = new CustomChild(CustomeType.useAttributesAndUseObject);
                custom.append(child);
                await editor.start();
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap value="0"><child></child></wrap></parent></jw-editor>',
                );
                await editor.stop();
            });
            it('should redraw node rendering attributes updated and node used by his parent when change node value', async () => {
                const child = new CustomChild(CustomeType.useAttributesAndUseObject);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    child.value = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap value="1"><child></child></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(1, 'update attributes');
                await editor.stop();
            });
            it('should redraw node rendering attributes updated and node used by his parent when change parent value', async () => {
                const child = new CustomChild(CustomeType.useAttributesAndUseObject);
                custom.append(child);
                await editor.start();
                mutationNumber = 0;
                await editor.execCommand(() => {
                    custom.parentValue = 1;
                });
                expect(container.innerHTML).to.equal(
                    '<jw-editor><parent><wrap value="0"><child></child></wrap></parent></jw-editor>',
                );
                expect(mutationNumber).to.equal(0, 'update attributes');
                await editor.stop();
            });
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
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    div.firstChild().modifiers.prepend(attributes);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p style="color: red;">1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'add style');
            });
            it('should remove a style node', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;
                const attributes = new Attributes();
                attributes.set('style', 'color: red;');

                await editor.execCommand(() => {
                    div.firstChild().modifiers.prepend(attributes);
                });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    div.firstChild().modifiers.remove(attributes);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(2, 'remove style, remove attribute');
            });
            it('should add two style nodes', async () => {
                const pDom = container.querySelector('p');
                const p2 = container.querySelectorAll('p')[2];

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const attributes = new Attributes();
                    attributes.set('style', 'color: red;');
                    div.firstChild().modifiers.prepend(attributes);

                    const attributes2 = new Attributes();
                    attributes2.set('style', 'border: 1px solid black; color: red;');
                    div.lastChild().modifiers.prepend(attributes2);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(p2).to.equal(container.querySelectorAll('p')[2]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p style="color: red;">1</p><p>2</p><p style="border: 1px solid black; color: red;">3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'add style, add 2 styles');
            });
            it('should update a style node', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;
                const p2 = container.querySelectorAll('p')[2];

                const attributes = new Attributes();
                attributes.set('style', 'color: red;');

                await editor.execCommand(() => {
                    div.firstChild().modifiers.prepend(attributes);
                    const attributes2 = new Attributes();
                    attributes2.set('style', 'border: 1px solid black; color: red;');
                    div.lastChild().modifiers.prepend(attributes2);
                });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    attributes.set('style', 'color: blue;');
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(p2).to.equal(container.querySelectorAll('p')[2]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p style="color: blue;">1</p><p>2</p><p style="border: 1px solid black; color: red;">3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'update style');
            });
            it('should update two style nodes', async () => {
                const pDom = container.querySelector('p');
                const p2 = container.querySelectorAll('p')[2];

                const attributes = new Attributes();
                attributes.set('style', 'color: red;');
                const attributes2 = new Attributes();
                attributes2.set('style', 'border: 1px solid black; color: red;');

                await editor.execCommand(() => {
                    div.firstChild().modifiers.prepend(attributes);
                    div.lastChild().modifiers.prepend(attributes2);
                });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    attributes.set('style', 'color: blue;');
                    attributes2.set('style', 'border: 2px solid black; color: blue;');
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(p2).to.equal(container.querySelectorAll('p')[2]);
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p style="color: blue;">1</p><p>2</p><p style="border: 2px solid black; color: blue;">3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'add style, add 2 styles');
            });
            it('should update a the style but keep custom style from animation', async () => {
                const pDom = container.querySelector('p');
                const p2 = container.querySelectorAll('p')[2];

                const attributes = new Attributes();
                attributes.set('style', 'color: red;');
                const attributes2 = new Attributes();
                attributes2.set('style', 'border: 1px solid black; color: red;');

                await editor.execCommand(() => {
                    div.firstChild().modifiers.prepend(attributes);
                    div.lastChild().modifiers.prepend(attributes2);
                });

                container.querySelector('p').style.background = 'black';
                container.querySelectorAll('p')[2].style.background = 'black';
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    attributes.set('style', 'color: blue;');
                    attributes2.set('style', 'border: 2px solid black; color: blue;');
                });

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
                const p = div.firstChild();

                const attributes = new Attributes();
                attributes.set('style', 'color: red;');

                mutationNumber = 0;

                await editor.execCommand(() => {
                    p.modifiers.prepend(attributes);
                });

                expect(mutationNumber).to.equal(1, 'add a style');

                container.querySelector('p').style.background = 'black';
                await nextTick();

                mutationNumber = 0;

                await editor.execCommand(() => {
                    attributes.set('style', 'color: blue;');
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p style="color: blue; background: black;">1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'update a style');

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const p2 = new TagNode({ htmlTag: 'P' });
                    const attributes2 = new Attributes();
                    attributes2.set('class', 'aaa');
                    p2.modifiers.prepend(attributes2);
                    p.remove();
                    div.prepend(p2);
                });

                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p class="aaa"><br></p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(3, 'remove <p>, add <p>, add style');
            });
            it('should add a style node with !important', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const attributes = new Attributes();
                    attributes.set('style', 'border: 1px !important;');
                    div.firstChild().modifiers.prepend(attributes);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p style="border: 1px !important;">1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(1, 'add style');
            });
            it('should remove a style node', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;
                const attributes = new Attributes();
                attributes.set('style', 'color: red;');

                await editor.execCommand(() => {
                    div.firstChild().modifiers.prepend(attributes);
                });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    div.firstChild().modifiers.remove(attributes);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(2, 'remove style, remove attribute');
                await editor.stop();
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
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                mutationNumber = 0;
                await editor.execCommand(() => {
                    const attributes = new Attributes();
                    attributes.set('class', 'a b');
                    div.firstChild().modifiers.prepend(attributes);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p class="a b">1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(2, 'add 2 classNames');
            });
            it('should remove a className', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const attributes = new Attributes();

                await editor.execCommand(() => {
                    attributes.set('class', 'a b c d');
                    div.firstChild().modifiers.prepend(attributes);
                });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    attributes.set('class', 'd a');
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p class="a d">1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(2, 'remove 2 classNames');
            });
            it('should remove all classNames', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const attributes = new Attributes();

                await editor.execCommand(() => {
                    attributes.set('class', 'a b c d');
                    div.firstChild().modifiers.prepend(attributes);
                });

                mutationNumber = 0;
                await editor.execCommand(() => {
                    div.firstChild().modifiers.remove(attributes);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p>1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(5, 'remove 4 className, remove attribute');
            });
            it('should remove a className but keep className added by animation', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const attributes = new Attributes();

                await editor.execCommand(() => {
                    attributes.set('class', 'a b c d');
                    div.firstChild().modifiers.prepend(attributes);
                });

                container.querySelector('p').classList.add('animation');
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    attributes.set('class', 'd a');
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p class="a d animation">1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(2, 'remove 2 classNames');
            });
            it('should remove all classNames but keep className added by animation', async () => {
                const pDom = container.querySelector('p');
                const text = pDom.firstChild;

                const attributes = new Attributes();

                await editor.execCommand(() => {
                    attributes.set('class', 'a b c d');
                    div.firstChild().modifiers.prepend(attributes);
                });

                container.querySelector('p').classList.add('animation');
                await nextTick();

                mutationNumber = 0;
                await editor.execCommand(() => {
                    div.firstChild().modifiers.remove(attributes);
                });

                expect(container.querySelector('p') === pDom).to.equal(true, 'Use same <P>');
                expect(pDom.firstChild === text).to.equal(true, 'Use same text');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><div><p class="animation">1</p><p>2</p><p>3</p></div></jw-editor>',
                );

                expect(mutationNumber).to.equal(4, 'remove 4 classNames');
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
                            const area = new TagNode({ htmlTag: 'div' });
                            area.append(new TagNode({ htmlTag: 'area' }));
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
            await editor.execCommand(() => {
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

            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'totoZone');
            });

            expect(container.innerHTML).to.equal(
                '<div class="a"></div><div class="b"><div><area></div></div>',
            );

            await editor.stop();
        });
        it('should add a component and show it by default', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
        });
        it('should hide a component', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            await editor.execCommand('hide', { componentId: 'aaa' });
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
        });
        it('should show a component', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            await editor.execCommand('hide', { componentId: 'aaa' });
            await editor.execCommand('show', { componentId: 'aaa' });
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
        });
        it('should remove a component', async () => {
            const layout = editor.plugins.get(Layout);
            await editor.execCommand(async () => {
                await layout.append('aaa', 'main');
                await layout.remove('aaa');
            });
            expect(container.innerHTML).to.equal('<jw-editor></jw-editor>');
        });
        it('should remove a component without memory leak', async () => {
            const layout = editor.plugins.get(Layout);
            const root = layout.engines.dom.root;
            const zoneMain = root.descendants(ZoneNode).find(n => n.managedZones.includes('main'));
            await editor.execCommand(() => {
                return layout.append('aaa', 'main');
            });
            const node = zoneMain.children().slice(-1)[0];
            await editor.execCommand(() => {
                zoneMain.children().pop();
            });
            expect(!!zoneMain.hidden?.[node.id]).to.equal(false, 'Component is visible');
            await editor.execCommand('hide', { componentId: 'aaa' });
            expect(zoneMain.hidden?.[node.id]).to.equal(true, 'Component is hidden');
            await editor.execCommand(() => {
                return layout.remove('aaa');
            });
            expect(zoneMain.hidden?.[node.id]).to.equal(undefined);
        });
        it('should remove a component in all layout engines', async () => {
            await editor.execCommand(() => {
                return editor.plugins.get(Layout).append('aaa', 'main');
            });
            expect(container.innerHTML).to.equal('<jw-editor><div><area></div></jw-editor>');
            await editor.execCommand(() => {
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
            custom = null;
            customChild = null;
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
        it('should remove listener and cache on close', async () => {
            await editor.stop();
            await editor.start();
            await editor.stop();
            await editor.start();
            await editor.execCommand(() => {
                custom.sectionAttr = 2;
            });
            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);
        });
        it('should keep (detach & attach) listener when redraw without change', async () => {
            const engine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;

            await engine.redraw({ add: [], move: [], remove: [], update: [[custom, ['id']]] });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw self attribute', async () => {
            await editor.execCommand(() => {
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
            await editor.execCommand(() => {
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

            await engine.redraw({ add: [], move: [], remove: [], update: [[customChild, ['id']]] });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);

            flag = 0;
            await click(container.querySelector('section section'));
            expect(flag).to.equal(2);
        });
        it('should keep (detach & attach) listener when redraw childNode self attribute', async () => {
            await editor.execCommand(() => {
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
            await editor.execCommand(() => {
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
            await editor.execCommand(() => {
                customChild.remove();
            });

            flag = 0;
            await click(container.querySelector('section'));
            expect(flag).to.equal(1);
        });
        it('should keep (detach & attach) listener when redraw when add child', async () => {
            await editor.execCommand(() => {
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
