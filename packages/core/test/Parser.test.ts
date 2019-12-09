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
                expect(i.format).to.have.members(['italic']);
                const b = p.nthChild(1) as CharNode;
                expect(b.format).to.have.members(['bold']);
                const s = p.nthChild(2) as CharNode;
                expect(s.format).to.have.members(['strikethrough']);
                const sup = p.nthChild(3) as CharNode;
                expect(sup.format).to.have.members(['superscript']);
                const sub = p.nthChild(6) as CharNode;
                expect(sub.format).to.have.members(['subscript']);
                const strong = p.nthChild(9) as CharNode;
                expect(strong.format).to.have.members(['strong']);
                const em = p.nthChild(15) as CharNode;
                expect(em.format).to.have.members(['emphasis']);
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
                expect(b.format).to.have.members(['italic']);
                const c = p.children[2] as CharNode;
                expect(c.char).to.equal('c');
                expect(c.format).to.have.members(['bold', 'italic']);
                const d = p.children[3] as CharNode;
                expect(d.char).to.equal('d');
                expect(d.format).to.have.members(['italic']);
            });
        });
    });
});
