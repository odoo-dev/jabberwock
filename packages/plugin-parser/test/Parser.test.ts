import { expect } from 'chai';
import { CharNode } from '../../plugin-char/src/CharNode';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { testEditor, renderTextualSelection } from '../../utils/src/testUtils';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { CharXmlDomParser } from '../../plugin-char/src/CharXmlDomParser';
import { HeadingXmlDomParser } from '../../plugin-heading/src/HeadingXmlDomParser';
import { LineBreakXmlDomParser } from '../../plugin-linebreak/src/LineBreakXmlDomParser';
import { ParagraphXmlDomParser } from '../../plugin-paragraph/src/ParagraphXmlDomParser';
import { ListXmlDomParser } from '../../plugin-list/src/ListXmlDomParser';
import { ListItemXmlDomParser } from '../../plugin-list/src/ListItemXmlDomParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import JWEditor from '../../core/src/JWEditor';
import { ItalicXmlDomParser } from '../../plugin-italic/src/ItalicXmlDomParser';
import { BoldXmlDomParser } from '../../plugin-bold/src/BoldXmlDomParser';
import { UnderlineXmlDomParser } from '../../plugin-underline/src/UnderlineXmlDomParser';
import { SpanXmlDomParser } from '../../plugin-span/src/SpanXmlDomParser';
import { DomEditable } from '../../plugin-dom-editable/src/DomEditable';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/ui/DomLayoutEngine';

