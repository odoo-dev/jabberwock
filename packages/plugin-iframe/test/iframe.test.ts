import { expect } from 'chai';
import { spy } from 'sinon';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Char } from '../../plugin-char/src/Char';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { DomEditable } from '../../plugin-dom-editable/src/DomEditable';
import { triggerEvents } from '../../plugin-dom-editable/test/eventNormalizerUtils';
import { LineBreak } from '../../plugin-linebreak/src/LineBreak';
import { Iframe } from '../src/Iframe';
import { VNode } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { IframeNode } from '../src/IframeNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { Html } from '../../plugin-html/src/Html';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { Metadata } from '../../plugin-metadata/src/Metadata';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { parseEditable } from '../../utils/src/configuration';
import { Keymap, Platform } from '../../plugin-keymap/src/Keymap';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';

function waitIframeLoading(): Promise<void> {
    return new Promise(r => {
        const resolve = (): void => {
            document.removeEventListener('load-iframe', resolve);
            r();
        };
        document.addEventListener('load-iframe', resolve);
    });
}

const loadedWithPreloadedMeta = Symbol('loadedWithPreloadedMeta');
if (!window.top[loadedWithPreloadedMeta]) {
    window.top[loadedWithPreloadedMeta] = 0;
}
window.top[loadedWithPreloadedMeta]++;
const loadingTest = window.top[loadedWithPreloadedMeta];

const container = document.createElement('div');
container.classList.add('container');
const section = document.createElement('section');

