// import { expect } from 'chai';
// import { CharNode } from '../../plugin-char/src/VNodes/CharNode';
// import { Parser } from '../src/Parser';
// import { FragmentNode } from '../src/VNodes/FragmentNode';
// import { LineBreakNode } from '../../plugin-linebreak/src/VNodes/LineBreakNode';
// import { VElement } from '../src/VNodes/VElement';

// describe('utils', () => {
//     describe('Parser', () => {
//         const parser = new Parser();
//         describe('parse()', () => {
//             it('should parse a "p" tag with some content', () => {
//                 const element = document.createElement('div');
//                 element.innerHTML = '<p>a</p>';
//                 const vDocument = parser.parse(element);

//                 expect(vDocument.root instanceof FragmentNode).to.be.true;
//                 expect(vDocument.root.children.length).to.equal(1);
//                 const p = vDocument.root.children[0] as VElement;
//                 expect(p.htmlTag).to.equal('P');
//                 expect(p.children.length).to.equal(1);
//                 expect(p.children[0] instanceof CharNode).to.be.true;
//                 expect((p.children[0] as CharNode).char).to.equal('a');
//             });
//             it('should parse a "p" tag with no content', () => {
//                 const element = document.createElement('div');
//                 element.innerHTML = '<p><br></p>';
//                 const vDocument = parser.parse(element);
//                 const p = vDocument.root.firstChild();
//                 // The placeholder <br> should not be parsed.
//                 expect(p.hasChildren()).to.be.false;
//             });
//             it('should parse two trailing consecutive <br> as one LINE_BREAK', () => {
//                 const element = document.createElement('div');
//                 element.innerHTML = '<p>a<br><br>';
//                 const vDocument = parser.parse(element);
//                 const p = vDocument.root.firstChild();
//                 // Only one <br> should be parsed.
//                 expect(p.children.length).to.equal(2);
//                 expect(p.lastChild() instanceof LineBreakNode).to.be.true;
//                 expect((p.lastChild().previousSibling() as CharNode).char).to.equal('a');
//             });
//             it('handles nested formatted nodes', () => {
//                 const element = document.createElement('div');
//                 element.innerHTML = '<p>a<i>b<b>c</b>d</i></p>';
//                 const vDocument = parser.parse(element);

//                 expect(vDocument.root instanceof FragmentNode).to.be.true;
//                 expect(vDocument.root.children.length).to.equal(1);
//                 const p = vDocument.root.children[0] as VElement;
//                 expect(p.htmlTag).to.equal('P');
//                 expect(p.children.length).to.equal(4);
//                 const a = p.children[0] as CharNode;
//                 expect(a instanceof CharNode).to.be.true;
//                 expect(a.char).to.equal('a');
//                 expect(a.attributes).to.deep.equal({
//                     bold: false,
//                     italic: false,
//                     underline: false,
//                 });
//                 const b = p.children[1] as CharNode;
//                 expect(b.char).to.equal('b');
//                 expect(b.attributes).to.deep.equal({
//                     bold: false,
//                     italic: true,
//                     underline: false,
//                 });
//                 const c = p.children[2] as CharNode;
//                 expect(c.char).to.equal('c');
//                 expect(c.attributes).to.deep.equal({
//                     bold: true,
//                     italic: true,
//                     underline: false,
//                 });
//                 const d = p.children[3] as CharNode;
//                 expect(d.char).to.equal('d');
//                 expect(d.attributes).to.deep.equal({
//                     bold: false,
//                     italic: true,
//                     underline: false,
//                 });
//             });
//         });
//     });
// });
