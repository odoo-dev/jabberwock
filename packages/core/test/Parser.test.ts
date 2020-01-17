import { expect } from 'chai';
import { CharNode } from '../src/VNodes/CharNode';
import { Parser } from '../src/Parser';
import { FragmentNode } from '../src/VNodes/FragmentNode';
import { LineBreakNode } from '../src/VNodes/LineBreakNode';
import { VElement } from '../src/VNodes/VElement';

describe('utils', () => {
    describe('Parser', () => {
        const parser = new Parser();
        describe('parse()', () => {
            it('should parse a "p" tag with some content', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a</p>';
                const vDocument = parser.parse(element);

                expect(vDocument.root instanceof FragmentNode).to.be.true;
                expect(vDocument.root.children.length).to.equal(1);
                const p = vDocument.root.children[0] as VElement;
                expect(p.htmlTag).to.equal('P');
                expect(p.children.length).to.equal(1);
                expect(p.children[0] instanceof CharNode).to.be.true;
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
                expect(p.lastChild() instanceof LineBreakNode).to.be.true;
                expect((p.lastChild().previousSibling() as CharNode).char).to.equal('a');
            });
            it('handles nested formatted nodes', () => {
                const element = document.createElement('div');
                element.innerHTML = '<p>a<i>b<b>c</b>d</i></p>';
                const vDocument = parser.parse(element);

                expect(vDocument.root instanceof FragmentNode).to.be.true;
                expect(vDocument.root.children.length).to.equal(1);
                const p = vDocument.root.children[0] as VElement;
                expect(p.htmlTag).to.equal('P');
                expect(p.children.length).to.equal(4);
                const a = p.children[0] as CharNode;
                expect(a instanceof CharNode).to.be.true;
                expect(a.char).to.equal('a');
                expect(a.format).to.deep.equal({
                    bold: false,
                    italic: false,
                    underline: false,
                });
                const b = p.children[1] as CharNode;
                expect(b.char).to.equal('b');
                expect(b.format).to.deep.equal({
                    bold: false,
                    italic: true,
                    underline: false,
                });
                const c = p.children[2] as CharNode;
                expect(c.char).to.equal('c');
                expect(c.format).to.deep.equal({
                    bold: true,
                    italic: true,
                    underline: false,
                });
                const d = p.children[3] as CharNode;
                expect(d.char).to.equal('d');
                expect(d.format).to.deep.equal({
                    bold: false,
                    italic: true,
                    underline: false,
                });
            });
            describe('Lists', () => {
                it('should parse a complex list', () => {
                    const element = document.createElement('div');
                    element.innerHTML = [
                        '<ul>',
                        '    <li>', // li0: becomes P
                        '        a',
                        '        <ul>', // li1
                        '            <li>         ', // li1_0: becomes P
                        '                <b>a.</b>a',
                        '            </li>',
                        '            <li><p>a.b</p></li>', // li1_1
                        '            <li><h1>a.c</h1></li>', // li1_2
                        '            <li>a.d</li>', // li1_3: becomes P
                        '            <li>',
                        '                <ul>', // li1_4
                        '                    <li>a.d.a</li>', // li1_4_0: becomes P
                        '                </ul>',
                        '            </li>',
                        '        </ul>',
                        '    </li>',
                        '    <li>b</li>', // li2: becomes P
                        '    <ol>', // li3
                        '        <li>b.1</li>', // li3_0: becomes P
                        '        <li><p>b.2</p></li>', // li3_1
                        '        <li><h1>b.3</h1></li>', // li3_2
                        '        <li>b.4</li>', // li3_3
                        '    </ol>',
                        '</ul>',
                    ].join('\n');
                    const vDocument = parser.parse(element);

                    expect(vDocument.root.children.length).to.equal(1);
                    const list = vDocument.root.firstChild();
                    expect(list.toString()).to.equal('ListNode: UL');
                    expect(list.children.length).to.equal(4);

                    const li0 = list.nthChild(0);
                    expect(li0.toString()).to.equal('VElement: P');
                    expect(li0.children.length).to.equal(1);
                    expect(li0.firstChild().toString()).to.equal('a');

                    const li1 = list.nthChild(1);
                    expect(li1.toString()).to.equal('ListNode: UL');
                    expect(li1.children.length).to.equal(5);

                    /* eslint-disable @typescript-eslint/camelcase */
                    const li1_0 = li1.nthChild(0);
                    expect(li1_0.toString()).to.equal('VElement: P');
                    expect(li1_0.children.length).to.equal(3);
                    expect(li1_0.nthChild(0).toString()).to.equal('a');
                    expect(li1_0.nthChild(1).toString()).to.equal('.');
                    expect((li1_0.nthChild(1) as CharNode).format.bold).to.be.true;
                    expect(li1_0.nthChild(2).toString()).to.equal('a');

                    const li1_1 = li1.nthChild(1);
                    expect(li1_1.toString()).to.equal('VElement: P');
                    expect(li1_1.children.length).to.equal(3);
                    expect(li1_1.nthChild(0).toString()).to.equal('a');
                    expect(li1_1.nthChild(1).toString()).to.equal('.');
                    expect(li1_1.nthChild(2).toString()).to.equal('b');

                    const li1_2 = li1.nthChild(2);
                    expect(li1_2.toString()).to.equal('VElement: H1');
                    expect(li1_2.children.length).to.equal(3);
                    expect(li1_2.nthChild(0).toString()).to.equal('a');
                    expect(li1_2.nthChild(1).toString()).to.equal('.');
                    expect(li1_2.nthChild(2).toString()).to.equal('c');

                    const li1_3 = li1.nthChild(3);
                    expect(li1_3.toString()).to.equal('VElement: P');
                    expect(li1_3.children.length).to.equal(3);
                    expect(li1_3.nthChild(0).toString()).to.equal('a');
                    expect(li1_3.nthChild(1).toString()).to.equal('.');
                    expect(li1_3.nthChild(2).toString()).to.equal('d');

                    const li1_4 = li1.nthChild(4);
                    expect(li1_4.toString()).to.equal('ListNode: UL');
                    expect(li1_4.children.length).to.equal(1);

                    const li1_4_0 = li1_4.firstChild();
                    expect(li1_4_0.toString()).to.equal('VElement: P');
                    expect(li1_4_0.children.length).to.equal(5);
                    expect(li1_4_0.nthChild(0).toString()).to.equal('a');
                    expect(li1_4_0.nthChild(1).toString()).to.equal('.');
                    expect(li1_4_0.nthChild(2).toString()).to.equal('d');
                    expect(li1_4_0.nthChild(3).toString()).to.equal('.');
                    expect(li1_4_0.nthChild(4).toString()).to.equal('a');

                    const li2 = list.nthChild(2);
                    expect(li2.toString()).to.equal('VElement: P');
                    expect(li2.children.length).to.equal(1);
                    expect(li2.firstChild().toString()).to.equal('b');

                    const li3 = list.nthChild(3);
                    expect(li3.toString()).to.equal('ListNode: OL');
                    expect(li3.children.length).to.equal(4);

                    const li3_0 = li3.nthChild(0);
                    expect(li3_0.toString()).to.equal('VElement: P');
                    expect(li3_0.children.length).to.equal(3);
                    expect(li3_0.nthChild(0).toString()).to.equal('b');
                    expect(li3_0.nthChild(1).toString()).to.equal('.');
                    expect(li3_0.nthChild(2).toString()).to.equal('1');

                    const li3_1 = li3.nthChild(1);
                    expect(li3_1.toString()).to.equal('VElement: P');
                    expect(li3_1.children.length).to.equal(3);
                    expect(li3_1.nthChild(0).toString()).to.equal('b');
                    expect(li3_1.nthChild(1).toString()).to.equal('.');
                    expect(li3_1.nthChild(2).toString()).to.equal('2');

                    const li3_2 = li3.nthChild(2);
                    expect(li3_2.toString()).to.equal('VElement: H1');
                    expect(li3_2.children.length).to.equal(3);
                    expect(li3_2.nthChild(0).toString()).to.equal('b');
                    expect(li3_2.nthChild(1).toString()).to.equal('.');
                    expect(li3_2.nthChild(2).toString()).to.equal('3');

                    const li3_3 = li3.nthChild(3);
                    expect(li3_3.toString()).to.equal('VElement: P');
                    expect(li3_3.children.length).to.equal(3);
                    expect(li3_3.nthChild(0).toString()).to.equal('b');
                    expect(li3_3.nthChild(1).toString()).to.equal('.');
                    expect(li3_3.nthChild(2).toString()).to.equal('4');
                    /* eslint-enable @typescript-eslint/camelcase */
                });
            });
        });
    });
});
