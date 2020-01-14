import { expect } from 'chai';
import { VNode, VNodeType } from '../src/VNodes/VNode';
import { CharNode } from '../../plugin-char/CharNode';
import { LineBreakNode } from '../../plugin-linebreak/LineBreakNode';
import { RangeNode } from '../src/VNodes/RangeNode';
import { VElement } from '../src/VNodes/VElement';
import { FragmentNode } from '../src/VNodes/FragmentNode';
import { withMarkers } from '../../utils/src/range';
import { JWPlugin } from '../src/JWPlugin';
import JWEditor from '../src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { HeadingNode } from '../../plugin-heading/HeadingNode';
import { ParagraphNode } from '../../plugin-paragraph/ParagraphNode';
import { Char } from '../../plugin-char/Char';
import { LineBreak } from '../../plugin-linebreak/LineBreak';
import { ParsingFunction, ParsingContext, ParsingMap } from '../src/Parser';
import { VDocument } from '../src/VDocument';
import { createMap } from '../src/VDocumentMap';

describe('core', () => {
    describe('src', () => {
        describe('VNodes', () => {
            describe('CharNode', () => {
                describe('constructor', () => {
                    it('should create a CharNode', async () => {
                        const c = new CharNode(' ');
                        expect(c.char).to.equal(' ');
                        expect(c.atomic).to.equal(true);
                        expect(c.format).to.deep.equal({
                            bold: false,
                            italic: false,
                            underline: false,
                        });
                        expect(c.length).to.equal(1);
                    });
                    it('should create a CharNode with format', async () => {
                        const c = new CharNode(' ', { bold: true });
                        expect(c.char).to.equal(' ');
                        expect(c.atomic).to.equal(true);
                        expect(c.bold).to.equal(true);
                        expect(c.format).to.deep.equal({
                            bold: true,
                            italic: false,
                            underline: false,
                        });
                    });
                    it('should throw an exception if create a CharNode with wrong value', async () => {
                        expect(() => {
                            // eslint-disable-next-line no-new
                            new CharNode('ab');
                        }).to.throw('Char', 'length greater than 1');
                        expect(() => {
                            // eslint-disable-next-line no-new
                            new CharNode('');
                        }).to.throw('Char', 'empty text');
                    });
                });
                describe('parse', () => {
                    it('should parse a textNode', async () => {
                        const text = document.createTextNode('abc');
                        const context = {
                            currentNode: text,
                            vDocument: new VDocument(new FragmentNode()),
                        };
                        const parsingMap = Char.parse(context)[1];
                        const vNodes = Array.from(parsingMap.keys());
                        expect(vNodes.length).to.equal(3);
                        expect((vNodes[0] as CharNode).char).to.equal('a');
                        expect((vNodes[1] as CharNode).char).to.equal('b');
                        expect((vNodes[2] as CharNode).char).to.equal('c');
                    });
                    it('should not parse a SPAN node', async () => {
                        const span = document.createElement('span');
                        expect(Char.parsingPredicate(span)).to.be.undefined;
                    });
                });
                describe('shallowDuplicate', () => {
                    it('should duplicate a simple char', async () => {
                        const c = new CharNode('a');
                        const copy = c.shallowDuplicate();
                        expect(copy).to.not.equal(c);
                        expect(copy instanceof CharNode).to.equal(true);
                        expect(copy.char).to.equal(c.char);
                        expect(copy.format).to.deep.equal(c.format);
                    });
                    it('should duplicate a char with format', async () => {
                        const c = new CharNode('a');
                        c.bold = true;
                        const copy = c.shallowDuplicate();
                        expect(copy).to.not.equal(c);
                        expect(copy.format.bold).to.equal(true, 'copy is bold');
                        expect(copy.char).to.equal(c.char);
                        expect(copy.format).to.deep.equal(c.format);
                    });
                    it('should mark as italic a duplicate a char', async () => {
                        const c = new CharNode('a');
                        const copy = c.shallowDuplicate();
                        copy.italic = true;
                        expect(copy.format.italic).to.equal(true, 'copy is now italic');
                        expect(c.format.italic).to.equal(false, 'original char is not italic');
                    });
                    it('should update the format for a duplicate a char', async () => {
                        const c = new CharNode('a');
                        const copy = c.shallowDuplicate();
                        copy.format = { italic: true };
                        expect(copy.format.italic).to.equal(true, 'copy is now italic');
                        expect(c.format.italic).to.equal(false, 'original char is not italic');
                    });
                });
                describe('text', () => {
                    it('should concat the CharNodes value', async () => {
                        const a = new CharNode('a');
                        const b = new CharNode('b');
                        const c = new CharNode('c');
                        let text = a.text();
                        text = b.text(text);
                        text = c.text(text);
                        expect(text).to.equal('abc');
                    });
                });
            });
            describe('VElement', () => {
                describe('constructor', () => {
                    it('should create an unknown element', async () => {
                        for (let i = 1; i <= 6; i++) {
                            const vNode = new VElement('UNKNOWN-ELEMENT');
                            expect(vNode.atomic).to.equal(false);
                            expect(vNode.htmlTag).to.equal('UNKNOWN-ELEMENT');
                        }
                    });
                });
                describe('shallowDuplicate', () => {
                    it('should duplicate a SimpleElementNode', async () => {
                        const vNode = new VElement('P');
                        const copy = vNode.shallowDuplicate();
                        expect(copy).to.not.equal(vNode);
                        expect(copy.htmlTag).to.equal('P');
                    });
                });
            });
            describe('ParagraphNode', () => {
                it('should create a paragraph', async () => {
                    const vNode = new ParagraphNode();
                    expect(vNode.atomic).to.equal(false);
                    expect(vNode.htmlTag).to.equal('P');
                });
            });
            describe('HeadingNode', () => {
                it('should create a heading', async () => {
                    for (let i = 1; i <= 6; i++) {
                        const vNode = new HeadingNode(i);
                        expect(vNode.atomic).to.equal(false);
                        expect(vNode.htmlTag).to.equal('H' + i);
                        expect(vNode.level).to.equal(i);
                    }
                });
            });
            describe('LineBreakNode', () => {
                describe('constructor', () => {
                    it('should create a LineBreakNode', async () => {
                        const lineBreak = new LineBreakNode();
                        expect(lineBreak.atomic).to.equal(true);
                    });
                });
                describe('render', () => {
                    it('should render an ending lineBreak (default html arg)', async () => {
                        const lineBreak = new LineBreakNode();
                        const fragment = lineBreak.render<DocumentFragment>();
                        expect(fragment.childNodes.length).to.equal(2);
                        expect(fragment.firstChild.nodeName).to.equal('BR');
                        expect(fragment.lastChild.nodeName).to.equal('BR');
                    });
                    it('should render an ending lineBreak', async () => {
                        const lineBreak = new LineBreakNode();
                        const fragment = lineBreak.render<DocumentFragment>('html');
                        expect(fragment.childNodes.length).to.equal(2);
                        expect(fragment.firstChild.nodeName).to.equal('BR');
                        expect(fragment.lastChild.nodeName).to.equal('BR');
                    });
                    it('should render a lineBreak with char after', async () => {
                        const p = new VElement('P');
                        const lineBreak = new LineBreakNode();
                        p.append(lineBreak);
                        const c = new CharNode(' ');
                        p.append(c);
                        const fragment = lineBreak.render<DocumentFragment>('html');
                        expect(fragment.childNodes.length).to.equal(1);
                        expect(fragment.firstChild.nodeName).to.equal('BR');
                    });
                });
                describe('shallowDuplicate', () => {
                    it('should duplicate a LineBreakNode', async () => {
                        const lineBreak = new LineBreakNode();
                        const copy = lineBreak.shallowDuplicate();
                        expect(copy).to.not.equal(lineBreak);
                        expect(copy instanceof LineBreakNode).to.equal(true);
                    });
                });
                describe('locateRange', () => {
                    it('should locate where to set the range at end', async () => {
                        const p = new VElement('P');
                        const a = new CharNode('a');
                        p.append(a);
                        const lineBreak = new LineBreakNode();
                        p.append(lineBreak);
                        const doc = document.createElement('p');
                        doc.innerHTML = 'a<br><br>';
                        expect(lineBreak.locateRange(doc.childNodes[1], 0)).to.deep.equal([
                            lineBreak,
                            'BEFORE',
                        ]);
                        expect(lineBreak.locateRange(doc.childNodes[2], 0)).to.deep.equal([
                            lineBreak,
                            'AFTER',
                        ]);
                    });
                    it('should locate where to set the range inside string', async () => {
                        const p = new VElement('P');
                        const a = new CharNode('a');
                        p.append(a);
                        const lineBreak = new LineBreakNode();
                        p.append(lineBreak);
                        const b = new CharNode('b');
                        p.append(b);
                        const doc = document.createElement('p');
                        doc.innerHTML = 'a<br>b';
                        expect(lineBreak.locateRange(doc.childNodes[1], 0)).to.deep.equal([
                            lineBreak,
                            'BEFORE',
                        ]);
                    });
                });
            });
            describe('LineBreak', () => {
                describe('parse', () => {
                    it('should parse a BR node', async () => {
                        const br = document.createElement('br');
                        const parsingFunction = LineBreak.parsingPredicate(br);
                        expect(parsingFunction).not.to.be.undefined;
                        const context = {
                            currentNode: br,
                            vDocument: new VDocument(new FragmentNode()),
                        };
                        const parsingMap = parsingFunction(context)[1];
                        expect(parsingMap.size).to.equal(1);
                        const lineBreak = parsingMap.keys().next().value;
                        expect(lineBreak.atomic).to.equal(true);
                    });
                    it('should not parse a SPAN node', async () => {
                        const span = document.createElement('span');
                        expect(LineBreak.parsingPredicate(span)).to.be.undefined;
                    });
                });
            });
            describe('FragmentNode', () => {
                describe('constructor', () => {
                    it('should create a fragment node', async () => {
                        const vNode = new FragmentNode();
                        expect(vNode.type).to.equal(VNodeType.FRAGMENT);
                    });
                });
            });
            describe('RangeNode', () => {
                describe('constructor', () => {
                    it('should create a range node', async () => {
                        const rangeNode = new RangeNode();
                        expect(rangeNode.type).to.equal(VNodeType.MARKER);
                        expect(rangeNode.atomic).to.equal(true);
                    });
                });
            });
            describe('VNode', () => {
                /*
                 * ROOT
                 * - a
                 * - H1
                 *   - RangeTail
                 *   - b
                 * - c
                 * - P
                 *   - d
                 *   - P
                 *     - e
                 *      - RangeHead
                 *     - f
                 */
                const root = new FragmentNode();
                const a = new CharNode('a');
                root.append(a);
                const h1 = new VElement('H1');
                root.append(h1);
                const b = new CharNode('b');
                h1.append(b);
                const tail = new RangeNode();
                h1.prepend(tail);
                const c = new CharNode('c');
                root.append(c);
                const p = new VElement('P');
                root.append(p);
                const d = new CharNode('d');
                p.append(d);
                const pp = new VElement('P');
                p.append(pp);
                const e = new CharNode('e');
                pp.append(e);
                const head = new RangeNode();
                pp.append(head);
                const f = new CharNode('f');
                pp.append(f);

                describe('constructor', () => {
                    it('should create a VNode', async () => {
                        const fakeLineBreak = new VNode();
                        expect(fakeLineBreak.atomic).to.equal(false);
                    });
                });
                describe('toString', () => {
                    it('should display an understandable rendering', async () => {
                        const root = new FragmentNode();
                        const p = new VElement('P');
                        root.append(p);
                        const a = new CharNode('a');
                        p.append(a);
                        const tail = new RangeNode();
                        p.append(tail);
                        const b = new CharNode('b');
                        p.append(b);
                        const head = new RangeNode();
                        p.append(head);
                        const c = new CharNode('c');
                        p.append(c);
                        expect(root + '').to.deep.equal('FragmentNode');
                    });
                });
                describe('children', () => {
                    it('should return the children nodes (without range)', async () => {
                        expect(root.children).to.deep.equal([a, h1, c, p]);
                        expect(h1.children).to.deep.equal([b]);
                    });
                    it('should return the children nodes with the range', async () => {
                        withMarkers(() => {
                            expect(root.children).to.deep.equal([a, h1, c, p]);
                            expect(h1.children).to.deep.equal([tail, b]);
                        });
                    });
                });
                describe('Render', () => {
                    it('should render a VNode', async () => {
                        const root = new VNode();
                        const fragment = root.render<DocumentFragment>();
                        expect(fragment.firstChild.nodeName).to.equal('UNDEFINED');
                    });
                });
                describe('locateRange', () => {
                    it('should locate where to set the range at end', async () => {
                        const p = new VElement('P');
                        p.append(new VNode());
                        p.append(new LineBreakNode());
                        p.append(new VNode());
                        const doc = document.createElement('p');
                        doc.innerHTML = '<span><span><br><span><span>';
                        expect(p.lastChild().locateRange(doc.lastChild, 0)).to.deep.equal([
                            p.lastChild(),
                            'BEFORE',
                        ]);
                        expect(p.lastChild().locateRange(doc.lastChild, 1)).to.deep.equal([
                            p.lastChild(),
                            'AFTER',
                        ]);
                    });
                    it('should locate where to set the range inside string', async () => {
                        const p = new VElement('P');
                        const a = new CharNode('a');
                        p.append(a);
                        const vNode = new VNode();
                        p.append(vNode);
                        const b = new CharNode('b');
                        p.append(b);
                        const doc = document.createElement('p');
                        doc.innerHTML = 'a<span><span>b';
                        expect(vNode.locateRange(doc.childNodes[1], 0)).to.deep.equal([
                            vNode,
                            'BEFORE',
                        ]);
                        expect(vNode.locateRange(doc.childNodes[1], 1)).to.deep.equal([
                            vNode,
                            'AFTER',
                        ]);
                    });
                });
                describe('shallowDuplicate', () => {
                    it('should duplicate a VNode', async () => {
                        const vNode = new VNode();
                        const copy = vNode.shallowDuplicate();
                        expect(copy).to.not.equal(vNode);
                        expect(vNode.type).to.equal(VNodeType.NODE);
                    });
                });
                describe('index', () => {
                    it('should found the index of this VNode within its parent', async () => {
                        const root = new VNode();
                        const p = new VElement('P');
                        root.append(p);
                        const h1 = new VElement('H1');
                        root.append(h1);
                        const a = new CharNode('a');
                        root.append(a);
                        const br = new LineBreakNode();
                        root.append(br);
                        const h2 = new VElement('H2');
                        root.append(h2);
                        const b = new CharNode('b');
                        root.append(b);

                        expect(root.length).to.equal(6);
                        expect(p.index).to.equal(0);
                        expect(h1.index).to.equal(1);
                        expect(a.index).to.equal(2);
                        expect(br.index).to.equal(3);
                        expect(h2.index).to.equal(4);
                        expect(b.index).to.equal(5);
                    });
                });
                describe('text', () => {
                    it('should concat all children CharNodes value', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        root.append(b);
                        const c = new CharNode('c');
                        root.append(c);
                        const p = new VElement('P');
                        root.append(p);
                        const d = new CharNode('d');
                        p.append(d);
                        const e = new CharNode('e');
                        p.append(e);
                        expect(root.text()).to.equal('abcde');
                    });
                });
                describe('isBefore', () => {
                    it('should return if the is before (after in same parent)', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        root.append(b);
                        const c = new CharNode('c');
                        root.append(c);
                        expect(a.isBefore(b)).to.equal(true);
                        expect(a.isBefore(c)).to.equal(true);
                        expect(b.isBefore(a)).to.equal(false);
                        expect(b.isBefore(c)).to.equal(true);
                        expect(c.isBefore(a)).to.equal(false);
                    });
                    it('should return if the is before (after in an other parent)', async () => {
                        expect(a.isBefore(a)).to.equal(false, 'a isBefore a');
                        expect(a.isBefore(b)).to.equal(true, 'a isBefore b');
                        expect(a.isBefore(c)).to.equal(true, 'a isBefore c');
                        expect(a.isBefore(d)).to.equal(true, 'a isBefore d');
                        expect(a.isBefore(e)).to.equal(true, 'a isBefore e');
                        expect(a.isBefore(f)).to.equal(true, 'a isBefore f');

                        expect(b.isBefore(a)).to.equal(false, 'b isBefore a');
                        expect(b.isBefore(b)).to.equal(false, 'b isBefore b');
                        expect(b.isBefore(c)).to.equal(true, 'b isBefore c');
                        expect(b.isBefore(d)).to.equal(true, 'b isBefore d');
                        expect(b.isBefore(e)).to.equal(true, 'b isBefore e');
                        expect(b.isBefore(f)).to.equal(true, 'b isBefore f');

                        expect(c.isBefore(a)).to.equal(false, 'c isBefore a');
                        expect(c.isBefore(b)).to.equal(false, 'c isBefore b');
                        expect(c.isBefore(c)).to.equal(false, 'c isBefore c');
                        expect(c.isBefore(d)).to.equal(true, 'c isBefore d');
                        expect(c.isBefore(e)).to.equal(true, 'c isBefore e');
                        expect(c.isBefore(f)).to.equal(true, 'c isBefore f');

                        expect(d.isBefore(a)).to.equal(false, 'd isBefore a');
                        expect(d.isBefore(b)).to.equal(false, 'd isBefore b');
                        expect(d.isBefore(c)).to.equal(false, 'd isBefore c');
                        expect(d.isBefore(d)).to.equal(false, 'd isBefore d');
                        expect(d.isBefore(e)).to.equal(true, 'd isBefore e');
                        expect(d.isBefore(f)).to.equal(true, 'd isBefore f');

                        expect(e.isBefore(a)).to.equal(false, 'e isBefore a');
                        expect(e.isBefore(b)).to.equal(false, 'e isBefore b');
                        expect(e.isBefore(c)).to.equal(false, 'e isBefore c');
                        expect(e.isBefore(d)).to.equal(false, 'e isBefore d');
                        expect(e.isBefore(e)).to.equal(false, 'e isBefore e');
                        expect(e.isBefore(f)).to.equal(true, 'e isBefore f');

                        expect(f.isBefore(a)).to.equal(false, 'f isBefore a');
                        expect(f.isBefore(b)).to.equal(false, 'f isBefore b');
                        expect(f.isBefore(c)).to.equal(false, 'f isBefore c');
                        expect(f.isBefore(d)).to.equal(false, 'f isBefore d');
                        expect(f.isBefore(e)).to.equal(false, 'f isBefore e');
                        expect(f.isBefore(f)).to.equal(false, 'f isBefore f');
                    });
                });
                describe('isAfter', () => {
                    it('should return if the is after (after in same parent)', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        root.append(b);
                        const c = new CharNode('c');
                        root.append(c);
                        expect(a.isAfter(b)).to.equal(false);
                        expect(a.isAfter(c)).to.equal(false);
                        expect(b.isAfter(a)).to.equal(true);
                        expect(b.isAfter(c)).to.equal(false);
                        expect(c.isAfter(a)).to.equal(true);
                    });
                    it('should return if the is after (after in an other parent)', async () => {
                        expect(a.isAfter(a)).to.equal(false, 'a isAfter a');
                        expect(a.isAfter(b)).to.equal(false, 'a isAfter b');
                        expect(a.isAfter(c)).to.equal(false, 'a isAfter c');
                        expect(a.isAfter(d)).to.equal(false, 'a isAfter d');
                        expect(a.isAfter(e)).to.equal(false, 'a isAfter e');
                        expect(a.isAfter(f)).to.equal(false, 'a isAfter f');

                        expect(b.isAfter(a)).to.equal(true, 'b isAfter a');
                        expect(b.isAfter(b)).to.equal(false, 'b isAfter b');
                        expect(b.isAfter(c)).to.equal(false, 'b isAfter c');
                        expect(b.isAfter(d)).to.equal(false, 'b isAfter d');
                        expect(b.isAfter(e)).to.equal(false, 'b isAfter e');
                        expect(b.isAfter(f)).to.equal(false, 'b isAfter f');

                        expect(c.isAfter(a)).to.equal(true, 'c isAfter a');
                        expect(c.isAfter(b)).to.equal(true, 'c isAfter b');
                        expect(c.isAfter(c)).to.equal(false, 'c isAfter c');
                        expect(c.isAfter(d)).to.equal(false, 'c isAfter d');
                        expect(c.isAfter(e)).to.equal(false, 'c isAfter e');
                        expect(c.isAfter(f)).to.equal(false, 'c isAfter f');

                        expect(d.isAfter(a)).to.equal(true, 'd isAfter a');
                        expect(d.isAfter(b)).to.equal(true, 'd isAfter b');
                        expect(d.isAfter(c)).to.equal(true, 'd isAfter c');
                        expect(d.isAfter(d)).to.equal(false, 'd isAfter d');
                        expect(d.isAfter(e)).to.equal(false, 'd isAfter e');
                        expect(d.isAfter(f)).to.equal(false, 'd isAfter f');

                        expect(e.isAfter(a)).to.equal(true, 'e isAfter a');
                        expect(e.isAfter(b)).to.equal(true, 'e isAfter b');
                        expect(e.isAfter(c)).to.equal(true, 'e isAfter c');
                        expect(e.isAfter(d)).to.equal(true, 'e isAfter d');
                        expect(e.isAfter(e)).to.equal(false, 'e isAfter e');
                        expect(e.isAfter(f)).to.equal(false, 'e isAfter f');

                        expect(f.isAfter(a)).to.equal(true, 'f isAfter a');
                        expect(f.isAfter(b)).to.equal(true, 'f isAfter b');
                        expect(f.isAfter(c)).to.equal(true, 'f isAfter c');
                        expect(f.isAfter(d)).to.equal(true, 'f isAfter d');
                        expect(f.isAfter(e)).to.equal(true, 'f isAfter e');
                        expect(f.isAfter(f)).to.equal(false, 'f isAfter f');
                    });
                });
                describe('nthChild', () => {
                    it('should return the child at given index', async () => {
                        expect(root.nthChild(0)).to.equal(a);
                        expect(root.nthChild(1)).to.equal(h1);
                        expect(root.nthChild(2)).to.equal(c);
                        expect(root.nthChild(3)).to.equal(p);
                    });
                });
                describe('siblings', () => {
                    it('should return the node siblings', async () => {
                        expect(h1.siblings).to.deep.equal([a, h1, c, p]);
                        expect(b.siblings).to.deep.equal([b], 'siblings without the range');
                        expect(root.siblings).to.deep.equal([]);
                    });
                    it('should return the node siblings with the range', async () => {
                        withMarkers(() => {
                            expect(h1.siblings).to.deep.equal([a, h1, c, p]);
                            expect(b.siblings).to.deep.equal([tail, b]);
                            expect(root.siblings).to.deep.equal([]);
                        });
                    });
                });
                describe('firstChild', () => {
                    it('should return the firstChild node', async () => {
                        expect(root.firstChild()).to.deep.equal(a, 'root.firstChild = a');
                        expect(h1.firstChild()).to.deep.equal(
                            b,
                            'h1.firstChild = b (not the range)',
                        );
                        expect(p.firstChild()).to.deep.equal(d, 'p.firstChild = d');
                        expect(pp.firstChild()).to.deep.equal(e, 'pp.firstChild = e');
                    });
                    it('should return the firstChild node with predicate without result', async () => {
                        expect(
                            root.firstChild(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the firstChild node with predicate', async () => {
                        expect(
                            root.firstChild(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(a);
                        expect(
                            root.firstChild(vNode => {
                                return vNode instanceof VElement;
                            }),
                        ).to.equal(h1);
                    });
                });
                describe('lastChild', () => {
                    it('should return the lastChild node', async () => {
                        expect(root.lastChild()).to.deep.equal(p, 'root.lastChild = p');
                        expect(h1.lastChild()).to.deep.equal(b, 'h1.lastChild = b');
                        expect(p.lastChild()).to.deep.equal(pp, 'p.lastChild = pp');
                        expect(pp.lastChild()).to.deep.equal(f, 'pp.lastChild = f');
                    });
                    it('should return the lastChild node with predicate without result', async () => {
                        expect(
                            root.lastChild(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the lastChild node with predicate', async () => {
                        expect(
                            root.lastChild(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(c);
                        expect(
                            root.lastChild(vNode => {
                                return vNode instanceof VElement;
                            }),
                        ).to.equal(p);
                    });
                });
                describe('firstLeaf', () => {
                    it('should return the firstLeaf', async () => {
                        expect(root.firstLeaf()).to.deep.equal(a, 'root.firstLeaf = a');
                        expect(h1.firstLeaf()).to.deep.equal(b, 'h1.firstLeaf = b');
                        expect(p.firstLeaf()).to.deep.equal(d, 'p.firstLeaf = d');
                        expect(pp.firstLeaf()).to.deep.equal(e, 'pp.firstLeaf = e');
                    });
                    it('should return the firstLeaf with predicate without result', async () => {
                        expect(
                            root.firstLeaf(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            root.firstLeaf(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the firstLeaf with predicate', async () => {
                        expect(
                            root.firstLeaf(vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                    });
                    it('should return itself if is firstLeaf', async () => {
                        expect(b.firstLeaf()).to.deep.equal(b);
                    });
                });
                describe('lastLeaf', () => {
                    it('should return the lastLeaf', async () => {
                        expect(root.lastLeaf()).to.deep.equal(f, 'root.lastLeaf = a');
                        expect(h1.lastLeaf()).to.deep.equal(b, 'h1.lastLeaf = b');
                        expect(p.lastLeaf()).to.deep.equal(f, 'p.lastLeaf = d');
                        expect(pp.lastLeaf()).to.deep.equal(f, 'pp.lastLeaf = e');
                    });
                    it('should return the lastLeaf with predicate without result', async () => {
                        expect(
                            root.lastLeaf(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            root.lastLeaf(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the lastLeaf with predicate', async () => {
                        expect(
                            root.lastLeaf(vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                    });
                    it('should return itself if is lastLeaf', async () => {
                        expect(b.lastLeaf()).to.deep.equal(b);
                    });
                });
                describe('firstDescendant', () => {
                    it('should return the firstDescendant', async () => {
                        expect(root.firstDescendant()).to.deep.equal(a, 'root.firstDescendant = a');
                        expect(h1.firstDescendant()).to.deep.equal(
                            b,
                            'h1.firstDescendant = b (not the range)',
                        );
                        expect(p.firstDescendant()).to.deep.equal(d, 'p.firstDescendant = d');
                        expect(pp.firstDescendant()).to.deep.equal(e, 'pp.firstDescendant = e');
                    });
                    it('should return the firstDescendant with predicate without result', async () => {
                        expect(a.firstDescendant()).to.deep.equal(undefined);
                        expect(
                            root.firstDescendant(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            root.firstDescendant(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the firstDescendant with predicate', async () => {
                        expect(
                            root.firstDescendant(vNode => {
                                return vNode.id === pp.id;
                            }),
                        ).to.equal(pp);
                    });
                });
                describe('lastDescendant', () => {
                    it('should return the lastDescendant', async () => {
                        expect(root.lastDescendant()).to.deep.equal(f, 'root.lastDescendant = p');
                        expect(h1.lastDescendant()).to.deep.equal(
                            b,
                            'h1.lastDescendant = b (not the range)',
                        );
                        expect(p.lastDescendant()).to.deep.equal(f, 'p.lastDescendant = f');
                        expect(pp.lastDescendant()).to.deep.equal(f, 'pp.lastDescendant = f');
                    });
                    it('should return the lastDescendant with predicate without result', async () => {
                        expect(a.lastDescendant()).to.deep.equal(undefined);
                        expect(
                            root.lastDescendant(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            root.lastDescendant(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the lastDescendant with predicate', async () => {
                        expect(
                            root.lastDescendant(vNode => {
                                return vNode.id === pp.id;
                            }),
                        ).to.equal(pp);
                    });
                });
                describe('previousSibling', () => {
                    it('should return the previousSibling', async () => {
                        expect(h1.previousSibling()).to.deep.equal(a, 'h1.previousSibling = a');
                        expect(p.previousSibling()).to.deep.equal(c, 'p.previousSibling = c');
                        expect(pp.previousSibling()).to.deep.equal(d, 'pp.previousSibling = d');
                        expect(f.previousSibling()).to.deep.equal(e, 'f.previousSibling = e');
                    });
                    it('should return the previousSibling with predicate without result', async () => {
                        expect(root.previousSibling()).to.deep.equal(undefined);
                        expect(d.previousSibling()).to.deep.equal(undefined);
                        expect(
                            root.previousSibling(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            b.previousSibling(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previousSibling with predicate', async () => {
                        expect(
                            p.previousSibling(vNode => {
                                return vNode.id === a.id;
                            }),
                        ).to.equal(a);
                    });
                });
                describe('nextSibling', () => {
                    it('should return the nextSibling', async () => {
                        expect(h1.nextSibling()).to.deep.equal(c, 'h1.nextSibling = c');
                        expect(d.nextSibling()).to.deep.equal(pp, 'd.nextSibling = pp');
                        expect(e.nextSibling()).to.deep.equal(f, 'e.nextSibling = f');
                    });
                    it('should return the nextSibling with predicate without result', async () => {
                        expect(root.nextSibling()).to.deep.equal(undefined);
                        expect(pp.nextSibling()).to.deep.equal(undefined);
                        expect(
                            root.nextSibling(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            f.nextSibling(vNode => {
                                return vNode.id === head.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the nextSibling with predicate', async () => {
                        expect(
                            h1.nextSibling(vNode => {
                                return vNode.id === p.id;
                            }),
                        ).to.equal(p);
                    });
                });
                describe('previous', () => {
                    it('should return the previous node', async () => {
                        expect(h1.previous()).to.deep.equal(a, 'h1.previous = a');
                        expect(p.previous()).to.deep.equal(c, 'p.previous = c');
                        expect(pp.previous()).to.deep.equal(d, 'pp.previous = d');
                        expect(f.previous()).to.deep.equal(e, 'f.previous = e');
                    });
                    it('should return the previous with predicate without result', async () => {
                        expect(root.previous()).to.deep.equal(undefined);
                        expect(
                            root.previous(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            b.previous(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previous with predicate', async () => {
                        expect(
                            pp.previous(vNode => {
                                return vNode.id === b.id;
                            }),
                        ).to.equal(b);
                    });
                });
                describe('next', () => {
                    it('should return the next', async () => {
                        expect(root.next()).to.deep.equal(a, 'root.next = a');
                        expect(h1.next()).to.deep.equal(b, 'h1.next = b');
                        expect(d.next()).to.deep.equal(pp, 'd.next = pp');
                        expect(e.next()).to.deep.equal(f, 'e.next = f');
                    });
                    it('should return the next with predicate without result', async () => {
                        expect(f.next()).to.deep.equal(undefined);
                        expect(
                            root.next(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            a.next(vNode => {
                                return vNode.id === head.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the next with predicate', async () => {
                        expect(
                            b.next(vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                    });
                });
                describe('previousLeaf', () => {
                    it('should return the previousLeaf node', async () => {
                        expect(h1.previousLeaf()).to.deep.equal(a, 'h1.previousLeaf = a');
                        expect(c.previousLeaf()).to.deep.equal(b, 'c.previousLeaf = b');
                        expect(e.previousLeaf()).to.deep.equal(d, 'e.previousLeaf = d');
                        expect(f.previousLeaf()).to.deep.equal(e, 'f.previousLeaf = e');
                    });
                    it('should return the previousLeaf with predicate without result', async () => {
                        expect(root.previousLeaf()).to.deep.equal(undefined);
                        expect(
                            root.previousLeaf(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            b.previousLeaf(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the previousLeaf with predicate', async () => {
                        expect(
                            e.previousLeaf(vNode => {
                                return vNode.id === b.id;
                            }),
                        ).to.equal(b);
                        expect(
                            e.previousLeaf(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(d);
                    });
                });
                describe('nextLeaf', () => {
                    it('should return the nextLeaf node', async () => {
                        expect(root.nextLeaf()).to.deep.equal(a, 'root.nextLeaf = a');
                        expect(h1.nextLeaf()).to.deep.equal(b, 'h1.nextLeaf = b');
                        expect(c.nextLeaf()).to.deep.equal(d, 'c.nextLeaf = d');
                        expect(b.nextLeaf()).to.deep.equal(c, 'b.nextLeaf = c');
                    });
                    it('should return the nextLeaf with predicate without result', async () => {
                        expect(f.nextLeaf()).to.deep.equal(undefined);
                        expect(
                            root.nextLeaf(() => {
                                return false;
                            }),
                        ).to.be.undefined;
                        expect(
                            b.nextLeaf(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.be.undefined;
                    });
                    it('should return the nextLeaf with predicate', async () => {
                        expect(
                            b.nextLeaf(vNode => {
                                return vNode.id === e.id;
                            }),
                        ).to.equal(e);
                        expect(
                            b.nextLeaf(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.equal(c);
                    });
                });
                describe('previousSiblings', () => {
                    it('should return the previousSiblings', async () => {
                        expect(h1.previousSiblings()).to.deep.equal(
                            [a],
                            'h1.previousSiblings = [a]',
                        );
                        expect(p.previousSiblings()).to.deep.equal(
                            [c, h1, a],
                            'p.previousSiblings = [c, h1, a]',
                        );
                        expect(pp.previousSiblings()).to.deep.equal(
                            [d],
                            'pp.previousSiblings = [d]',
                        );
                        expect(f.previousSiblings()).to.deep.equal([e], 'f.previousSiblings = [e]');
                    });
                    it('should return the previousSiblings with predicate without result', async () => {
                        expect(root.previousSiblings()).to.deep.equal([]);
                        expect(d.previousSiblings()).to.deep.equal([]);
                        expect(
                            root.previousSiblings(() => {
                                return false;
                            }),
                        ).to.deep.equal([]);
                        expect(
                            b.previousSiblings(vNode => {
                                return vNode.id === tail.id;
                            }),
                        ).to.deep.equal([]);
                    });
                    it('should return the previousSiblings with predicate', async () => {
                        expect(
                            p.previousSiblings(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.deep.equal([c, a]);
                    });
                });
                describe('nextSiblings', () => {
                    it('should return the nextSiblings', async () => {
                        expect(h1.nextSiblings()).to.deep.equal([c, p], 'h1.nextSiblings = [c, p]');
                        expect(d.nextSiblings()).to.deep.equal([pp], 'd.nextSiblings = [pp]');
                        expect(e.nextSiblings()).to.deep.equal([f], 'e.nextSiblings = [f]');
                    });
                    it('should return the nextSiblings with predicate without result', async () => {
                        expect(root.nextSiblings()).to.deep.equal([]);
                        expect(pp.nextSiblings()).to.deep.equal([]);
                        expect(
                            root.nextSiblings(() => {
                                return false;
                            }),
                        ).to.deep.equal([]);
                        expect(
                            e.nextSiblings(vNode => {
                                return vNode.id === head.id;
                            }),
                        ).to.deep.equal([]);
                    });
                    it('should return the nextSiblings with predicate', async () => {
                        expect(
                            p.previousSiblings(vNode => {
                                return vNode instanceof CharNode;
                            }),
                        ).to.deep.equal([c, a]);
                    });
                });
                describe('ancestors', () => {
                    it("should get a list of all ancestors of the root node's first leaf", async () => {
                        await testEditor({
                            contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const a = editor.vDocument.root.firstLeaf();
                                const ancestors = a.ancestors();
                                expect(ancestors.map(ancestor => ancestor.name)).to.deep.equal([
                                    'P',
                                    'H1',
                                    'FragmentNode',
                                ]);
                            },
                        });
                    });
                    it("should get a list of all ancestors of the root node's first leaf up until HEADING1", async () => {
                        await testEditor({
                            contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const a = editor.vDocument.root.firstLeaf();
                                const ancestors = a.ancestors(ancestor => ancestor.name !== 'H1');
                                expect(ancestors.map(ancestor => ancestor.name)).to.deep.equal([
                                    'P',
                                    'FragmentNode',
                                ]);
                            },
                        });
                    });
                });
                describe('descendants', () => {
                    it('should get a list of all descendants of the root node ', async () => {
                        await testEditor({
                            contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const descendants = editor.vDocument.root.descendants();
                                expect(
                                    descendants.map(descendant => descendant.name),
                                ).to.deep.equal(['H1', 'P', 'a', 'H2', 'b']);
                            },
                        });
                    });
                    it('should get a list of all non-HEADING2 descendants of the root node ', async () => {
                        await testEditor({
                            contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                            stepFunction: (editor: JWEditor) => {
                                const descendants = editor.vDocument.root.descendants(
                                    descendant => descendant.name !== 'H2',
                                );
                                expect(
                                    descendants.map(descendant => descendant.name),
                                ).to.deep.equal(['H1', 'P', 'a', 'b']);
                            },
                        });
                    });
                });
                describe('walk', () => {
                    it('should walk', async () => {
                        expect(
                            h1.walk(vNode => vNode.next(), vNode => vNode instanceof CharNode),
                        ).to.deep.equal(b);
                    });
                });
                describe('before', () => {
                    it('should insert before node', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        a.before(b);
                        const c = new CharNode('c');
                        a.before(c);
                        expect(a.siblings).to.deep.equal([b, c, a]);
                    });
                });
                describe('after', () => {
                    it('should insert after node', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        a.after(b);
                        const c = new CharNode('c');
                        a.after(c);
                        expect(a.siblings).to.deep.equal([a, c, b]);
                    });
                    it('should move a node after another', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        root.append(b);
                        const c = new CharNode('c');
                        root.append(c);
                        b.after(a);
                        expect(a.siblings).to.deep.equal([b, a, c]);
                    });
                });
                describe('insertBefore', () => {
                    it('should insert insert before node', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        root.insertBefore(b, a);
                        const c = new CharNode('c');
                        root.insertBefore(c, a);
                        expect(a.siblings).to.deep.equal([b, c, a]);
                    });
                    it('should throw when try to insert before unknown node', async () => {
                        expect(() => {
                            root.insertBefore(c, new CharNode('d'));
                        }).to.throw('child');
                    });
                });
                describe('insertAfter', () => {
                    it('should insert insert after node', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        root.insertAfter(b, a);
                        const c = new CharNode('c');
                        root.insertAfter(c, a);
                        expect(a.siblings).to.deep.equal([a, c, b]);
                    });
                    it('should throw when try to insert after unknown node', async () => {
                        expect(() => {
                            root.insertAfter(c, new CharNode('d'));
                        }).to.throw('child');
                    });
                });
                describe('remove', () => {
                    it('should remove node itself', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        root.append(b);
                        const c = new CharNode('c');
                        root.append(c);
                        expect(a.siblings).to.deep.equal([a, b, c]);
                        b.remove();
                        expect(a.siblings).to.deep.equal([a, c]);
                    });
                });
                describe('removeChild', () => {
                    it('should remove a child', async () => {
                        const root = new VNode();
                        const a = new CharNode('a');
                        root.append(a);
                        const b = new CharNode('b');
                        root.append(b);
                        const c = new CharNode('c');
                        root.append(c);
                        expect(a.siblings).to.deep.equal([a, b, c]);
                        root.removeChild(b);
                        expect(a.siblings).to.deep.equal([a, c]);
                    });
                    it('should throw when try to remove a unknown node', async () => {
                        expect(() => {
                            root.removeChild(new CharNode('d'));
                        }).to.throw('child');
                    });
                });
                describe('splitAt', () => {
                    it('should split a paragraph', async () => {
                        const root = new FragmentNode();
                        const p = new VElement('P');
                        root.append(p);
                        const a = new CharNode('a');
                        p.append(a);
                        const b = new CharNode('b');
                        p.append(b);
                        const c = new CharNode('c');
                        p.append(c);
                        p.splitAt(b);
                        expect(p.children).to.deep.equal([a]);
                        expect(p.nextSibling().children).to.deep.equal([b, c]);
                    });
                    it('should split a paragraph with range', async () => {
                        const root = new FragmentNode();
                        const p = new VElement('P');
                        root.append(p);
                        const a = new CharNode('a');
                        p.append(a);
                        const tail = new RangeNode();
                        p.append(tail);
                        const b = new CharNode('b');
                        p.append(b);
                        const head = new RangeNode();
                        p.append(head);
                        const c = new CharNode('c');
                        p.append(c);
                        p.splitAt(b);
                        expect(p.children).to.deep.equal([a, tail]);
                        expect(p.nextSibling().children).to.deep.equal([b, head, c]);
                    });
                });
            });
            describe('Custom VNode', () => {
                it('should create and parse a custom node', () => {
                    const editor = new JWEditor();
                    class MyCustomNode extends VNode {
                        customKey = 'yes';
                    }
                    class MyCustomPlugin extends JWPlugin {
                        static parsingPredicate(node: Node): ParsingFunction {
                            if (node.nodeName === 'CUSTOM-NODE') {
                                return MyCustomPlugin.parse;
                            }
                        }
                        static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
                            const parsedNode = new MyCustomNode();
                            const parsingMap = createMap([[parsedNode, context.currentNode]]);
                            return [context, parsingMap];
                        }
                    }
                    editor.addPlugin(MyCustomPlugin);
                    editor.start();
                    const root = document.createElement('ROOT-NODE');
                    const element = document.createElement('CUSTOM-NODE');
                    root.appendChild(element);
                    const vDocument = editor.parser.parse(root);
                    const customVNode = vDocument.root.firstChild();
                    expect(customVNode.constructor.name).to.equal('MyCustomNode');
                    expect(customVNode instanceof MyCustomNode).to.be.true;
                    expect((customVNode as MyCustomNode).customKey).to.equal('yes');
                });
            });
        });
    });
});