describe('Iframe', async () => {
    beforeEach(() => {
        document.body.appendChild(container);
        container.appendChild(section);
        section.innerHTML = '<p>abc</p><p>def</p>';
    });
    afterEach(() => {
        document.body.removeChild(container);
        container.innerHTML = '';
        section.innerHTML = '';
    });

    describe('parse', async () => {
        describe('parse text/html', async () => {
            it('should parse a template with <t-iframe>', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const template = '<div><t-iframe></t-iframe><t t-zone="default"/></div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                expect(node instanceof TagNode && node.htmlTag).to.equal('DIV');
                const iframe = node.firstChild();
                expect(iframe instanceof IframeNode).to.equal(true);
                expect(iframe.firstChild()).to.equal(undefined);
            });
            it('should parse a template with <t-iframe> which have content', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const template =
                    '<div><t-iframe><section>aaa</section></t-iframe><t t-zone="default"/></div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                const iframe = node.firstChild();
                const section = iframe.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
                expect(section.firstChild() instanceof CharNode).to.equal(true);
            });
            it('should parse a template with <t-iframe> with style tag', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const template =
                    '<div><t-iframe><style>* { color: red; }</style><section>aaa</section></t-iframe><t t-zone="default"/></div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                const iframe = node.firstChild() as IframeNode;
                const style = iframe.childVNodes[0];
                expect(style instanceof MetadataNode && style.htmlTag).to.equal('STYLE');
                expect(style instanceof MetadataNode && style.contents).to.equal(
                    '* { color: red; }',
                );
                const section = iframe.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
            it('should parse a template with <t-iframe> with link tag', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const template =
                    '<div><t-iframe>' +
                    '<link rel="stylesheet" href="#href1"/>' +
                    '<link rel="stylesheet" href="#href2"/>' +
                    '<link rel="help" href="/help/"/>' +
                    '<section>aaa</section></t-iframe><t t-zone="default"/>' +
                    '</div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                const iframe = node.firstChild() as IframeNode;
                const link = iframe.childVNodes[0];
                expect(link instanceof MetadataNode && link.htmlTag).to.equal('LINK');

                expect(link.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href1"}',
                );
                const link2 = iframe.childVNodes[1];
                expect(link2 instanceof MetadataNode && link2.htmlTag).to.equal('LINK');
                expect(link2.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href2"}',
                );
                const link3 = iframe.childVNodes[2];
                expect(link3 instanceof MetadataNode && link3.htmlTag).to.equal('LINK');
                expect(link3.modifiers.find(Attributes).name).to.equal(
                    '{rel: "help", href: "/help/"}',
                );
                const section = iframe.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
            it('should parse a template with <t-iframe> with style and link tag', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const template =
                    '<div><t-iframe>' +
                    '<link rel="stylesheet" href="#href1"/>' +
                    '<style>* { color: red; }</style>' +
                    '<link rel="stylesheet" href="#href2"/>' +
                    '<section>aaa</section></t-iframe><t t-zone="default"/>' +
                    '</div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                const iframe = node.firstChild() as IframeNode;
                const link = iframe.childVNodes[0];
                expect(link instanceof MetadataNode && link.htmlTag).to.equal('LINK');
                expect(link.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href1"}',
                );
                const style = iframe.childVNodes[1];
                expect(style instanceof MetadataNode && style.htmlTag).to.equal('STYLE');
                expect(style instanceof MetadataNode && style.contents).to.equal(
                    '* { color: red; }',
                );
                const link2 = iframe.childVNodes[2];
                expect(link2 instanceof MetadataNode && link2.htmlTag).to.equal('LINK');
                expect(link2.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href2"}',
                );
                const section = iframe.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
        });
        describe('parse dom/html', async () => {
            it('should parse a HtmlDocument with iframe container not appended in the body', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const domDiv = document.createElement('div');
                const domIframe = document.createElement('iframe');
                domDiv.appendChild(domIframe);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                expect(node instanceof TagNode && node.htmlTag).to.equal('DIV');
                const iframe = node.firstChild();
                expect(iframe instanceof IframeNode).to.equal(true);
                expect(iframe.firstChild()).to.equal(undefined);
            });
            it('should parse a HtmlDocument with iframe container', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const domDiv = document.createElement('div');
                const domIframe = document.createElement('iframe');
                domDiv.appendChild(domIframe);
                container.appendChild(domDiv);
                await new Promise(r => setTimeout(r, 15));

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                expect(node instanceof TagNode && node.htmlTag).to.equal('DIV');
                const iframe = node.firstChild();
                expect(iframe instanceof IframeNode).to.equal(true);
                expect(iframe.firstChild()).to.equal(undefined);
            });
            it('should parse a HtmlDocument with iframe which have content', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const domDiv = document.createElement('div');
                const domIframe = document.createElement('iframe');
                domDiv.appendChild(domIframe);
                container.appendChild(domDiv);
                await new Promise(r => setTimeout(r, 15));
                const iframeRoot = domIframe.contentWindow.document.body;

                const domSection = document.createElement('section');
                domSection.textContent = 'aaa';
                iframeRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const iframe = node.firstChild();
                expect(iframe instanceof IframeNode).to.equal(true);
                const section = iframe.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
                expect(section.firstChild() instanceof CharNode).to.equal(true);
            });
            it('should parse a HtmlDocument with iframe container with style tag', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const domDiv = document.createElement('div');
                const domIframe = document.createElement('iframe');
                domDiv.appendChild(domIframe);
                container.appendChild(domDiv);
                await new Promise(r => setTimeout(r, 15));
                const iframeRoot = domIframe.contentWindow.document.body;

                const domStyle = document.createElement('style');
                domStyle.textContent = '* { color: red; }';
                iframeRoot.appendChild(domStyle);
                const domSection = document.createElement('section');
                iframeRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const iframe = node.firstChild() as IframeNode;
                const style = iframe.childVNodes[0];
                expect(style instanceof MetadataNode && style.htmlTag).to.equal('STYLE');
                expect(style instanceof MetadataNode && style.contents).to.equal(
                    '* { color: red; }',
                );
                const section = iframe.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
            it('should parse a HtmlDocument with iframe container with link tag', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const domDiv = document.createElement('div');
                const domIframe = document.createElement('iframe');
                domDiv.appendChild(domIframe);
                container.appendChild(domDiv);
                await new Promise(r => setTimeout(r, 15));
                const iframeRoot = domIframe.contentWindow.document.body;

                const domLink = document.createElement('link');
                domLink.setAttribute('rel', 'stylesheet');
                domLink.setAttribute('href', '#href1');
                iframeRoot.appendChild(domLink);
                const domLink2 = document.createElement('link');
                domLink2.setAttribute('rel', 'stylesheet');
                domLink2.setAttribute('href', '#href2');
                iframeRoot.appendChild(domLink2);
                const domLink3 = document.createElement('link');
                domLink3.setAttribute('rel', 'help');
                domLink3.setAttribute('href', '/help/');
                iframeRoot.appendChild(domLink3);
                const domSection = document.createElement('section');
                iframeRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const iframe = node.firstChild() as IframeNode;
                const link = iframe.childVNodes[0];
                expect(link instanceof MetadataNode && link.htmlTag).to.equal('LINK');
                expect(link.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href1"}',
                );
                const link2 = iframe.childVNodes[1];
                expect(link2 instanceof MetadataNode && link2.htmlTag).to.equal('LINK');
                expect(link2.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href2"}',
                );
                const link3 = iframe.childVNodes[2];
                expect(link3 instanceof MetadataNode && link3.htmlTag).to.equal('LINK');
                expect(link3.modifiers.find(Attributes).name).to.equal(
                    '{rel: "help", href: "/help/"}',
                );
                const section = iframe.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
            it('should parse a HtmlDocument with iframe container with style and link tag', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Iframe);
                await editor.start();

                const domDiv = document.createElement('div');
                const domIframe = document.createElement('iframe');
                domDiv.appendChild(domIframe);
                container.appendChild(domDiv);
                await new Promise(r => setTimeout(r, 15));
                const iframeRoot = domIframe.contentWindow.document.body;

                const domLink = document.createElement('link');
                domLink.setAttribute('rel', 'stylesheet');
                domLink.setAttribute('href', '#href1');
                iframeRoot.appendChild(domLink);
                const domStyle = document.createElement('style');
                domStyle.textContent = '* { color: red; }';
                iframeRoot.appendChild(domStyle);
                const domLink2 = document.createElement('link');
                domLink2.setAttribute('rel', 'stylesheet');
                domLink2.setAttribute('href', '#href2');
                iframeRoot.appendChild(domLink2);
                const domSection = document.createElement('section');
                iframeRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const iframe = node.firstChild() as IframeNode;
                const link = iframe.childVNodes[0];
                expect(link instanceof MetadataNode && link.htmlTag).to.equal('LINK');
                expect(link.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href1"}',
                );
                const style = iframe.childVNodes[1];
                expect(style instanceof MetadataNode && style.htmlTag).to.equal('STYLE');
                expect(style instanceof MetadataNode && style.contents).to.equal(
                    '* { color: red; }',
                );
                const link2 = iframe.childVNodes[2];
                expect(link2 instanceof MetadataNode && link2.htmlTag).to.equal('LINK');
                expect(link2.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href2"}',
                );
                const section = iframe.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
        });
    });

    describe('render', async () => {
        it('javascript inside the iframe has been killed', async () => {
            const editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.load(LineBreak);
            editor.load(Iframe);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> => {
                            const nodes = await parseEditable(editor, section);
                            const iframe = new IframeNode();
                            iframe.append(...nodes);
                            return [iframe];
                        },
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            section.innerHTML = '<p>a</p>';
            await editor.start();
            await waitIframeLoading();
            expect(window.top[loadedWithPreloadedMeta] - loadingTest).to.equal(0);
            await editor.stop();
        });
        it('mouse setRange (ubuntu chrome)', async () => {
            const editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.load(LineBreak);
            editor.load(Iframe);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> => {
                            const nodes = await parseEditable(editor, section);
                            const iframe = new IframeNode();
                            iframe.append(...nodes);
                            return [iframe];
                        },
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            section.innerHTML = '<p>a</p>';
            await editor.start();
            await waitIframeLoading();

            const doc = container.querySelector('iframe').contentWindow.document;
            const root = doc.querySelector('jw-iframe').shadowRoot;
            expect(root.innerHTML).to.equal('<section contenteditable="true"><p>a</p></section>');
            await editor.stop();
        });
    });

    describe('normalize editable events', async () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(Html);
            editor.load(Char);
            editor.load(LineBreak);
            editor.load(Iframe);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> => {
                            const nodes = await parseEditable(editor, section);
                            const iframe = new IframeNode();
                            iframe.append(...nodes);
                            return [iframe];
                        },
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
        });
        afterEach(async () => {
            return editor && editor.stop();
        });
        it('mouse setRange (ubuntu chrome)', async () => {
            section.innerHTML = '<p>aaaaa</p><p>bbbbb</p><p>ccccc<br/><br/></p>';
            await editor.start();
            await waitIframeLoading();

            expect(
                !!editor.selection.anchor.ancestor(
                    node => node instanceof TagNode && node.htmlTag === 'SECTION',
                ),
            ).to.equal(false);

            await triggerEvents([
                [
                    // The browser focus must be triggererd before the test (after the iframe loading).
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 36,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 4, 'offset': 1 },
                        'anchor': { 'nodeId': 4, 'offset': 1 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 36,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 36,
                    },
                ],
            ]);

            const execSpy = spy(editor.dispatcher, 'dispatch');

            await triggerEvents([
                [
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 1 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                ],
            ]);

            const doc = container.querySelector('iframe').contentWindow.document;
            const root = doc.querySelector('jw-iframe').shadowRoot;
            const editable = root.querySelector('section');
            const p1 = editable.firstChild;
            const text1 = p1.firstChild;
            const sectionNode = editor.selection.anchor.ancestor(
                node => node instanceof TagNode && node.htmlTag === 'SECTION',
            );
            expect(!!sectionNode).to.equal(true);
            expect([
                editor.selection.anchor.previous()?.id,
                editor.selection.focus.previous()?.id,
            ]).to.deep.equal([
                sectionNode.firstDescendant(CharNode).id,
                sectionNode.firstDescendant(CharNode).id,
            ]);

            const domSelection = doc.getSelection();
            expect({
                anchorNode: domSelection.anchorNode,
                anchorOffset: domSelection.anchorOffset,
                focusNode: domSelection.focusNode,
                focusOffset: domSelection.focusOffset,
            }).to.deep.equal({
                anchorNode: text1,
                anchorOffset: 1,
                focusNode: text1,
                focusOffset: 1,
            });

            expect(execSpy.args.map(c => c[0]).join(',')).to.eql('setSelection');
        });
        it('mouse setRange (ubuntu chrome) not colapsed', async () => {
            section.innerHTML = '<p>aaaaa</p><p>bbbbb</p><p>ccccc<br/><br/></p>';
            await editor.start();
            await waitIframeLoading();

            expect(
                !!editor.selection.anchor.ancestor(
                    node => node instanceof TagNode && node.htmlTag === 'SECTION',
                ),
            ).to.equal(false);

            await triggerEvents([
                [
                    // The browser focus must be triggererd before the test (after the iframe loading).
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 36,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 1, 'offset': 1 },
                        'anchor': { 'nodeId': 1, 'offset': 1 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 36,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 36,
                    },
                ],
            ]);

            const execSpy = spy(editor.dispatcher, 'dispatch');

            await triggerEvents([
                [
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 1 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                ],
                [
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 4, 'offset': 4 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 34,
                        'clientY': 36,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 34,
                        'clientY': 36,
                    },
                ],
            ]);

            const doc = container.querySelector('iframe').contentWindow.document;
            const root = doc.querySelector('jw-iframe').shadowRoot;
            const editable = root.querySelector('section');
            const p1 = editable.firstChild;
            const text1 = p1.firstChild;
            const p2 = editable.childNodes[1];
            const text2 = p2.firstChild;
            const sectionNode = editor.selection.anchor.ancestor(
                node => node instanceof TagNode && node.htmlTag === 'SECTION',
            );
            expect(!!sectionNode).to.equal(true);
            expect([
                editor.selection.anchor.previous()?.id,
                editor.selection.focus.previous()?.id,
            ]).to.deep.equal([
                sectionNode.firstChild().children()[0].id,
                sectionNode.children()[1].children()[3].id,
            ]);

            const domSelection = doc.getSelection();
            expect({
                anchorNode: domSelection.anchorNode,
                anchorOffset: domSelection.anchorOffset,
                focusNode: domSelection.focusNode,
                focusOffset: domSelection.focusOffset,
            }).to.deep.equal({
                anchorNode: text1,
                anchorOffset: 1,
                focusNode: text2,
                focusOffset: 4,
            });

            // setSelection when mousedown, setSelection when finished to select
            expect(execSpy.args.map(c => c[0]).join(',')).to.eql('setSelection,setSelection');
        });
        it('should insert char in a word', async () => {
            section.innerHTML = '<div>abcd</div>';

            editor.configure(Keymap, { platform: Platform.PC });
            await editor.start();
            await waitIframeLoading();

            // key: o
            await triggerEvents([
                [
                    // The browser focus must be triggererd before the test (after the iframe loading).
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 2 },
                        'anchor': { 'nodeId': 2, 'offset': 2 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                ],
                [
                    { 'type': 'keydown', 'key': 'o', 'code': 'KeyO' },
                    { 'type': 'keypress', 'key': 'o', 'code': 'KeyO' },
                    { 'type': 'beforeinput', 'data': 'o', 'inputType': 'insertText' },
                    { 'type': 'input', 'data': 'o', 'inputType': 'insertText' },
                    {
                        'type': 'mutation',
                        'mutationType': 'characterData',
                        'textContent': 'abocd',
                        'targetId': 2,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 3 },
                        'anchor': { 'nodeId': 2, 'offset': 3 },
                    },
                ],
                [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
            ]);

            const doc = container.querySelector('iframe').contentWindow.document;
            const domEditable = doc.querySelector('jw-iframe').shadowRoot.firstElementChild;
            expect(domEditable.innerHTML).to.equal('<div>abocd</div>');
            expect(editor.memoryInfo.commandNames.join(',')).to.equal('insertText');

            const domSelection = domEditable.ownerDocument.getSelection();
            expect({
                anchorNode: domSelection.anchorNode,
                anchorOffset: domSelection.anchorOffset,
                focusNode: domSelection.focusNode,
                focusOffset: domSelection.focusOffset,
            }).to.deep.equal({
                anchorNode: domEditable.firstChild.firstChild,
                anchorOffset: 3,
                focusNode: domEditable.firstChild.firstChild,
                focusOffset: 3,
            });
        });
        it('deleteContentBackward (SwiftKey) with special keymap', async () => {
            section.innerHTML = '<div>abcd</div>';

            editor.configure(Keymap, { platform: Platform.PC });
            editor.load(
                class A<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Keymap> = {
                        shortcuts: [
                            {
                                pattern: 'BACKSPACE',
                                commandId: 'deleteForward',
                            },
                        ],
                    };
                },
            );
            await editor.start();
            await waitIframeLoading();

            await triggerEvents([
                [
                    // The browser focus must be triggererd before the test (after the iframe loading).
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 2 },
                        'anchor': { 'nodeId': 2, 'offset': 2 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                ],
                [
                    { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                    {
                        'type': 'beforeinput',
                        'data': null,
                        'inputType': 'deleteContentBackward',
                    },
                    {
                        'type': 'input',
                        'data': null,
                        'inputType': 'deleteContentBackward',
                    },
                    {
                        'type': 'mutation',
                        'mutationType': 'characterData',
                        'textContent': 'acd',
                        'targetId': 2,
                    },
                    { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 1 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                ],
            ]);

            expect(editor.memoryInfo.commandNames.join(',')).to.equal('deleteForward');

            const doc = container.querySelector('iframe').contentWindow.document;
            const domEditable = doc.querySelector('jw-iframe').shadowRoot.firstElementChild;
            expect(domEditable.innerHTML).to.equal('<div>abd</div>');
            const domSelection = domEditable.ownerDocument.getSelection();

            expect({
                anchorNode: domSelection.anchorNode,
                anchorOffset: domSelection.anchorOffset,
                focusNode: domSelection.focusNode,
                focusOffset: domSelection.focusOffset,
            }).to.deep.equal({
                anchorNode: domEditable.firstChild.firstChild,
                anchorOffset: 2,
                focusNode: domEditable.firstChild.firstChild,
                focusOffset: 2,
            });
        });
        it('arrow', async () => {
            section.innerHTML = '<div>abcd</div>';

            editor.configure(Keymap, { platform: Platform.PC });
            await editor.start();

            await waitIframeLoading();

            await triggerEvents([
                [
                    // The browser focus must be triggererd before the test (after the iframe loading).
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 2 },
                        'anchor': { 'nodeId': 2, 'offset': 2 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                ],
            ]);

            const execSpy = spy(editor.dispatcher, 'dispatch');

            await triggerEvents([
                [
                    { 'type': 'keydown', 'key': 'ArrowLeft', 'code': 'ArrowLeft' },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 1 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                ],
                [{ 'type': 'keyup', 'key': 'ArrowLeft', 'code': 'ArrowLeft' }],
            ]);

            expect(editor.memoryInfo.commandNames.join(',')).to.equal('setSelection');

            const doc = container.querySelector('iframe').contentWindow.document;
            const domEditable = doc.querySelector('jw-iframe').shadowRoot.firstElementChild;
            expect(domEditable.innerHTML).to.equal('<div>abcd</div>');
            const domSelection = domEditable.ownerDocument.getSelection();
            expect({
                anchorNode: domSelection.anchorNode,
                anchorOffset: domSelection.anchorOffset,
                focusNode: domSelection.focusNode,
                focusOffset: domSelection.focusOffset,
            }).to.deep.equal({
                anchorNode: domEditable.firstChild.firstChild,
                anchorOffset: 1,
                focusNode: domEditable.firstChild.firstChild,
                focusOffset: 1,
            });

            expect(execSpy.args.map(c => c[0]).join(',')).to.eql('setSelection');
        });
        it('select all: mouse', async () => {
            section.innerHTML = '<p>a</p><p>b</p><p>c<br/><br/></p>';
            await editor.start();
            await waitIframeLoading();

            await triggerEvents([
                [
                    // The browser focus must be triggererd before the test (after the iframe loading).
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 1 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                ],
            ]);

            const execSpy = spy(editor.dispatcher, 'dispatch');

            await triggerEvents([
                [
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 20,
                        'clientY': 20,
                    },
                ],
                [
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 5, 'offset': 3 },
                        'anchor': { 'nodeId': 2, 'offset': 0 },
                    },
                ],
            ]);

            expect(execSpy.args.map(c => c[0]).join(',')).to.eql('selectAll');
        });
        it('select all: ctrl + a', async () => {
            section.innerHTML = '<p>a</p><p>b</p><p>c<br/><br/></p>';
            await editor.start();
            await waitIframeLoading();

            await triggerEvents([
                [
                    // The browser focus must be triggererd before the test (after the iframe loading).
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 1 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                ],
            ]);

            const execSpy = spy(editor.dispatcher, 'dispatch');

            await triggerEvents([
                [{ 'type': 'keydown', 'key': 'Control', 'code': 'ControlLeft', 'ctrlKey': true }],
                [
                    { 'type': 'keydown', 'key': 'a', 'code': 'KeyQ', 'ctrlKey': true },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 5, 'offset': 3 },
                        'anchor': { 'nodeId': 2, 'offset': 0 },
                    },
                ],
                [{ 'type': 'keyup', 'key': 'a', 'code': 'KeyQ', 'ctrlKey': true }],
                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft', 'ctrlKey': true }],
            ]);

            expect(execSpy.args.map(c => c[0]).join(',')).to.eql('selectAll');
        });
        it('should trigger a shortcut', async () => {
            section.innerHTML = '<p>a</p><p>b</p><p>c<br/><br/></p>';
            editor.configure(Keymap, { platform: Platform.PC });
            const loadables: Loadables<Keymap> = {
                shortcuts: [
                    {
                        pattern: 'CTRL+A',
                        commandId: 'command-b',
                    },
                ],
            };
            editor.load(loadables);
            await editor.start();
            await waitIframeLoading();

            await triggerEvents([
                [
                    // The browser focus must be triggererd before the test (after the iframe loading).
                    {
                        'type': 'mousedown',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 1 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                    {
                        'type': 'click',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                    {
                        'type': 'mouseup',
                        'nodeId': 1,
                        'button': 2,
                        'detail': 1,
                        'clientX': 10,
                        'clientY': 10,
                    },
                ],
            ]);

            const execSpy = spy(editor.dispatcher, 'dispatch');

            await triggerEvents([
                [{ 'type': 'keydown', 'key': 'Control', 'code': 'ControlLeft', 'ctrlKey': true }],
                [
                    { 'type': 'keydown', 'key': 'a', 'code': 'KeyQ', 'ctrlKey': true },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 5, 'offset': 3 },
                        'anchor': { 'nodeId': 2, 'offset': 0 },
                    },
                ],
                [{ 'type': 'keyup', 'key': 'a', 'code': 'KeyQ', 'ctrlKey': true }],
                [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
            ]);

            expect(execSpy.args.map(c => c[0]).join(',')).to.eql('command-b');
        });
    });
});
