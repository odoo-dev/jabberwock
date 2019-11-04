import { expect } from 'chai';
import { Parser } from '../../src/core/utils/Parser';
import { VNodeType } from '../../src/core/stores/VNode';

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
                expect(p.children.length).to.equal(3);
                expect(p.children[0].type).to.equal(VNodeType.RANGE_START);
                expect(p.children[1].type).to.equal(VNodeType.RANGE_END);
                expect(p.children[2].type).to.equal(VNodeType.CHAR);
                expect(p.children[2].value).to.equal('a');
            });

            it('handles nested formatted nodes', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a<i>b<b>c</b>d</i></p>';
                const vDocument = Parser.parse(element);

                expect(vDocument.root.type).to.equal(VNodeType.ROOT);
                expect(vDocument.root.children.length).to.equal(1);
                const p = vDocument.root.children[0];
                expect(p.type).to.equal(VNodeType.PARAGRAPH);
                expect(p.children.length).to.equal(6);
                expect(p.children[0].type).to.equal(VNodeType.RANGE_START);
                expect(p.children[1].type).to.equal(VNodeType.RANGE_END);
                expect(p.children[2].type).to.equal(VNodeType.CHAR);
                expect(p.children[2].value).to.equal('a');
                expect(p.children[3].value).to.equal('b');
                expect(p.children[3].format).to.deep.equal({
                    bold: false,
                    italic: true,
                    underlined: false,
                });
                expect(p.children[4].value).to.equal('c');
                expect(p.children[4].format).to.deep.equal({
                    bold: true,
                    italic: true,
                    underlined: false,
                });
                expect(p.children[5].value).to.equal('d');
                expect(p.children[5].format).to.deep.equal({
                    bold: false,
                    italic: true,
                    underlined: false,
                });
            });
        });
    });
});
