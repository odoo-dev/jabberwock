import { expect } from 'chai';
import { VNodeType } from '../src/VNode';
import { CharNode } from '../src/VNodes/CharNode';
import { Parser } from '../src/Parser';

describe('utils', () => {
    describe('Parser', () => {
        const parser = new Parser();
        describe('parse()', () => {
            it('should parse a "p" tag with some content', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a</p>';
                const vDocument = parser.parse(element);

                expect(vDocument.root.type).to.equal(VNodeType.ROOT);
                expect(vDocument.root.children.length).to.equal(1);
                const p = vDocument.root.children[0];
                expect(p.type).to.equal(VNodeType.PARAGRAPH);
                expect(p.children.length).to.equal(1);
                expect(p.children[0].type).to.equal(VNodeType.CHAR);
                expect((p.children[0] as CharNode).char).to.equal('a');
            });
            it('should parse a "p" tag with no content', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p><br></p>';
                const vDocument = parser.parse(element);
                const p = vDocument.root.firstChild();
                // The placeholder <br> should not be parsed.
                expect(p.hasChildren()).to.be.false;
            });
            it('should parse two trailing consecutive <br> as one LINE_BREAK', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a<br><br>';
                const vDocument = parser.parse(element);
                const p = vDocument.root.firstChild();
                // Only one <br> should be parsed.
                expect(p.children.length).to.equal(2);
                expect(p.lastChild().type).to.equal(VNodeType.LINE_BREAK);
                expect((p.lastChild().previousSibling() as CharNode).char).to.equal('a');
            });
            it('should parse all format nodes individually', () => {
                const element = document.createElement('div');
                element.innerHTML =
                    '<p><i>i</i><b>b</b><s>s</s><sup>sup</sup><sub>sub</sub><strong>strong</strong><em>em</em></p>';
                const vDocument = parser.parse(element);
                const p = vDocument.root.firstChild();
                expect(p.length).to.equal(17);
                expect(p.children.every(child => child.type === VNodeType.CHAR)).to.be.true;
                const i = p.firstChild() as CharNode;
                expect(i.italic).to.be.true;
                const b = p.nthChild(1) as CharNode;
                expect(b.bold).to.be.true;
                const s = p.nthChild(2) as CharNode;
                expect(s.strikethrough).to.be.true;
                const sup = p.nthChild(3) as CharNode;
                expect(sup.superscript).to.be.true;
                const sub = p.nthChild(6) as CharNode;
                expect(sub.subscript).to.be.true;
                const strong = p.nthChild(9) as CharNode;
                expect(strong.strong).to.be.true;
                const em = p.nthChild(15) as CharNode;
                expect(em.emphasis).to.be.true;
            });
            it('handles nested formatted nodes', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a<i>b<b>c</b>d</i></p>';
                const vDocument = parser.parse(element);

                expect(vDocument.root.type).to.equal(VNodeType.ROOT);
                expect(vDocument.root.children.length).to.equal(1);
                const p = vDocument.root.children[0];
                expect(p.type).to.equal(VNodeType.PARAGRAPH);
                expect(p.children.length).to.equal(4);
                const a = p.children[0] as CharNode;
                expect(a.type).to.equal(VNodeType.CHAR);
                expect(a.char).to.equal('a');
                const b = p.children[1] as CharNode;
                expect(b.char).to.equal('b');
                expect(b.format).to.deep.equal({
                    bold: false,
                    italic: true,
                    underline: false,
                    strikethrough: false,
                    subscript: false,
                    superscript: false,
                    strong: false,
                    emphasis: false,
                });
                const c = p.children[2] as CharNode;
                expect(c.char).to.equal('c');
                expect(c.format).to.deep.equal({
                    bold: true,
                    italic: true,
                    underline: false,
                    strikethrough: false,
                    subscript: false,
                    superscript: false,
                    strong: false,
                    emphasis: false,
                });
                const d = p.children[3] as CharNode;
                expect(d.char).to.equal('d');
                expect(d.format).to.deep.equal({
                    bold: false,
                    italic: true,
                    underline: false,
                    strikethrough: false,
                    subscript: false,
                    superscript: false,
                    strong: false,
                    emphasis: false,
                });
            });
        });
    });
});