describe('utils', () => {
    describe('Parser', () => {
        describe('parse()', () => {
            let parser: XmlDomParsingEngine;
            beforeEach(async () => {
                parser = new XmlDomParsingEngine(new JWEditor());
                parser.register(CharXmlDomParser);
                parser.register(HeadingXmlDomParser);
                parser.register(LineBreakXmlDomParser);
                parser.register(ParagraphXmlDomParser);
                parser.register(ListXmlDomParser);
                parser.register(ListItemXmlDomParser);
                parser.register(BoldXmlDomParser);
                parser.register(ItalicXmlDomParser);
                parser.register(UnderlineXmlDomParser);
                parser.register(SpanXmlDomParser);
            });
            it('should parse a "p" tag with some content', async () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a</p>';
                const nodes = await parser.parse(element);
                expect(nodes.length).to.equal(1);
                expect(nodes[0].childVNodes.length).to.equal(1);
                const p = nodes[0].childVNodes[0] as VElement;
                expect(p.htmlTag).to.equal('P');
                expect(p.children().length).to.equal(1);
                expect(p.children()[0] instanceof CharNode).to.be.true;
                expect((p.children()[0] as CharNode).char).to.equal('a');
            });
            it('should parse a "p" tag with no content', async () => {
                const element = document.createElement('div');
                element.innerHTML = '<p><br></p>';
                const [node] = await parser.parse(element);
                const p = node.firstChild();
                // The placeholder <br> should not be parsed.
                expect(p.hasChildren()).to.be.false;
            });
            it('should parse two trailing consecutive <br> as one LINE_BREAK', async () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a<br><br>';
                const [node] = await parser.parse(element);
                const p = node.firstChild();
                // Only one <br> should be parsed.
                expect(p.children().length).to.equal(2);
                expect(p.lastChild() instanceof LineBreakNode).to.be.true;
                expect((p.lastChild().previousSibling() as CharNode).char).to.equal('a');
            });
            it('handles nested formatted nodes', async () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a<i>b<b>c</b>d</i></p>';
                const [node] = await parser.parse(element);
                expect(node.childVNodes.length).to.equal(1);
                const p = node.childVNodes[0] as VElement;
                expect(p.htmlTag).to.equal('P');
                expect(p.children().length).to.equal(4);
                const a = p.children()[0] as CharNode;
                expect(a instanceof CharNode).to.be.true;
                expect(a.char).to.equal('a');
                expect(Object.keys(a.formats)).to.deep.equal([]);
                const b = p.children()[1] as CharNode;
                expect(b.char).to.equal('b');
                expect(b.formats.map(f => f.name)).to.deep.equal(['i']);
                const c = p.children()[2] as CharNode;
                expect(c.char).to.equal('c');
                expect(c.formats.map(f => f.name)).to.deep.equal(['i', 'b']);
                const d = p.children()[3] as CharNode;
                expect(d.char).to.equal('d');
                expect(d.formats.map(f => f.name)).to.deep.equal(['i']);
            });
        });
        describe('parse() who use selection', () => {
            describe('Selection collapsed', () => {
                it('selection before a char in paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]a</p>',
                        contentAfter: '<p>[]a</p>',
                    });
                });
                it('selection after a char in paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]</p>',
                        contentAfter: '<p>a[]</p>',
                    });
                });
                it('selection in text in paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]b</p>',
                        contentAfter: '<p>a[]b</p>',
                    });
                });
                it('selection in first position and next char is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>[]a</b>',
                        contentAfter: '<b>[]a</b>',
                    });
                });
                it('selection in first position and next char is not bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        contentAfter: '[]a',
                    });
                });
                it('selection before a <br> into an empty paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<br></p>',
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('selection before a <br> before text into a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]<br>a</p>',
                        contentAfter: '<p>[]<br>a</p>',
                    });
                });
                it('selection before a <br> in text into a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]<br>b</p>',
                        contentAfter: '<p>a[]<br>b</p>',
                    });
                });
                it('selection between 2 <br> into a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br>[]<br></p>',
                        contentAfter: '<p><br>[]<br></p>',
                    });
                });
                it('selection between <br> and text in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br>[]abc</p>',
                        contentAfter: '<p><br>[]abc</p>',
                    });
                });
                it('selection after 4 <br>', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a</p><p>b<br><br><br><br>[]</p><p>c</p>',
                        contentAfter: '<p>a</p><p>b<br><br><br>[]<br></p><p>c</p>',
                    });
                });
                it('selection between text and <br> in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]<br>d</p>',
                        contentAfter: '<p>abc[]<br>d</p>',
                    });
                });
                it('selection in between two paragraphs', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>a</b></p><p>[]</p><p><b>b</b></p>',
                        contentAfter: '<p><b>a</b></p><p>[]<br></p><p><b>b</b></p>',
                    });
                });
                it('selection at the end of a bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a[]</b>b',
                        contentAfter: '<b>a[]</b>b',
                    });
                });
                it('selection after a bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]b',
                        contentAfter: '<b>a[]</b>b',
                    });
                });
                it('selection after a bold in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>abc</b>[]</p>',
                        contentAfter: '<p><b>abc[]</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        // That selection is equivalent to </b>[]
                        contentBefore: '<p><b>abc[]</b></p>',
                        contentAfter: '<p><b>abc[]</b></p>',
                    });
                    await testEditor(BasicEditor, {
                        // The space should have been parsed away.
                        contentBefore: '<p><b>abc[] </b></p>',
                        contentAfter: '<p><b>abc[]</b></p>',
                    });
                });
            });
            describe('Selection not collapsed', () => {
                it('select a char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[a]',
                        contentAfter: '[a]',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[b]c',
                        contentAfter: 'a[b]c',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[b]',
                        contentAfter: 'a[b]',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '[a]b',
                        contentAfter: '[a]b',
                    });
                });
                it('reverse select a char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: ']a[',
                        contentAfter: ']a[',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'a]b[c',
                        contentAfter: 'a]b[c',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'a]b[',
                        contentAfter: 'a]b[',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: ']a[b',
                        contentAfter: ']a[b',
                    });
                });
                it('select two char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[ab]',
                        contentAfter: '[ab]',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[bc]d',
                        contentAfter: 'a[bc]d',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[bc]',
                        contentAfter: 'a[bc]',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '[ab]c',
                        contentAfter: '[ab]c',
                    });
                });
                it('reverse select two char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: ']ab[',
                        contentAfter: ']ab[',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'a]bc[d',
                        contentAfter: 'a]bc[d',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: 'a]bc[',
                        contentAfter: 'a]bc[',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: ']ab[c',
                        contentAfter: ']ab[c',
                    });
                });
                it('select whole content into a bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[b]<b>c</b>',
                        contentAfter: '<b>a[</b>b]<b>c</b>',
                    });
                });
                it('selection outside and inside a bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>[a</b>b]<b>c</b>',
                        contentAfter: '<b>[a</b>b]<b>c</b>',
                    });
                });
                it('selection a <br> into a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[<br>]</p>',
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('selection 2 <br> before a text into a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[<br><br>]b</p>',
                        contentAfter: '<p>a[<br><br>]b</p>',
                    });
                });
                it('selection a <br> between a text and <br> into a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[<br>]<br></p>',
                        contentAfter: '<p>a[<br>]<br></p>',
                    });
                });
            });
            describe('Selection on node not available in VDocument', () => {
                it('selection in text outside of the editor area', async () => {
                    const container = document.createElement('jw-container-test');
                    container.innerHTML = '<div>abc</div><div>cde</div><div>fgh</div>';
                    document.body.appendChild(container);
                    const target = container.children[1] as HTMLElement;

                    // selection in the first text node of the first div
                    const domRange = document.createRange();
                    domRange.setStart(container.firstChild.firstChild, 1);
                    domRange.collapse(true);
                    const domSelection = document.getSelection();
                    domSelection.removeAllRanges();
                    domSelection.addRange(domRange);

                    // apply editor on the second div
                    const editor = new BasicEditor();
                    editor.configure(DomEditable, { source: target });
                    editor.configure(DomLayout, {
                        location: [target, 'replace'],
                    });
                    await editor.start();

                    renderTextualSelection();

                    const domEngine = editor.plugins.get(Layout).engines.dom as DomLayoutEngine;
                    const editable = domEngine.components.get('editable')[0];
                    const domEditable = domEngine.getDomNodes(editable)[0] as Element;

                    const value = domEditable.innerHTML;
                    document.body.removeChild(container);

                    expect(value).to.deep.equal('cde');
                });
            });
        });
    });
});
