import { expect } from 'chai';
import { Parser } from '../src/Parser';
import { VNodeType } from '../src/VNode';
import { CharNode } from '../src/VNodes/CharNode';

describe('utils', () => {
    describe('Parser', () => {
        describe('parse()', () => {
            it('should parse a "p" tag with some content', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a</p>';
                const vDocument = Parser.parse(element);

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
                const vDocument = Parser.parse(element);
                const p = vDocument.root.firstChild();
                // The placeholder <br> should not be parsed.
                expect(p.hasChildren()).to.be.false;
            });
            it('should parse two trailing consecutive <br> as one LINE_BREAK', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a<br><br>';
                const vDocument = Parser.parse(element);
                const p = vDocument.root.firstChild();
                // Only one <br> should be parsed.
                expect(p.children.length).to.equal(2);
                expect(p.lastChild().type).to.equal(VNodeType.LINE_BREAK);
                expect((p.lastChild().previousSibling() as CharNode).char).to.equal('a');
            });
            it('handles nested formatted nodes', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a<i>b<b>c</b>d</i></p>';
                const vDocument = Parser.parse(element);

                expect(vDocument.root.type).to.equal(VNodeType.ROOT);
                expect(vDocument.root.children.length).to.equal(1);
                const p = vDocument.root.children[0];
                expect(p.type).to.equal(VNodeType.PARAGRAPH);
                expect(p.children.length).to.equal(4);
                expect(p.children[0].type).to.equal(VNodeType.CHAR);
                expect((p.children[0] as CharNode).char).to.equal('a');
                expect((p.children[1] as CharNode).char).to.equal('b');
                expect(p.children[1].format).to.deep.equal({
                    bold: false,
                    italic: true,
                    underline: false,
                });
                expect((p.children[2] as CharNode).char).to.equal('c');
                expect(p.children[2].format).to.deep.equal({
                    bold: true,
                    italic: true,
                    underline: false,
                });
                expect((p.children[3] as CharNode).char).to.equal('d');
                expect(p.children[3].format).to.deep.equal({
                    bold: false,
                    italic: true,
                    underline: false,
                });
            });
        });
    });
});
