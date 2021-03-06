import { expect } from 'chai';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Char } from '../../plugin-char/src/Char';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { DomEditable } from '../../plugin-dom-editable/src/DomEditable';
import {
    setDomSelection,
    nextTick,
    triggerEvent,
    triggerEvents,
} from '../../plugin-dom-editable/test/eventNormalizerUtils';
import { Keymap, Platform } from '../../plugin-keymap/src/Keymap';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { LineBreak } from '../../plugin-linebreak/src/LineBreak';
import { Shadow } from '../src/Shadow';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { ShadowNode } from '../src/ShadowNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { Html } from '../../plugin-html/src/Html';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { Metadata } from '../../plugin-metadata/src/Metadata';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { parseEditable } from '../../utils/src/configuration';
import { spy } from 'sinon';

const container = document.createElement('div');
container.classList.add('container');
const section = document.createElement('section');

describe('DomShadow', async () => {
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
            it('should parse a template with <t-shadow>', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const template = '<div><t-shadow></t-shadow><t t-zone="default"/></div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                expect(node instanceof TagNode && node.htmlTag).to.equal('DIV');
                const shadow = node.firstChild();
                expect(shadow instanceof ShadowNode).to.equal(true);
                expect(shadow.firstChild()).to.equal(undefined);
            });
            it('should parse a template with <t-shadow> which have content', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const template =
                    '<div><t-shadow><section>aaa</section></t-shadow><t t-zone="default"/></div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild();
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
                expect(section.firstChild() instanceof CharNode).to.equal(true);
            });
            it('should parse a template with <t-shadow> with style tag', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const template =
                    '<div><t-shadow><style>* { color: red; }</style><section>aaa</section></t-shadow><t t-zone="default"/></div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild() as ShadowNode;
                const style = shadow.childVNodes[0];
                expect(style instanceof MetadataNode && style.htmlTag).to.equal('STYLE');
                expect(style instanceof MetadataNode && style.contents).to.equal(
                    '* { color: red; }',
                );
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
            it('should parse a template with <t-shadow> with link tag', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const template =
                    '<div><t-shadow>' +
                    '<link rel="stylesheet" href="#href1"/>' +
                    '<link rel="stylesheet" href="#href2"/>' +
                    '<link rel="help" href="/help/"/>' +
                    '<section>aaa</section></t-shadow><t t-zone="default"/>' +
                    '</div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild() as ShadowNode;
                const link = shadow.childVNodes[0];
                expect(link instanceof MetadataNode && link.htmlTag).to.equal('LINK');

                expect(link.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href1"}',
                );
                const link2 = shadow.childVNodes[1];
                expect(link2 instanceof MetadataNode && link2.htmlTag).to.equal('LINK');
                expect(link2.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href2"}',
                );
                const link3 = shadow.childVNodes[2];
                expect(link3 instanceof MetadataNode && link3.htmlTag).to.equal('LINK');
                expect(link3.modifiers.find(Attributes).name).to.equal(
                    '{rel: "help", href: "/help/"}',
                );
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
            it('should parse a template with <t-shadow> with style and link tag', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const template =
                    '<div><t-shadow>' +
                    '<link rel="stylesheet" href="#href1"/>' +
                    '<style>* { color: red; }</style>' +
                    '<link rel="stylesheet" href="#href2"/>' +
                    '<section>aaa</section></t-shadow><t t-zone="default"/>' +
                    '</div>';
                const nodes = await editor.plugins.get(Parser).parse('text/html', template);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild() as ShadowNode;
                const link = shadow.childVNodes[0];
                expect(link instanceof MetadataNode && link.htmlTag).to.equal('LINK');
                expect(link.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href1"}',
                );
                const style = shadow.childVNodes[1];
                expect(style instanceof MetadataNode && style.htmlTag).to.equal('STYLE');
                expect(style instanceof MetadataNode && style.contents).to.equal(
                    '* { color: red; }',
                );
                const link2 = shadow.childVNodes[2];
                expect(link2 instanceof MetadataNode && link2.htmlTag).to.equal('LINK');
                expect(link2.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href2"}',
                );
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
        });
        describe('parse dom/html', async () => {
            it('should parse a HtmlDocument with shadow container', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const domDiv = document.createElement('div');
                const domShadow = document.createElement('article');
                domDiv.appendChild(domShadow);
                domShadow.attachShadow({ mode: 'open' });

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                expect(node instanceof TagNode && node.htmlTag).to.equal('DIV');
                const article = node.firstChild();
                expect(article instanceof TagNode && article.htmlTag).to.equal('ARTICLE');
                const shadow = article.firstChild();
                expect(shadow instanceof ShadowNode).to.equal(true);
                expect(shadow.firstChild()).to.equal(undefined);
            });
            it('should parse a HtmlDocument with shadow container <jw-shadow>', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const domDiv = document.createElement('div');
                const domShadow = document.createElement('jw-shadow');
                domDiv.appendChild(domShadow);
                const shadowRoot = domShadow.attachShadow({ mode: 'open' });
                const domSection = document.createElement('section');
                domSection.textContent = 'aaa';
                shadowRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild();
                expect(shadow instanceof ShadowNode).to.equal(true);
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
                expect(section.firstChild() instanceof CharNode).to.equal(true);
            });
            it('should parse a HtmlDocument with shadow container which have content', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const domDiv = document.createElement('div');
                const domShadow = document.createElement('article');
                domDiv.appendChild(domShadow);
                const shadowRoot = domShadow.attachShadow({ mode: 'open' });
                const domSection = document.createElement('section');
                domSection.textContent = 'aaa';
                shadowRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild().firstChild();
                expect(shadow instanceof ShadowNode).to.equal(true);
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
                expect(section.firstChild() instanceof CharNode).to.equal(true);
            });
            it('should parse a HtmlDocument with shadow container with style tag', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const domDiv = document.createElement('div');
                const domShadow = document.createElement('article');
                domDiv.appendChild(domShadow);
                const shadowRoot = domShadow.attachShadow({ mode: 'open' });
                const domStyle = document.createElement('style');
                domStyle.textContent = '* { color: red; }';
                shadowRoot.appendChild(domStyle);
                const domSection = document.createElement('section');
                shadowRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild().firstChild() as ShadowNode;
                const style = shadow.childVNodes[0];
                expect(style instanceof MetadataNode && style.htmlTag).to.equal('STYLE');
                expect(style instanceof MetadataNode && style.contents).to.equal(
                    '* { color: red; }',
                );
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
            it('should parse a HtmlDocument with shadow container with link tag', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const domDiv = document.createElement('div');
                const domShadow = document.createElement('article');
                domDiv.appendChild(domShadow);
                const shadowRoot = domShadow.attachShadow({ mode: 'open' });
                const domLink = document.createElement('link');
                domLink.setAttribute('rel', 'stylesheet');
                domLink.setAttribute('href', '#href1');
                shadowRoot.appendChild(domLink);
                const domLink2 = document.createElement('link');
                domLink2.setAttribute('rel', 'stylesheet');
                domLink2.setAttribute('href', '#href2');
                shadowRoot.appendChild(domLink2);
                const domLink3 = document.createElement('link');
                domLink3.setAttribute('rel', 'help');
                domLink3.setAttribute('href', '/help/');
                shadowRoot.appendChild(domLink3);
                const domSection = document.createElement('section');
                shadowRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild().firstChild() as ShadowNode;
                const link = shadow.childVNodes[0];
                expect(link instanceof MetadataNode && link.htmlTag).to.equal('LINK');
                expect(link.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href1"}',
                );
                const link2 = shadow.childVNodes[1];
                expect(link2 instanceof MetadataNode && link2.htmlTag).to.equal('LINK');
                expect(link2.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href2"}',
                );
                const link3 = shadow.childVNodes[2];
                expect(link3 instanceof MetadataNode && link3.htmlTag).to.equal('LINK');
                expect(link3.modifiers.find(Attributes).name).to.equal(
                    '{rel: "help", href: "/help/"}',
                );
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
            it('should parse a HtmlDocument with shadow container with style and link tag', async () => {
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Metadata);
                editor.load(Html);
                editor.load(Shadow);
                await editor.start();

                const domDiv = document.createElement('div');
                const domShadow = document.createElement('article');
                domDiv.appendChild(domShadow);
                const shadowRoot = domShadow.attachShadow({ mode: 'open' });
                const domLink = document.createElement('link');
                domLink.setAttribute('rel', 'stylesheet');
                domLink.setAttribute('href', '#href1');
                shadowRoot.appendChild(domLink);
                const domStyle = document.createElement('style');
                domStyle.textContent = '* { color: red; }';
                shadowRoot.appendChild(domStyle);
                const domLink2 = document.createElement('link');
                domLink2.setAttribute('rel', 'stylesheet');
                domLink2.setAttribute('href', '#href2');
                shadowRoot.appendChild(domLink2);
                const domSection = document.createElement('section');
                shadowRoot.appendChild(domSection);

                const nodes = await editor.plugins.get(Parser).parse('dom/html', domDiv);
                const node = nodes[0];

                await editor.stop();

                const shadow = node.firstChild().firstChild() as ShadowNode;
                const link = shadow.childVNodes[0];
                expect(link instanceof MetadataNode && link.htmlTag).to.equal('LINK');
                expect(link.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href1"}',
                );
                const style = shadow.childVNodes[1];
                expect(style instanceof MetadataNode && style.htmlTag).to.equal('STYLE');
                expect(style instanceof MetadataNode && style.contents).to.equal(
                    '* { color: red; }',
                );
                const link2 = shadow.childVNodes[2];
                expect(link2 instanceof MetadataNode && link2.htmlTag).to.equal('LINK');
                expect(link2.modifiers.find(Attributes).name).to.equal(
                    '{rel: "stylesheet", href: "#href2"}',
                );
                const section = shadow.firstChild();
                expect(section instanceof TagNode && section.htmlTag).to.equal('SECTION');
            });
        });
    });

    describe('shadow dom for editable node', async () => {
        it('should get an editable wrapped into a shadow dom', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(Metadata);
            editor.load(Html);
            editor.load(Shadow);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> => {
                            const nodes = await parseEditable(editor, section);
                            const shadow = new ShadowNode();
                            shadow.append(...nodes);
                            return [shadow];
                        },
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal('<jw-editor><jw-shadow></jw-shadow></jw-editor>');
            const shadowRoot = container.querySelector('jw-shadow').shadowRoot;
            expect(shadowRoot.innerHTML).to.equal(
                '<section contenteditable="true"><p>abc</p><p>def</p></section>',
            );
            await editor.stop();
        });
        it('shadown dom should contain the style tag', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(Metadata);
            editor.load(Html);
            editor.load(Shadow);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> => {
                            const nodes = await parseEditable(editor, section);
                            const shadow = new ShadowNode();
                            const style = new MetadataNode({ htmlTag: 'STYLE' });
                            style.contents = 'p {color: red;}';
                            shadow.append(style, ...nodes);

                            return [shadow];
                        },
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal('<jw-editor><jw-shadow></jw-shadow></jw-editor>');
            expect(container.querySelector('jw-shadow').shadowRoot.innerHTML).to.equal(
                '<style>p {color: red;}</style><section contenteditable="true"><p>abc</p><p>def</p></section>',
            );
            await editor.stop();
        });
        it('shadown dom should contain the stylesheet link tags', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(Metadata);
            editor.load(Html);
            editor.load(Shadow);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> => {
                            const nodes = await parseEditable(editor, section);
                            const shadow = new ShadowNode();
                            const link1 = new MetadataNode({ htmlTag: 'LINK' });
                            const attributes1 = new Attributes();
                            attributes1.set('rel', 'stylesheet');
                            attributes1.set('href', '#1');
                            link1.modifiers.prepend(attributes1);
                            shadow.append(link1);
                            const link2 = new MetadataNode({ htmlTag: 'LINK' });
                            const attributes2 = new Attributes();
                            attributes2.set('rel', 'stylesheet');
                            attributes2.set('href', '#2');
                            link2.modifiers.prepend(attributes2);
                            shadow.append(link2);
                            shadow.append(...nodes);

                            return [shadow];
                        },
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal('<jw-editor><jw-shadow></jw-shadow></jw-editor>');
            expect(container.querySelector('jw-shadow').shadowRoot.innerHTML).to.equal(
                '<link rel="stylesheet" href="#1"><link rel="stylesheet" href="#2"><section contenteditable="true"><p>abc</p><p>def</p></section>',
            );
            await editor.stop();
        });
    });
    describe('normalize editable events', async () => {
        describe('hande user events with EventNormalizer', async () => {
            let editor: JWEditor;
            let domEngine: DomLayoutEngine;
            let editable: VNode;
            beforeEach(async () => {
                editor = new JWEditor();
                editor.load(Char);
                editor.load(Html);
                editor.load(LineBreak);
                editor.load(Shadow);
                editor.load(DomEditable);
                editor.configure(DomLayout, {
                    location: [section, 'replace'],
                    components: [
                        {
                            id: 'editable',
                            render: async (editor: JWEditor): Promise<VNode[]> => {
                                const nodes = await parseEditable(editor, section);
                                const shadow = new ShadowNode();
                                shadow.append(...nodes);
                                return [shadow];
                            },
                        },
                    ],
                    componentZones: [['editable', ['main']]],
                });

                section.innerHTML = '<div>abcd</div>';
                setDomSelection(section.firstChild.firstChild, 2, section.firstChild.firstChild, 2);
                await editor.start();
                domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                editable = domEngine.components.editable[0].firstChild();
            });
            afterEach(async () => {
                return editor.stop();
            });
            it('enter in the middle of the word', async () => {
                let domEditable = domEngine.getDomNodes(editable)[0] as Element;
                const p = domEditable.firstChild;
                const text = p.firstChild;
                setDomSelection(text, 2, text, 2);
                await nextTick();

                domEditable = domEngine.getDomNodes(editable)[0] as Element;
                triggerEvent(domEditable, 'keydown', { key: 'Enter', code: 'Enter' });
                triggerEvent(domEditable, 'beforeinput', { inputType: 'insertParagraph' });

                const newText = document.createTextNode('ab');
                p.insertBefore(newText, text);
                text.textContent = 'cd';
                const newP = document.createElement('p');
                domEditable.appendChild(newP);
                newP.appendChild(text);
                setDomSelection(text, 0, text, 0);

                triggerEvent(domEditable, 'input', { inputType: 'insertParagraph' });
                await nextTick();
                await nextTick();

                expect(editor.memoryInfo.commandNames.join(',')).to.equal('insertParagraphBreak');
                domEditable = domEngine.getDomNodes(editable)[0] as Element;
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' +
                        '<div>ab</div><div>cd</div>' +
                        '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: domEditable.lastChild.lastChild,
                    anchorOffset: 0,
                    focusNode: domEditable.lastChild.lastChild,
                    focusOffset: 0,
                });
            });
            it('shift + enter in the middle of a word', async () => {
                let domEditable = domEngine.getDomNodes(editable)[0] as Element;
                let p = domEditable.firstChild;
                let text = p.firstChild;
                setDomSelection(text, 2, text, 2);
                await nextTick();

                domEditable = domEngine.getDomNodes(editable)[0] as Element;
                p = domEditable.firstChild;
                text = p.firstChild;
                triggerEvent(domEditable, 'keydown', { key: 'Enter', code: 'Enter' });
                triggerEvent(domEditable, 'beforeinput', { inputType: 'insertLineBreak' });

                const newText = document.createTextNode('ab');
                p.insertBefore(newText, text);
                text.textContent = 'cd';
                const br = document.createElement('br');
                p.insertBefore(br, text);

                setDomSelection(text, 0, text, 0);

                triggerEvent(domEditable, 'input', { inputType: 'insertLineBreak' });
                await nextTick();
                await nextTick();

                domEditable = domEngine.getDomNodes(editable)[0] as Element;
                expect(editor.memoryInfo.commandNames.join(',')).to.equal('insertLineBreak,insert');
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div>ab<br>cd</div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: domEditable.firstChild,
                    anchorOffset: 2,
                    focusNode: domEditable.firstChild,
                    focusOffset: 2,
                });
            });
            it('should insert char in a word', async () => {
                // key: o
                await triggerEvents([
                    [
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 2 },
                            'anchor': { 'nodeId': 2, 'offset': 2 },
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

                expect(editor.memoryInfo.commandNames.join(',')).to.equal('insertText');
                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                domEditable.removeAttribute('id');
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div>abocd</div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
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
            it('select all: mouse', async () => {
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
                            'clientX': 20,
                            'clientY': 20,
                        },
                        {
                            'type': 'mouseup',
                            'nodeId': 1,
                            'button': 2,
                            'detail': 1,
                            'clientX': 20,
                            'clientY': 20,
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
                            'focus': { 'nodeId': 2, 'offset': 4 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                ]);

                expect(execSpy.args.map(c => c[0]).join(',')).to.eql('selectAll,@commit');

                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true"><div>abcd</div></section>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: domEditable.firstChild.firstChild,
                    anchorOffset: 0,
                    focusNode: domEditable.firstChild.firstChild,
                    focusOffset: 4,
                });
            });
            it('select all: ctrl + a', async () => {
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
                            'focus': { 'nodeId': 2, 'offset': 0 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
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
                            'type': 'keydown',
                            'key': 'Control',
                            'code': 'ControlLeft',
                            'ctrlKey': true,
                        },
                    ],
                    [
                        { 'type': 'keydown', 'key': 'a', 'code': 'KeyQ', 'ctrlKey': true },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 4 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                    [{ 'type': 'keyup', 'key': 'a', 'code': 'KeyQ', 'ctrlKey': true }],
                    [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft', 'ctrlKey': true }],
                ]);

                expect(execSpy.args.map(c => c[0]).join(',')).to.eql('selectAll,@commit');

                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true"><div>abcd</div></section>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: domEditable.firstChild.firstChild,
                    anchorOffset: 0,
                    focusNode: domEditable.firstChild.firstChild,
                    focusOffset: 4,
                });
            });
            it('arrow', async () => {
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

                expect(execSpy.args.map(c => c[0]).join(',')).to.eql('setSelection,@commit');

                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div>abcd</div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
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
            });
            it('should trigger a shortcut', async () => {
                await editor.stop();

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
                            'type': 'keydown',
                            'key': 'Control',
                            'code': 'ControlLeft',
                            'ctrlKey': true,
                        },
                    ],
                    [
                        { 'type': 'keydown', 'key': 'a', 'code': 'KeyQ', 'ctrlKey': true },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 4 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                    [{ 'type': 'keyup', 'key': 'a', 'code': 'KeyQ', 'ctrlKey': true }],
                    [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                ]);

                expect(execSpy.args.map(c => c[0]).join(',')).to.eql(
                    '@preKeydownCommand,command-b,@commit',
                );
            });
            it.skip('deleteWordBackward', async () => {
                // <CTRL>+<BACKSPACE>
                await triggerEvents([
                    [
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 4 },
                            'anchor': { 'nodeId': 2, 'offset': 4 },
                        },
                    ],
                    [
                        {
                            'type': 'keydown',
                            'key': 'Control',
                            'code': 'ControlLeft',
                            'ctrlKey': true,
                        },
                    ],
                    [
                        {
                            'type': 'keydown',
                            'key': 'Backspace',
                            'code': 'Backspace',
                            'ctrlKey': true,
                        },
                        {
                            'type': 'beforeinput',
                            'data': null,
                            'inputType': 'deleteWordBackward',
                        },
                        {
                            'type': 'input',
                            'data': null,
                            'inputType': 'deleteWordBackward',
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': '',
                            'targetId': 2,
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': '',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 0 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                    [
                        {
                            'type': 'keyup',
                            'key': 'Backspace',
                            'code': 'Backspace',
                            'ctrlKey': true,
                        },
                    ],
                    [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                ]);

                expect(editor.memoryInfo.commandNames.join(',')).to.equal('deleteBackward');
                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                domEditable.removeAttribute('id');
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div><br></div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: domEditable.firstChild,
                    anchorOffset: 0,
                    focusNode: domEditable.firstChild,
                    focusOffset: 0,
                });
            });
            it.skip('deleteWordForward', async () => {
                // <CTRL>+<BACKSPACE>
                await triggerEvents([
                    [
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 0 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                    [
                        {
                            'type': 'keydown',
                            'key': 'Control',
                            'code': 'ControlLeft',
                            'ctrlKey': true,
                        },
                    ],
                    [
                        {
                            'type': 'keydown',
                            'key': 'Delete',
                            'code': 'Delete',
                            'ctrlKey': true,
                        },
                        {
                            'type': 'beforeinput',
                            'data': null,
                            'inputType': 'deleteWordForward',
                        },
                        {
                            'type': 'input',
                            'data': null,
                            'inputType': 'deleteWordForward',
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': '',
                            'targetId': 2,
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': '',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 0 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                    [
                        {
                            'type': 'keyup',
                            'key': 'Delete',
                            'code': 'Delete',
                            'ctrlKey': true,
                        },
                    ],
                    [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                ]);

                expect(editor.memoryInfo.commandNames.join(',')).to.equal('deleteForward');
                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                domEditable.removeAttribute('id');
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div><br></div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: domEditable.firstChild,
                    anchorOffset: 0,
                    focusNode: domEditable.firstChild,
                    focusOffset: 0,
                });
            });
            it('deleteContentBackward', async () => {
                // <CTRL>+<BACKSPACE>
                await triggerEvents([
                    [
                        {
                            'type': 'keydown',
                            'key': 'Backspace',
                            'code': 'Backspace',
                        },
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
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'acd',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 1 },
                            'anchor': { 'nodeId': 2, 'offset': 1 },
                        },
                    ],
                    [
                        {
                            'type': 'keyup',
                            'key': 'Backspace',
                            'code': 'Backspace',
                        },
                    ],
                ]);

                expect(editor.memoryInfo.commandNames.join(',')).to.equal('deleteBackward');
                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                domEditable.removeAttribute('id');
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div>acd</div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
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
            });
            it('deleteContentForward', async () => {
                // <CTRL>+<BACKSPACE>
                await triggerEvents([
                    [
                        {
                            'type': 'keydown',
                            'key': 'Delete',
                            'code': 'Delete',
                        },
                        {
                            'type': 'beforeinput',
                            'data': null,
                            'inputType': 'deleteContentForward',
                        },
                        {
                            'type': 'input',
                            'data': null,
                            'inputType': 'deleteContentForward',
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'abd',
                            'targetId': 2,
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'acd',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 2 },
                            'anchor': { 'nodeId': 2, 'offset': 2 },
                        },
                    ],
                    [
                        {
                            'type': 'keyup',
                            'key': 'Delete',
                            'code': 'Delete',
                        },
                    ],
                ]);

                expect(editor.memoryInfo.commandNames.join(',')).to.equal('deleteForward');
                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                domEditable.removeAttribute('id');
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div>abd</div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
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
            it('deleteContentBackward (SwiftKey)', async () => {
                // key: o
                await triggerEvents([
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

                expect(editor.memoryInfo.commandNames.join(',')).to.equal('deleteBackward');
                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                domEditable.removeAttribute('id');
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div>acd</div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
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
            });
        });
        describe('hande user events with EventNormalizer (2)', async () => {
            it('deleteContentBackward (SwiftKey) with special keymap', async () => {
                section.innerHTML = '<div>abcd</div>';
                setDomSelection(section.firstChild.firstChild, 2, section.firstChild.firstChild, 2);
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(Shadow);
                editor.load(DomEditable);
                editor.configure(DomLayout, {
                    location: [section, 'replace'],
                    components: [
                        {
                            id: 'editable',
                            render: async (editor: JWEditor): Promise<VNode[]> => {
                                const nodes = await parseEditable(editor, section);
                                const shadow = new ShadowNode();
                                shadow.append(...nodes);
                                return [shadow];
                            },
                        },
                    ],
                    componentZones: [['editable', ['main']]],
                });
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
                const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                const editable = domEngine.components.editable[0].firstChild();

                // key: o
                await triggerEvents([
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
                const domEditable = domEngine.getDomNodes(editable)[0] as Element;
                domEditable.removeAttribute('id');
                expect((domEditable.parentNode as ShadowRoot).innerHTML).to.equal(
                    '<section contenteditable="true">' + '<div>abd</div>' + '</section>',
                );
                const domSelection = section.ownerDocument.getSelection();
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
                await editor.stop();
            });
            it('mouse setRange (ubuntu chrome)', async () => {
                const editor = new JWEditor();
                editor.load(Html);
                editor.load(Char);
                editor.load(LineBreak);
                editor.load(Shadow);
                editor.load(DomEditable);
                editor.configure(DomLayout, {
                    location: [section, 'replace'],
                    components: [
                        {
                            id: 'editable',
                            render: async (editor: JWEditor): Promise<VNode[]> => {
                                const nodes = await parseEditable(editor, section);
                                const shadow = new ShadowNode();
                                shadow.append(...nodes);
                                return [shadow];
                            },
                        },
                    ],
                    componentZones: [['editable', ['main']]],
                });
                section.innerHTML = '<p>a</p><p>b</p><p>c<br/><br/></p>';
                await editor.start();

                expect(!!editor.selection.anchor.parent).to.equal(false);

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
                            'focus': { 'nodeId': 4, 'offset': 1 },
                            'anchor': { 'nodeId': 2, 'offset': 1 },
                        },
                        {
                            'type': 'click',
                            'nodeId': 1,
                            'button': 2,
                            'detail': 1,
                            'clientX': 10,
                            'clientY': 25,
                        },
                        {
                            'type': 'mouseup',
                            'nodeId': 1,
                            'button': 2,
                            'detail': 1,
                            'clientX': 10,
                            'clientY': 25,
                        },
                    ],
                ]);

                const sectionNode = editor.selection.anchor.ancestor(
                    node => node instanceof TagNode && node.htmlTag === 'SECTION',
                );

                expect(!!sectionNode).to.equal(true);
                expect(editor.selection.anchor.previous()?.id).to.equal(
                    sectionNode.firstDescendant(CharNode).id,
                );
                expect(editor.selection.focus.previous()?.id).to.equal(
                    sectionNode.children()[1].firstChild().id,
                );
                await editor.stop();
            });
            it('arrow with two editors', async () => {
                // first editor
                const editor = new JWEditor();
                editor.load(Char);
                editor.load(Html);
                editor.load(LineBreak);
                editor.load(Shadow);
                editor.load(DomEditable);
                editor.configure(DomLayout, {
                    location: [section, 'replace'],
                    components: [
                        {
                            id: 'editable',
                            render: async (editor: JWEditor): Promise<VNode[]> => {
                                const nodes = await parseEditable(editor, section);
                                const shadow = new ShadowNode();
                                shadow.append(...nodes);
                                return [shadow];
                            },
                        },
                    ],
                    componentZones: [['editable', ['main']]],
                });

                section.innerHTML = '<div>abcd</div>';
                await editor.start();

                // second editor
                const container2 = document.createElement('div');
                container2.classList.add('container2');
                document.body.appendChild(container2);
                const section2 = document.createElement('section');
                section2.classList.add('section2');
                container2.append(section2);

                const editor2 = new JWEditor();
                editor2.load(Char);
                editor2.load(Html);
                editor2.load(LineBreak);
                editor2.load(Shadow);
                editor2.load(DomEditable);
                editor2.configure(DomLayout, {
                    location: [section2, 'replace'],
                    components: [
                        {
                            id: 'editable',
                            render: async (editor2: JWEditor): Promise<VNode[]> => {
                                const nodes = await parseEditable(editor2, section2);
                                const shadow = new ShadowNode();
                                shadow.append(...nodes);
                                return [shadow];
                            },
                        },
                    ],
                    componentZones: [['editable', ['main']]],
                });

                section2.innerHTML = '<div>123456</div>';
                await editor2.start();

                // focus the first editor and trigger arrow
                await triggerEvents(
                    [
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
                    ],
                    container,
                );

                expect(editor.memoryInfo.commandNames.join(',')).to.eql(
                    'setSelection',
                    'focus the first editor',
                );
                const execSpy = spy(editor.dispatcher, 'dispatch');

                await triggerEvents(
                    [
                        [
                            { 'type': 'keydown', 'key': 'ArrowLeft', 'code': 'ArrowLeft' },
                            {
                                'type': 'selection',
                                'focus': { 'nodeId': 2, 'offset': 1 },
                                'anchor': { 'nodeId': 2, 'offset': 1 },
                            },
                        ],
                        [{ 'type': 'keyup', 'key': 'ArrowLeft', 'code': 'ArrowLeft' }],
                    ],
                    container,
                );

                expect(execSpy.args.map(c => c[0]).join(',')).to.eql('setSelection,@commit');

                // focus the second editor and trigger arrow
                await triggerEvents(
                    [
                        [
                            {
                                'type': 'mousedown',
                                'nodeId': 1,
                                'button': 2,
                                'detail': 1,
                                'clientX': 10,
                                'clientY': 34,
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
                                'clientY': 34,
                            },
                            {
                                'type': 'mouseup',
                                'nodeId': 1,
                                'button': 2,
                                'detail': 1,
                                'clientX': 10,
                                'clientY': 34,
                            },
                        ],
                    ],
                    container2,
                );

                expect(execSpy.args.map(c => c[0]).join(',')).to.eql('setSelection,@commit,@blur');
                expect(editor2.memoryInfo.commandNames.join(',')).to.eql(
                    'setSelection',
                    'focus the second editor',
                );
                const execSpy2 = spy(editor2.dispatcher, 'dispatch');

                await triggerEvents(
                    [
                        [
                            { 'type': 'keydown', 'key': 'ArrowLeft', 'code': 'ArrowLeft' },
                            {
                                'type': 'selection',
                                'focus': { 'nodeId': 2, 'offset': 1 },
                                'anchor': { 'nodeId': 2, 'offset': 1 },
                            },
                        ],
                        [{ 'type': 'keyup', 'key': 'ArrowLeft', 'code': 'ArrowLeft' }],
                    ],
                    container2,
                );

                expect(execSpy2.args.map(c => c[0]).join(',')).to.eql('setSelection,@commit');

                await editor.stop();
                await editor2.stop();

                container2.remove();
            });
        });
    });
});
