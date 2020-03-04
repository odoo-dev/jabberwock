import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { Core } from '../../core/src/Core';
import { ListType, ListNode } from '../src/ListNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { describePlugin, keydown, unformat } from '../../utils/src/testUtils';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';
import { List } from '../src/List';
import { ListDomParser } from '../src/ListDomParser';
import { ListItemDomParser } from '../src/ListItemDomParser';
import { CharDomParser } from '../../plugin-char/src/CharDomParser';
import { HeadingDomParser } from '../../plugin-heading/src/HeadingDomParser';
import { LineBreakDomParser } from '../../plugin-linebreak/src/LineBreakDomParser';
import { ParagraphDomParser } from '../../plugin-paragraph/src/ParagraphDomParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { ParagraphNode } from '../../plugin-paragraph/src/ParagraphNode';
import { ItalicDomParser } from '../../plugin-italic/src/ItalicDomParser';
import { BoldDomParser } from '../../plugin-bold/src/BoldDomParser';
import { UnderlineDomParser } from '../../plugin-underline/src/UnderlineDomParser';
import { SpanDomParser } from '../../plugin-span/src/SpanDomParser';
import { Char } from '../../plugin-char/src/Char';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { LinkDomParser } from '../../plugin-link/src/LinkDomParser';
import { SuperscriptDomParser } from '../../plugin-superscript/src/SuperscriptDomParser';
import { Dom } from '../../plugin-dom/src/Dom';

const deleteForward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteForward');
const deleteBackward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteBackward');
const insertParagraphBreak = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('insertParagraphBreak');
const insertLineBreak = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<Core>('insert', {
        node: new LineBreakNode(),
    });
};
const toggleOrderedList = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<List>('toggleList', {
        type: ListType.ORDERED,
    });
};
const toggleUnorderedList = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<List>('toggleList', {
        type: ListType.UNORDERED,
    });
};
const backspace = async (editor: JWEditor): Promise<void> => {
    const domPlugin = editor.plugins.get(Dom);
    await keydown(domPlugin.editable, 'Backspace');
};
const insertText = async (editor: JWEditor, text: string): Promise<void> => {
    await editor.execCommand<Char>('insertText', {
        text: text,
    });
};

describePlugin(List, testEditor => {
    describe('parse', () => {
        let editor: JWEditor;
        let engine: DomParsingEngine;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.configure({ createBaseContainer: () => new ParagraphNode() });
            engine = new DomParsingEngine(editor);
            engine.register(CharDomParser);
            engine.register(HeadingDomParser);
            engine.register(LineBreakDomParser);
            engine.register(ParagraphDomParser);
            engine.register(ListDomParser);
            engine.register(ListItemDomParser);
            engine.register(ItalicDomParser);
            engine.register(BoldDomParser);
            engine.register(UnderlineDomParser);
            engine.register(SpanDomParser);
            engine.register(LinkDomParser);
            engine.register(SuperscriptDomParser);
        });
        it('should parse a complex list', async () => {
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
            const node = (await engine.parse(element))[0];

            expect(node.children.length).to.equal(1);
            const list = node.firstChild() as ListNode;
            expect(list.toString()).to.equal('ListNode: ' + ListType.UNORDERED);
            expect(list.listType).to.equal(ListType.UNORDERED);
            expect(list.children.length).to.equal(4); // li0, li1, li2, li3

            const li0 = list.children()[0];
            expect(li0.toString()).to.equal('ParagraphNode');
            expect(li0.children().length).to.equal(1);
            expect(li0.firstChild().toString()).to.equal('a');

            const li1 = list.children()[1] as ListNode;
            expect(li1.toString()).to.equal('ListNode: ' + ListType.UNORDERED);
            expect(li1.listType).to.equal(ListType.UNORDERED);
            expect(li1.children().length).to.equal(5);

            /* eslint-disable @typescript-eslint/camelcase */
            const li1_0 = li1.children()[0];
            expect(li1_0.toString()).to.equal('ParagraphNode');
            expect(li1_0.children().length).to.equal(3);
            expect(li1_0.children()[0].toString()).to.equal('a');
            expect(li1_0.children()[1].toString()).to.equal('.');
            expect((li1_0.children()[1] as CharNode).formats.length).to.equal(1);
            expect((li1_0.children()[1] as CharNode).formats[0].htmlTag).to.equal('B');
            expect(li1_0.children()[2].toString()).to.equal('a');

            const li1_1 = li1.children()[1];
            expect(li1_1.toString()).to.equal('ParagraphNode');
            expect(li1_1.children().length).to.equal(3);
            expect(li1_1.children()[0].toString()).to.equal('a');
            expect(li1_1.children()[1].toString()).to.equal('.');
            expect(li1_1.children()[2].toString()).to.equal('b');

            const li1_2 = li1.children()[2];
            expect(li1_2.toString()).to.equal('HeadingNode: 1');
            expect(li1_2.children().length).to.equal(3);
            expect(li1_2.children()[0].toString()).to.equal('a');
            expect(li1_2.children()[1].toString()).to.equal('.');
            expect(li1_2.children()[2].toString()).to.equal('c');

            const li1_3 = li1.children()[3];
            expect(li1_3.toString()).to.equal('ParagraphNode');
            expect(li1_3.children().length).to.equal(3);
            expect(li1_3.children()[0].toString()).to.equal('a');
            expect(li1_3.children()[1].toString()).to.equal('.');
            expect(li1_3.children()[2].toString()).to.equal('d');

            const li1_4 = li1.children()[4] as ListNode;
            expect(li1_4.toString()).to.equal('ListNode: ' + ListType.UNORDERED);
            expect(li1_4.listType).to.equal(ListType.UNORDERED);
            expect(li1_4.children().length).to.equal(1);

            const li1_4_0 = li1_4.firstChild();
            expect(li1_4_0.toString()).to.equal('ParagraphNode');
            expect(li1_4_0.children().length).to.equal(5);
            expect(li1_4_0.children()[0].toString()).to.equal('a');
            expect(li1_4_0.children()[1].toString()).to.equal('.');
            expect(li1_4_0.children()[2].toString()).to.equal('d');
            expect(li1_4_0.children()[3].toString()).to.equal('.');
            expect(li1_4_0.children()[4].toString()).to.equal('a');

            const li2 = list.children()[2];
            expect(li2.toString()).to.equal('ParagraphNode');
            expect(li2.children().length).to.equal(1);
            expect(li2.firstChild().toString()).to.equal('b');

            const li3 = list.children()[3] as ListNode;
            expect(li3.toString()).to.equal('ListNode: ' + ListType.ORDERED);
            expect(li3.listType).to.equal(ListType.ORDERED);
            expect(li3.children().length).to.equal(4);

            const li3_0 = li3.children()[0];
            expect(li3_0.toString()).to.equal('ParagraphNode');
            expect(li3_0.children().length).to.equal(3);
            expect(li3_0.children()[0].toString()).to.equal('b');
            expect(li3_0.children()[1].toString()).to.equal('.');
            expect(li3_0.children()[2].toString()).to.equal('1');

            const li3_1 = li3.children()[1];
            expect(li3_1.toString()).to.equal('ParagraphNode');
            expect(li3_1.children().length).to.equal(3);
            expect(li3_1.children()[0].toString()).to.equal('b');
            expect(li3_1.children()[1].toString()).to.equal('.');
            expect(li3_1.children()[2].toString()).to.equal('2');

            const li3_2 = li3.children()[2];
            expect(li3_2.toString()).to.equal('HeadingNode: 1');
            expect(li3_2.children().length).to.equal(3);
            expect(li3_2.children()[0].toString()).to.equal('b');
            expect(li3_2.children()[1].toString()).to.equal('.');
            expect(li3_2.children()[2].toString()).to.equal('3');

            const li3_3 = li3.children()[3];
            expect(li3_3.toString()).to.equal('ParagraphNode');
            expect(li3_3.children().length).to.equal(3);
            expect(li3_3.children()[0].toString()).to.equal('b');
            expect(li3_3.children()[1].toString()).to.equal('.');
            expect(li3_3.children()[2].toString()).to.equal('4');
            /* eslint-enable @typescript-eslint/camelcase */
        });
        it('should parse a list item with several blocks, inlines and whitespace', async () => {
            const element = document.createElement('div');
            /* eslint-disable prettier/prettier */
            element.innerHTML = [
                '<ol>\n',
                '    <li>\n',
                '        <h1>heading</h1> \n',
                '        <span>a \n',
                            '<a href="a"><sup><i><b>b</b></i></sup></a> \n',
                            '<a href="b"><sup><i><b>c</b></i></sup></a>',
                        '</span> \n',
                        '<span>d \n',
                            '<i>e</i> \n',
                            'f \n',
                            '<a href="c">g</a> \n',
                            '<a href="d"">h</a>',
                        '</span>',
                '    </li>',
                '</ol>'
            ].join('');
            /* eslint-enable prettier/prettier */
            const node = (await engine.parse(element))[0];

            expect(node.children().length).to.equal(1);
            const list = node.firstChild() as ListNode;
            expect(list.toString()).to.equal('ListNode: ' + ListType.ORDERED);
            expect(list.listType).to.equal(ListType.ORDERED);

            expect(list.children().length).to.equal(2);
            const headingLi = list.children()[0];
            expect(headingLi.toString()).to.equal('HeadingNode: 1');
            expect(headingLi.children().length).to.equal(7);
            expect(headingLi.children()[0].toString()).to.equal('h');
            expect(headingLi.children()[1].toString()).to.equal('e');
            expect(headingLi.children()[2].toString()).to.equal('a');
            expect(headingLi.children()[3].toString()).to.equal('d');
            expect(headingLi.children()[4].toString()).to.equal('i');
            expect(headingLi.children()[5].toString()).to.equal('n');
            expect(headingLi.children()[6].toString()).to.equal('g');

            const li = list.children()[1];
            expect(li.toString()).to.equal('ParagraphNode');
            expect(li.children().length).to.equal(15);

            function mapFormats(node: InlineNode): string[] {
                return node.formats.map(format => format.constructor.name);
            }

            expect(li.children()[0].toString()).to.equal('a');
            expect(mapFormats(li.children()[0] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[1].toString()).to.equal(' ');
            expect(mapFormats(li.children()[1] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[2].toString()).to.equal('b');
            expect(mapFormats(li.children()[2] as InlineNode)).to.deep.equal([
                'SpanFormat',
                'LinkFormat',
                'SuperscriptFormat',
                'ItalicFormat',
                'BoldFormat',
            ]);

            expect(li.children()[3].toString()).to.equal(' ');
            expect(mapFormats(li.children()[3] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[4].toString()).to.equal('c');
            expect(mapFormats(li.children()[4] as InlineNode)).to.deep.equal([
                'SpanFormat',
                'LinkFormat',
                'SuperscriptFormat',
                'ItalicFormat',
                'BoldFormat',
            ]);

            expect(li.children()[5].toString()).to.equal(' ');
            expect((li.children()[5] as InlineNode).formats).to.deep.equal([]);

            expect(li.children()[6].toString()).to.equal('d');
            expect(mapFormats(li.children()[6] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[7].toString()).to.equal(' ');
            expect(mapFormats(li.children()[7] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[8].toString()).to.equal('e');
            expect(mapFormats(li.children()[8] as InlineNode)).to.deep.equal([
                'SpanFormat',
                'ItalicFormat',
            ]);
            expect(li.children()[9].toString()).to.equal(' ');
            expect(mapFormats(li.children()[9] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[10].toString()).to.equal('f');
            expect(mapFormats(li.children()[10] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[11].toString()).to.equal(' ');
            expect(mapFormats(li.children()[11] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[12].toString()).to.equal('g');
            expect(mapFormats(li.children()[12] as InlineNode)).to.deep.equal([
                'SpanFormat',
                'LinkFormat',
            ]);

            expect(li.children()[13].toString()).to.equal(' ');
            expect(mapFormats(li.children()[13] as InlineNode)).to.deep.equal(['SpanFormat']);

            expect(li.children()[14].toString()).to.equal('h');
            expect(mapFormats(li.children()[14] as InlineNode)).to.deep.equal([
                'SpanFormat',
                'LinkFormat',
            ]);
        });
    });
    describe('toggleList', () => {
        describe('Range collapsed', () => {
            describe('Unordered', () => {
                describe('Insert', () => {
                    it('should turn an empty paragraph into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<ul><li>[]<br></li></ul>',
                        });
                    });
                    it('should turn a paragraph into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<ul><li>ab[]cd</li></ul>',
                        });
                    });
                    it('should turn a heading into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab[]cd</h1>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<ul><li><h1>ab[]cd</h1></li></ul>',
                        });
                    });
                    it('should turn a paragraph in a div into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>ab[]cd</p></div>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<div><ul><li>ab[]cd</li></ul></div>',
                        });
                    });
                    it('should turn a paragraph with formats into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</p>',
                            stepFunction: toggleUnorderedList,
                            contentAfter:
                                '<ul><li><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</li></ul>',
                        });
                    });
                });
                describe('Remove', () => {
                    it('should turn an empty list into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>[]<br></li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>[]<br></p>',
                        });
                    });
                    it('should turn a list into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab[]cd</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab[]cd</p>',
                        });
                    });
                    it('should turn a list into a heading', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li><h1>ab[]cd</h1></li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<h1>ab[]cd</h1>',
                        });
                    });
                    it('should turn a list item into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ul><li>cd</li><li>ef[]gh</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab</p><ul><li>cd</li></ul><p>ef[]gh</p>',
                        });
                    });
                    it('should turn a list with formats into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter:
                                '<p><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</p>',
                        });
                    });
                });
            });
            describe('Ordered', () => {
                describe('Insert', () => {
                    it('should turn an empty paragraph into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<ol><li>[]<br></li></ol>',
                        });
                    });
                    it('should turn a paragraph into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<ol><li>ab[]cd</li></ol>',
                        });
                    });
                    it('should turn a heading into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab[]cd</h1>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<ol><li><h1>ab[]cd</h1></li></ol>',
                        });
                    });
                    it('should turn a paragraph in a div into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>ab[]cd</p></div>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<div><ol><li>ab[]cd</li></ol></div>',
                        });
                    });
                    it('should turn a paragraph with formats into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</p>',
                            stepFunction: toggleOrderedList,
                            contentAfter:
                                '<ol><li><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</li></ol>',
                        });
                    });
                });
                describe('Remove', () => {
                    it('should turn an empty list into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>[]<br></li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>[]<br></p>',
                        });
                    });
                    it('should turn a list into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab[]cd</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab[]cd</p>',
                        });
                    });
                    it('should turn a list into a heading', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li><h1>ab[]cd</h1></li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<h1>ab[]cd</h1>',
                        });
                    });
                    it('should turn a list item into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ol><li>cd</li><li>ef[]gh</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab</p><ol><li>cd</li></ol><p>ef[]gh</p>',
                        });
                    });
                    it('should turn a list with formats into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ol><li><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter:
                                '<p><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</p>',
                        });
                    });
                });
            });
        });

        describe('Range not collapsed', () => {
            describe('Unordered', () => {
                describe('Insert', () => {
                    it('should turn a paragraph into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>cd[ef]gh</p>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab</p><ul><li>cd[ef]gh</li></ul>',
                        });
                    });
                    it('should turn a heading into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><h1>cd[ef]gh</h1>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab</p><ul><li><h1>cd[ef]gh</h1></li></ul>',
                        });
                    });
                    it('should turn two paragraphs into a list with two items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>cd[ef</p><p>gh]ij</p>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab</p><ul><li>cd[ef</li><li>gh]ij</li></ul>',
                        });
                    });
                    it('should turn two paragraphs in a div into a list with two items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>ab[cd</p><p>ef]gh</p></div>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<div><ul><li>ab[cd</li><li>ef]gh</li></ul></div>',
                        });
                    });
                    it('should turn a paragraph and a list item into two list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>a[b</p><ul><li>c]d</li><li>ef</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<ul><li>a[b</li><li>c]d</li><li>ef</li></ul>',
                        });
                    });
                    it('should turn a list item and a paragraph into two list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab</li><li>c[d</li></ul><p>e]f</p>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<ul><li>ab</li><li>c[d</li><li>e]f</li></ul>',
                        });
                    });
                    it('should turn a list, a paragraph and another list into one list with three list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>a[b</li></ul><p>cd</p><ul><li>e]f</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<ul><li>a[b</li><li>cd</li><li>e]f</li></ul>',
                        });
                    });
                    it('should turn a list item, a paragraph and another list into one list with all three as list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li>ab<li>c[d</li></ul><p>ef</p><ul><li>g]h</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<ul><li>ab</li><li>c[d</li><li>ef</li><li>g]h</li></ul>',
                        });
                    });
                    it('should turn a list, a paragraph and a list item into one list with all three as list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li>a[b</li></ul><p>cd</p><ul><li>e]f</li><li>gh</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<ul><li>a[b</li><li>cd</li><li>e]f</li><li>gh</li></ul>',
                        });
                    });
                });
                describe('Remove', () => {
                    it('should turn a list into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ul><li>cd[ef]gh</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab</p><p>cd[ef]gh</p>',
                        });
                    });
                    it('should turn a list into a heading', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ul><li><h1>cd[ef]gh</h1></li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab</p><h1>cd[ef]gh</h1>',
                        });
                    });
                    it('should turn a list into two paragraphs', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ul><li>cd[ef</li><li>gh]ij</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab</p><p>cd[ef</p><p>gh]ij</p>',
                        });
                    });
                    it('should turn a list item into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ul><li>cd</li><li>ef[gh]ij</li></ul>',
                            stepFunction: toggleUnorderedList,
                            contentAfter: '<p>ab</p><ul><li>cd</li></ul><p>ef[gh]ij</p>',
                        });
                    });
                });
            });
            describe('Ordered', () => {
                describe('Insert', () => {
                    it('should turn a paragraph into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>cd[ef]gh</p>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab</p><ol><li>cd[ef]gh</li></ol>',
                        });
                    });
                    it('should turn a heading into a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><h1>cd[ef]gh</h1>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab</p><ol><li><h1>cd[ef]gh</h1></li></ol>',
                        });
                    });
                    it('should turn two paragraphs into a list with two items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>cd[ef</p><p>gh]ij</p>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab</p><ol><li>cd[ef</li><li>gh]ij</li></ol>',
                        });
                    });
                    it('should turn two paragraphs in a div into a list with two items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>ab[cd</p><p>ef]gh</p></div>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<div><ol><li>ab[cd</li><li>ef]gh</li></ol></div>',
                        });
                    });
                    it('should turn a paragraph and a list item into two list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>a[b</p><ol><li>c]d</li><li>ef</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<ol><li>a[b</li><li>c]d</li><li>ef</li></ol>',
                        });
                    });
                    it('should turn a list item and a paragraph into two list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab</li><li>c[d</li></ol><p>e]f</p>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<ol><li>ab</li><li>c[d</li><li>e]f</li></ol>',
                        });
                    });
                    it('should turn a list, a paragraph and another list into one list with three list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>a[b</li></ol><p>cd</p><ol><li>e]f</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<ol><li>a[b</li><li>cd</li><li>e]f</li></ol>',
                        });
                    });
                    it('should turn a list item, a paragraph and another list into one list with all three as list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ol><li>ab<li>c[d</li></ol><p>ef</p><ol><li>g]h</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<ol><li>ab</li><li>c[d</li><li>ef</li><li>g]h</li></ol>',
                        });
                    });
                    it('should turn a list, a paragraph and a list item into one list with all three as list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ol><li>a[b</li></ol><p>cd</p><ol><li>e]f</li><li>gh</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<ol><li>a[b</li><li>cd</li><li>e]f</li><li>gh</li></ol>',
                        });
                    });
                });
                describe('Remove', () => {
                    it('should turn a list into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ol><li>cd[ef]gh</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab</p><p>cd[ef]gh</p>',
                        });
                    });
                    it('should turn a list into a heading', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ol><li><h1>cd[ef]gh</h1></li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab</p><h1>cd[ef]gh</h1>',
                        });
                    });
                    it('should turn a list into two paragraphs', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ol><li>cd[ef</li><li>gh]ij</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab</p><p>cd[ef</p><p>gh]ij</p>',
                        });
                    });
                    it('should turn a list item into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><ol><li>cd</li><li>ef[gh]ij</li></ol>',
                            stepFunction: toggleOrderedList,
                            contentAfter: '<p>ab</p><ol><li>cd</li></ol><p>ef[gh]ij</p>',
                        });
                    });
                });
            });
            describe('Mixed', () => {
                it('should turn an ordered list into an unordered list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ol><li>a[b]c</li></ol>',
                        stepFunction: toggleUnorderedList,
                        contentAfter: '<ul><li>a[b]c</li></ul>',
                    });
                });
                it('should turn an unordered list into an ordered list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>a[b]c</li></ul>',
                        stepFunction: toggleOrderedList,
                        contentAfter: '<ol><li>a[b]c</li></ol>',
                    });
                });
                it('should turn a paragraph and an unordered list item into an ordered list and an unordered list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[b</p><ul><li>c]d</li><li>ef</li></ul>',
                        stepFunction: toggleOrderedList,
                        contentAfter: '<ol><li>a[b</li><li>c]d</li></ol><ul><li>ef</li></ul>',
                    });
                });
                it('should turn a p, an ul list with ao. one nested ul, and another p into one ol with a nested ol', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <p>a[b</p>
                            <ul>
                                <li>cd</li>
                                <li style="list-style: none;">
                                    <ul>
                                        <li>ef</li>
                                    </ul>
                                </li>
                                <li>gh</li>
                            </ul>
                            <p>i]j</p>`),
                        stepFunction: toggleOrderedList,
                        contentAfter: unformat(`
                            <ol>
                                <li>a[b</li>
                                <li>cd</li>
                                <li style="list-style: none;">
                                    <ol>
                                        <li>ef</li>
                                    </ol>
                                </li>
                                <li>gh</li>
                                <li>i]j</li>
                            </ol>`),
                    });
                });
                it('should turn an unordered list item and a paragraph into two list items within an ordered list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>ab</li><li>c[d</li></ul><p>e]f</p>',
                        stepFunction: toggleOrderedList,
                        contentAfter: '<ul><li>ab</li></ul><ol><li>c[d</li><li>e]f</li></ol>',
                    });
                });
                it('should turn an unordered list, a paragraph and an ordered list into one ordered list with three list items', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>a[b</li></ul><p>cd</p><ol><li>e]f</li></ol>',
                        stepFunction: toggleOrderedList,
                        contentAfter: '<ol><li>a[b</li><li>cd</li><li>e]f</li></ol>',
                    });
                });
                it('should turn an unordered list item, a paragraph and an ordered list into one ordered list with all three as list items', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>ab<li>c[d</li></ul><p>ef</p><ol><li>g]h</li></ol>',
                        stepFunction: toggleOrderedList,
                        contentAfter:
                            '<ul><li>ab</li></ul><ol><li>c[d</li><li>ef</li><li>g]h</li></ol>',
                    });
                });
                it('should turn an ordered list, a paragraph and an unordered list item into one ordered list with all three as list items', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<ol><li>a[b</li></ol><p>cd</p><ul><li>e]f</li><li>gh</li></ul>',
                        stepFunction: toggleOrderedList,
                        contentAfter:
                            '<ol><li>a[b</li><li>cd</li><li>e]f</li></ol><ul><li>gh</li></ul>',
                    });
                });
                it('should turn an unordered list within an unordered list into an ordered list within an unordered list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul>
                                <li>ab</li>
                                <li style="list-style: none;">
                                    <ul>
                                        <li>c[d</li>
                                        <li>e]f</li>
                                    </ul>
                                </li>
                                <li>gh</li>
                            </ul>`),
                        stepFunction: toggleOrderedList,
                        contentAfter: unformat(`
                            <ul>
                                <li>ab</li>
                                <li style="list-style: none;">
                                    <ol>
                                        <li>c[d</li>
                                        <li>e]f</li>
                                    </ol>
                                </li>
                                <li>gh</li>
                            </ul>`),
                    });
                });
                it('should turn an unordered list with mixed nested elements into an ordered list with only unordered elements', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul>
                                <li>a[b</li>
                                <li>cd</li>
                                <li style="list-style: none;">
                                    <ul>
                                        <li>ef</li>
                                        <li>gh</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>ij</li>
                                                <li>kl</li>
                                                <li style="list-style: none;">
                                                    <ul>
                                                        <li>mn</li>
                                                    </ul>
                                                </li>
                                                <li>op</li>
                                            </ol>
                                        </li>
                                    </ul>
                                </li>
                                <li>q]r</li>
                                <li>st</li>
                            </ul>`),
                        stepFunction: toggleOrderedList,
                        contentAfter: unformat(`
                            <ol>
                                <li>a[b</li>
                                <li>cd</li>
                                <li style="list-style: none;">
                                    <ol>
                                        <li>ef</li>
                                        <li>gh</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>ij</li>
                                                <li>kl</li>
                                                <li style="list-style: none;">
                                                    <ol>
                                                        <li>mn</li>
                                                    </ol>
                                                </li>
                                                <li>op</li>
                                            </ol>
                                        </li>
                                    </ol>
                                </li>
                                <li>q]r</li>
                            </ol>
                            <ul>
                                <li>st</li>
                            </ul>`),
                    });
                });
            });
        });
    });
    describe('VDocument', () => {
        describe('deleteForward', () => {
            describe('Selection collapsed', () => {
                describe('Basic', () => {
                    it('should do nothing', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>[]<br></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>[]<br></li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li style="list-style: none;"><ul><li>abc[]</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul><li style="list-style: none;"><ul><li>abc[]</li></ul></li></ul>',
                        });
                    });
                    it('should delete the first character in a list item', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>abc</li><li>[]defg</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>abc</li><li>[]efg</li></ul>',
                        });
                    });
                    it('should delete a character within a list item', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>abc</li><li>de[]fg</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>abc</li><li>de[]g</li></ul>',
                        });
                    });
                    it('should delete the last character in a list item', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>abc</li><li>def[]g</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>abc</li><li>def[]</li></ul>',
                        });
                    });
                    it('should remove the only character in a list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>[]a</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>[]<br></li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li><p>[]a</p></li></ul>',
                            stepFunction: deleteForward,
                            // Paragraphs in list items are treated as nonsense.
                            contentAfter: '<ul><li>[]<br></li></ul>',
                        });
                    });
                    it('should merge a list item with its next list item', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>abc[]</li><li>def</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>abc[]def</li></ul>',
                        });
                        // With another list item before.
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>abc</li><li>def[]</li><li>ghi</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>abc</li><li>def[]ghi</li></ul>',
                        });
                        // Where the list item to merge into is empty, with an
                        // empty list item before.
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li><br></li><li>[]<br></li><li>abc</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li><br></li><li>[]abc</li></ul>',
                        });
                    });
                    it('should rejoin sibling lists', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>a[]</li></ul><p>b</p><ul><li>c</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>a[]b</li><li>c</li></ul>',
                        });
                    });
                    it('should rejoin multi-level sibling lists', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b[]</li>
                                            </ul>
                                        </li>
                                    </ul>
                                    <p>c</p>
                                    <ul>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                            stepFunction: deleteForward,
                            contentAfter: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b[]c</li>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                        });
                    });
                    it('should only rejoin same-level lists', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: unformat(`
                                    <ol>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>b</li>
                                            </ol>
                                        </li>
                                        <li>c[]</li>
                                    </ol>
                                    <p>d</p>
                                    <ol>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>e</li>
                                            </ol>
                                        </li>
                                        <li>f</li>
                                    </ol>`),
                            stepFunction: deleteForward,
                            contentAfter: unformat(`
                                    <ol>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>b</li>
                                            </ol>
                                        </li>
                                        <li>c[]d</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>e</li>
                                            </ol>
                                        </li>
                                        <li>f</li>
                                    </ol>`),
                        });
                    });
                    it('should not convert mixed lists on rejoin', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>a[]</li></ol><p>b</p><ul><li>c</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>a[]b</li></ol><ul><li>c</li></ul>',
                        });
                    });
                    it('should not convert mixed multi-level lists on rejoin', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: unformat(`
                                    <ol>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b[]</li>
                                            </ul>
                                        </li>
                                    </ol>
                                    <p>c</p>
                                    <ul>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                            stepFunction: deleteForward,
                            contentAfter: unformat(`
                                    <ol>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b[]c</li>
                                            </ul>
                                        </li>
                                    </ol>
                                    <ul>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                        });
                    });
                });
                describe('Indented', () => {
                    it('should merge an indented list item into a non-indented list item', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ol><li>abc[]</li><li style="list-style: none;"><ol><li>def</li><li>ghi</li></ol></li></ol>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ol><li>abc[]def</li><li style="list-style: none;"><ol><li>ghi</li></ol></li></ol>',
                        });
                    });
                    it('should merge a non-indented list item into an indented list item', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li style="list-style: none;"><ul><li>abc[]</li></ul></li><li>def</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul><li style="list-style: none;"><ul><li>abc[]def</li></ul></li></ul>',
                        });
                    });
                    it('should merge the only item in an indented list into a non-indented list item and remove the now empty indented list', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li>abc[]</li><li style="list-style: none;"><ul><li>def</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>abc[]def</li></ul>',
                        });
                    });
                });
                describe('Complex merges', () => {
                    it('should merge a list item into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p><ul><li>ef</li><li>gh</li></ul>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab[]f</p><ul><li>gh</li></ul>',
                        });
                    });
                    it('should merge a paragraph into a list item', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>abc[]</li></ul><p>def</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>abc[]def</li></ul>',
                        });
                    });
                    it('should treat two blocks in a list item as two list items and merge them', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li><p>abc</p></li><li><p>def[]</p><p>ghi</p></li><li><p>klm</p></li></ul>',
                            stepFunction: deleteForward,
                            // Paragraphs in list items are treated as nonsense.
                            contentAfter: '<ul><li>abc</li><li>def[]ghi</li><li>klm</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li><h1>abc</h1></li><li><h2>def[]</h2><h3>ghi</h3></li><li><h4>klm</h4></li></ul>',
                            stepFunction: deleteForward,
                            // Paragraphs in list items are treated as nonsense.
                            // Headings aren't, as they do provide extra information.
                            contentAfter:
                                '<ul><li><h1>abc</h1></li><li><h2>def[]ghi</h2></li><li><h4>klm</h4></li></ul>',
                        });
                    });
                    it('should merge a bold list item into a non-formatted list item', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li>abc</li><li><b>de</b>fg[]</li><li><b>hij</b>klm</li><li>nop</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul><li>abc</li><li><b>de</b>fg[]<b>hij</b>klm</li><li>nop</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li><p>abc</p></li><li><p><b>de</b>fg[]</p><p><b>hij</b>klm</p></li><li><p>nop</p></li></ul>',
                            stepFunction: deleteForward,
                            // Two paragraphs in a list item = Two list items.
                            // Paragraphs in list items are treated as nonsense.
                            contentAfter:
                                '<ul><li>abc</li><li><b>de</b>fg[]<b>hij</b>klm</li><li>nop</li></ul>',
                        });
                    });
                    it('should merge a paragraph starting with bold text into a list item with ending without formatting', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li><i>abc</i>def[]</li></ul><p><b>ghi</b>jkl</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li><i>abc</i>def[]<b>ghi</b>jkl</li></ul>',
                        });
                    });
                    it('should merge a paragraph starting with bold text into a list item with ending with italic text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li><b>abc</b><i>def[]</i></li></ul><p><b>ghi</b>jkl</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li><b>abc</b><i>def[]</i><b>ghi</b>jkl</li></ul>',
                        });
                    });
                });
            });
            describe('Selection not collapsed', () => {
                // Note: All tests on ordered lists should be duplicated
                // with unordered lists, and vice versa.
                describe('Ordered', () => {
                    it('should delete text within a list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab[cd]ef</li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>ab[]ef</li></ol>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab]cd[ef</li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>ab[]ef</li></ol>',
                        });
                    });
                    it('should delete all the text in a list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>[abc]</li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>[]<br></li></ol>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>]abc[</li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>[]<br></li></ol>',
                        });
                    });
                    it('should delete across two list items', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab[cd</li><li>ef]gh</li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>ab[]gh</li></ol>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab]cd</li><li>ef[gh</li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>ab[]gh</li></ol>',
                        });
                    });
                    it('should delete across an unindented list item and an indented list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ol><li>ab[cd</li><li style="list-style: none;"><ol><li>ef]gh</li></ol></li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>ab[]gh</li></ol>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ol><li>ab]cd</li><li style="list-style: none;"><ol><li>ef[gh</li></ol></li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<ol><li>ab[]gh</li></ol>',
                        });
                    });
                    it('should delete a list', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[</p><ol><li><p>def]</p></li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc]</p><ol><li><p>def[</p></li></ol>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                    });
                    it('should merge the contents of a list item within a divider into a heading, and leave the rest of its list as it is', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ol><li>fg</li><li>h]i</li><li>jk</li></ol></div>',
                            stepFunction: deleteForward,
                            contentAfter: '<h1>a[]i</h1><div><ol><li>jk</li></ol></div>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ol><li>fg</li><li>h[i</li><li>jk</li></ol></div>',
                            stepFunction: deleteForward,
                            contentAfter: '<h1>a[]i</h1><div><ol><li>jk</li></ol></div>',
                        });
                    });
                });
                describe('Unordered', () => {
                    it('should delete text within a list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab[cd]ef</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>ab[]ef</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab]cd[ef</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>ab[]ef</li></ul>',
                        });
                    });
                    it('should delete all the text in a list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>[abc]</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>[]<br></li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>]abc[</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>[]<br></li></ul>',
                        });
                    });
                    it('should delete across two list items', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab[cd</li><li>ef]gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>ab[]gh</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab]cd</li><li>ef[gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>ab[]gh</li></ul>',
                        });
                    });
                    it('should delete across an unindented list item and an indented list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li>ab[cd</li><li style="list-style: none;"><ul><li>ef]gh</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>ab[]gh</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li>ab]cd</li><li style="list-style: none;"><ul><li>ef[gh</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<ul><li>ab[]gh</li></ul>',
                        });
                    });
                    it('should delete a list', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[</p><ul><li><p>def]</p></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc]</p><ul><li><p>def[</p></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                    });
                    it('should merge the contents of a list item within a divider into a heading, and leave the rest of its list as it is', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ul><li>fg</li><li>h]i</li><li>jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter: '<h1>a[]i</h1><div><ul><li>jk</li></ul></div>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ul><li>fg</li><li>h[i</li><li>jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter: '<h1>a[]i</h1><div><ul><li>jk</li></ul></div>',
                        });
                    });
                });
                describe('Mixed', () => {
                    describe('Ordered to unordered', () => {
                        it('should delete across an ordered list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>ab[cd</li></ol><ul><li>ef]gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>ab]cd</li></ol><ul><li>ef[gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                        });
                        it('should delete across an ordered list item and an unordered list item within an ordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>ab[cd</li><li style="list-style: none;"><ul><li>ef]gh</li></ul></li></ol>',
                                stepFunction: deleteForward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>ab]cd</li><li style="list-style: none;"><ul><li>ef[gh</li></ul></li></ol>',
                                stepFunction: deleteForward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                        });
                        it('should delete an ordered list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[</p><ul><li>cd</li></ul><ol><li>ef]</li></ol>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]</p>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab]</p><ul><li>cd</li></ul><ol><li>ef[</li></ol>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]</p>',
                            });
                        });
                    });
                    describe('Unordered to ordered', () => {
                        it('should delete across an unordered list and an ordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>ab[cd</li></ul><ol><li>ef]gh</li></ol>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>ab]cd</li></ul><ol><li>ef[gh</li></ol>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                        });
                        it('should delete across an unordered list item and an ordered list item within an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab[cd</li><li style="list-style: none;"><ol><li>ef]gh</li></ol></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab]cd</li><li style="list-style: none;"><ol><li>ef[gh</li></ol></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                        });
                        it('should delete an ordered list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[</p><ol><li>cd</li></ol><ul><li>ef]</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]</p>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab]</p><ol><li>cd</li></ol><ul><li>ef[</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]</p>',
                            });
                        });
                    });
                });
            });
        });
        describe('deleteBackward', () => {
            describe('Selection collapsed', () => {
                // Note: All tests on ordered lists should be duplicated
                // with unordered lists, and vice versa.
                describe('Ordered', () => {
                    describe('Basic', () => {
                        it('should do nothing', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li><br>[]</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>[]<br></li></ol>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li style="list-style: none;"><ol><li>[]abc</li></ol></li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ol><li style="list-style: none;"><ol><li>[]abc</li></ol></li></ol>',
                            });
                        });
                        it('should delete the first character in a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>abc</li><li>d[]efg</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>abc</li><li>[]efg</li></ol>',
                            });
                        });
                        it('should delete a character within a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>abc</li><li>de[]fg</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>abc</li><li>d[]fg</li></ol>',
                            });
                        });
                        it('should delete the last character in a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>abc</li><li>defg[]</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>abc</li><li>def[]</li></ol>',
                            });
                        });
                        it('should remove the only character in a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>a[]</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>[]<br></li></ol>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li><p>a[]</p></li></ol>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ol><li>[]<br></li></ol>',
                            });
                        });
                        it('should merge a list item with its previous list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>abc</li><li>[]def</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>abc[]def</li></ol>',
                            });
                            // With another list item after.
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>abc</li><li>[]def</li><li>ghi</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>abc[]def</li><li>ghi</li></ol>',
                            });
                            // Where the list item to merge into is empty, with an
                            // empty list item before.
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li><br></li><li><br></li><li>[]abc</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li><br></li><li>[]abc</li></ol>',
                            });
                        });
                        it('should rejoin sibling lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>a</li></ol><p>[]b</p><ol><li>c</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>a[]b</li><li>c</li></ol>',
                            });
                        });
                        it('should rejoin multi-level sibling lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b</li>
                                            </ul>
                                        </li>
                                    </ul>
                                    <p>[]c</p>
                                    <ul>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b[]c</li>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                            });
                        });
                        it('should only rejoin same-level lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ol>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>b</li>
                                            </ol>
                                        </li>
                                        <li>c</li>
                                    </ol>
                                    <p>[]d</p>
                                    <ol>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>e</li>
                                            </ol>
                                        </li>
                                        <li>f</li>
                                    </ol>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ol>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>b</li>
                                            </ol>
                                        </li>
                                        <li>c[]d</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>e</li>
                                            </ol>
                                        </li>
                                        <li>f</li>
                                    </ol>`),
                            });
                        });
                        it('should not convert mixed lists on rejoin', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>a</li></ol><p>[]b</p><ul><li>c</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>a[]b</li></ol><ul><li>c</li></ul>',
                            });
                        });
                        it('should not convert mixed multi-level lists on rejoin', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ol>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b</li>
                                            </ul>
                                        </li>
                                    </ol>
                                    <p>[]c</p>
                                    <ul>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ol>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b[]c</li>
                                            </ul>
                                        </li>
                                    </ol>
                                    <ul>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                            });
                        });
                    });
                    describe('Indented', () => {
                        it('should merge an indented list item into a non-indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li style="list-style: none;"><ol><li>[]def</li><li>ghi</li></ol></li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ol><li>abc[]def</li><li style="list-style: none;"><ol><li>ghi</li></ol></li></ol>',
                            });
                        });
                        it('should merge a non-indented list item into an indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li style="list-style: none;"><ol><li>abc</li></ol></li><li>[]def</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ol><li style="list-style: none;"><ol><li>abc[]def</li></ol></li></ol>',
                            });
                        });
                        it('should merge the only item in an indented list into a non-indented list item and remove the now empty indented list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li style="list-style: none;"><ol><li>[]def</li></ol></li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>abc[]def</li></ol>',
                            });
                        });
                        it('should outdent a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li style="list-style: none;"><ol><li>[]abc</li></ol></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<ol><li>[]abc</li></ol>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abc</p><ol><li style="list-style: none;"><ol><li>[]def</li></ol></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<p>abc</p><ol><li>[]def</li></ol>',
                            });
                        });
                        it('should outdent while nested within a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li><div>abc</div></li><li><div><div>[]def</div></div></li></ol>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ol><li><div>abc</div></li></ol><div><div>[]def</div></div>',
                            });
                            // With a div before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<div>abc</div><ol><li><div><div>[]def</div></div></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<div>abc</div><div><div>[]def</div></div>',
                            });
                        });
                        it('should outdent an empty list item within a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li style="list-style: none;"><ol><li>[]<br></li><li><br></li></ol></li><li>def</li></ol>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ol><li>abc</li><li>[]<br></li><li style="list-style: none;"><ol><li><br></li></ol></li><li>def</li></ol>',
                            });
                        });
                        it('should outdent an empty list within a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li style="list-style: none;"><ol><li>[]<br></li></ol></li><li>def</li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<ol><li>abc</li><li>[]<br></li><li>def</li></ol>',
                            });
                        });
                        it('should outdent an empty list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li style="list-style: none;"><ol><li><br>[]</li></ol></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<ol><li>[]<br></li></ol>',
                            });
                        });
                        it("should outdent a list to the point that it's a paragraph", async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>[]<br></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<p>[]<br></p>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore: '<p><br></p><ol><li>[]<br></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<p><br></p><p>[]<br></p>',
                            });
                        });
                    });
                    describe('Complex merges', () => {
                        it('should merge a list item into a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>abcd</p><ol><li>ef[]gh</li><li>ij</li></ol>',
                                stepFunction: async (editor: JWEditor) => {
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                },
                                contentAfter: '<p>abc[]gh</p><ol><li>ij</li></ol>',
                            });
                        });
                        it('should merge a paragraph into a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>abc</li></ol><p>[]def</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>abc[]def</li></ol>',
                            });
                        });
                        it('should treat two blocks in a list item as two list items and merge them', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li><p>abc</p></li><li><p>def</p><p>[]ghi</p></li><li><p>klm</p></li></ol>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ol><li>abc</li><li>def[]ghi</li><li>klm</li></ol>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li><h1>abc</h1></li><li><h2>def</h2><h3>[]ghi</h3></li><li><h4>klm</h4></li></ol>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                // Headings aren't, as they do provide extra information.
                                contentAfter:
                                    '<ol><li><h1>abc</h1></li><li><h2>def[]ghi</h2></li><li><h4>klm</h4></li></ol>',
                            });
                        });
                        it('should merge a bold list item into a non-formatted list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li><b>de</b>fg</li><li><b>[]hij</b>klm</li><li>nop</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ol><li>abc</li><li><b>de</b>fg[]<b>hij</b>klm</li><li>nop</li></ol>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li><p>abc</p></li><li><p><b>de</b>fg</p><p><b>[]hij</b>klm</p></li><li><p>nop</p></li></ol>',
                                stepFunction: deleteBackward,
                                // Two paragraphs in a list item = Two list items.
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ol><li>abc</li><li><b>de</b>fg[]<b>hij</b>klm</li><li>nop</li></ol>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a list item with ending without formatting', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li><i>abc</i>def</li></ol><p><b>[]ghi</b>jkl</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li><i>abc</i>def[]<b>ghi</b>jkl</li></ol>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a list item with ending with italic text', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li><b>abc</b><i>def</i></li></ol><p><b>[]ghi</b>jkl</p>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ol><li><b>abc</b><i>def[]</i><b>ghi</b>jkl</li></ol>',
                            });
                        });
                    });
                });
                describe('Unordered', () => {
                    describe('Basic', () => {
                        it('should do nothing', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li><br>[]</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>[]<br></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ul><li>[]abc</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul><li style="list-style: none;"><ul><li>[]abc</li></ul></li></ul>',
                            });
                        });
                        it('should delete the first character in a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>abc</li><li>d[]efg</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc</li><li>[]efg</li></ul>',
                            });
                        });
                        it('should delete a character within a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>abc</li><li>de[]fg</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc</li><li>d[]fg</li></ul>',
                            });
                        });
                        it('should delete the last character in a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>abc</li><li>defg[]</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc</li><li>def[]</li></ul>',
                            });
                        });
                        it('should remove the only character in a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>a[]</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>[]<br></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li><p>a[]</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ul><li>[]<br></li></ul>',
                            });
                        });
                        it('should merge a list item with its previous list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>abc</li><li>[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc[]def</li></ul>',
                            });
                            // With another list item after.
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>abc</li><li>[]def</li><li>ghi</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc[]def</li><li>ghi</li></ul>',
                            });
                            // Where the list item to merge into is empty, with an
                            // empty list item before.
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li><br></li><li><br></li><li>[]abc</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li><br></li><li>[]abc</li></ul>',
                            });
                        });
                        it('should rejoin sibling lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>a</li></ul><p>[]b</p><ul><li>c</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>a[]b</li><li>c</li></ul>',
                            });
                        });
                        it('should rejoin multi-level sibling lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b</li>
                                            </ul>
                                        </li>
                                    </ul>
                                    <p>[]c</p>
                                    <ul>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b[]c</li>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ul>`),
                            });
                        });
                        it('should only rejoin same-level lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b</li>
                                            </ul>
                                        </li>
                                        <li>c</li>
                                    </ul>
                                    <p>[]d</p>
                                    <ul>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>e</li>
                                            </ul>
                                        </li>
                                        <li>f</li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b</li>
                                            </ul>
                                        </li>
                                        <li>c[]d</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>e</li>
                                            </ul>
                                        </li>
                                        <li>f</li>
                                    </ul>`),
                            });
                        });
                        it('should not convert mixed lists on rejoin', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>a</li></ul><p>[]b</p><ol><li>c</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>a[]b</li></ul><ol><li>c</li></ol>',
                            });
                        });
                        it('should not convert mixed multi-level lists on rejoin', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>b</li>
                                            </ol>
                                        </li>
                                    </ul>
                                    <p>[]c</p>
                                    <ol>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ol>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul>
                                        <li>a</li>
                                        <li style="list-style: none;">
                                            <ol>
                                                <li>b[]c</li>
                                            </ol>
                                        </li>
                                    </ul>
                                    <ol>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>d</li>
                                            </ul>
                                        </li>
                                        <li>e</li>
                                    </ol>`),
                            });
                        });
                    });
                    describe('Indented', () => {
                        it('should merge an indented list item into a non-indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul>
                                        <li>abc</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>[]def</li>
                                                <li>ghi</li>
                                            </ul>
                                        </li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul>
                                        <li>abc[]def</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>ghi</li>
                                            </ul>
                                        </li>
                                    </ul>`),
                            });
                        });
                        it('should merge a non-indented list item into an indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ul><li>abc</li></ul></li><li>[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul><li style="list-style: none;"><ul><li>abc[]def</li></ul></li></ul>',
                            });
                        });
                        it('should merge the only item in an indented list into a non-indented list item and remove the now empty indented list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul><li>[]def</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc[]def</li></ul>',
                            });
                        });
                        it('should outdent a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ul><li>[]abc</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>[]abc</li></ul>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abc</p><ul><li style="list-style: none;"><ul><li>[]def</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<p>abc</p><ul><li>[]def</li></ul>',
                            });
                        });
                        it('should outdent an empty list item within a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul><li>[]<br></li><li><br></li></ul></li><li>def</li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul><li>abc</li><li>[]<br></li><li style="list-style: none;"><ul><li><br></li></ul></li><li>def</li></ul>',
                            });
                        });
                        it('should outdent an empty list within a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul><li>[]<br></li></ul></li><li>def</li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>abc</li><li>[]<br></li><li>def</li></ul>',
                            });
                        });
                        it('should outdent an empty list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ul><li><br>[]</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>[]<br></li></ul>',
                            });
                        });
                        it("should outdent a list to the point that it's a paragraph", async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>[]<br></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<p>[]<br></p>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore: '<p><br></p><ul><li>[]<br></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<p><br></p><p>[]<br></p>',
                            });
                        });
                    });
                    describe('Complex merges', () => {
                        it('should merge a list item into a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>abcd</p><ul><li>ef[]gh</li><li>ij</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                },
                                contentAfter: '<p>abc[]gh</p><ul><li>ij</li></ul>',
                            });
                        });
                        it('should merge a paragraph into a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>abc</li></ul><p>[]def</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc[]def</li></ul>',
                            });
                        });
                        it('should treat two blocks in a list item as two list items and merge them', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><p>abc</p></li><li><p>def</p><p>[]ghi</p></li><li><p>klm</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ul><li>abc</li><li>def[]ghi</li><li>klm</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><h1>abc</h1></li><li><h2>def</h2><h3>[]ghi</h3></li><li><h4>klm</h4></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                // Headings aren't, as they do provide extra information.
                                contentAfter:
                                    '<ul><li><h1>abc</h1></li><li><h2>def[]ghi</h2></li><li><h4>klm</h4></li></ul>',
                            });
                        });
                        it('should merge a bold list item into a non-formatted list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li><b>de</b>fg</li><li><b>[]hij</b>klm</li><li>nop</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul><li>abc</li><li><b>de</b>fg[]<b>hij</b>klm</li><li>nop</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><p>abc</p></li><li><p><b>de</b>fg</p><p><b>[]hij</b>klm</p></li><li><p>nop</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Two paragraphs in a list item = Two list items.
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul><li>abc</li><li><b>de</b>fg[]<b>hij</b>klm</li><li>nop</li></ul>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a list item with ending without formatting', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><i>abc</i>def</li></ul><p><b>[]ghi</b>jkl</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li><i>abc</i>def[]<b>ghi</b>jkl</li></ul>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a list item with ending with italic text', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><b>abc</b><i>def</i></li></ul><p><b>[]ghi</b>jkl</p>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul><li><b>abc</b><i>def[]</i><b>ghi</b>jkl</li></ul>',
                            });
                        });
                    });
                });
                describe('Mixed', () => {
                    describe('Ordered to unordered', () => {
                        it('should merge an ordered list into an unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>a</li></ul><ol><li>[]b</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>a</li></ul><ol><li><p>[]b</p></li></ol>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ul><li>a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li><p>a</p></li></ul><ol><li>[]b</li></ol>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ul><li>a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><p>a</p></li></ul><ol><li><p>[]b</p></li></ol>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ul><li>a[]b</li></ul>',
                            });
                        });
                        it('should merge an ordered list item that is in an unordered list item into a non-indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ol><li>[]def</li><li>ghi</li></ol></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul><li>abc[]def</li><li style="list-style: none;"><ol><li>ghi</li></ol></li></ul>',
                            });
                        });
                        it('should merge an ordered list item into an unordered list item that is in the same ordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li style="list-style: none;"><ul><li>abc</li></ul></li><li>[]def</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ol><li style="list-style: none;"><ul><li>abc[]def</li></ul></li></ol>',
                            });
                        });
                        it('should merge the only item in an ordered list that is in an unordered list into a list item that is in the same unordered list, and remove the now empty ordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ol><li>[]def</li></ol></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc[]def</li></ul>',
                            });
                        });
                        it('should outdent an ordered list item that is within a unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ol><li>[]abc</li></ol></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>[]abc</li></ul>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abc</p><ul><li style="list-style: none;"><ol><li>[]def</li></ol></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<p>abc</p><ul><li>[]def</li></ul>',
                            });
                        });
                        it('should outdent an empty ordered list item within an unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ol><li>[]<br></li><li><br></li></ol></li><li>def</li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul><li>abc</li><li>[]<br></li><li style="list-style: none;"><ol><li><br></li></ol></li><li>def</li></ul>',
                            });
                        });
                        it('should outdent an empty ordered list within an unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ol><li>[]<br></li></ol></li><li>def</li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>abc</li><li>[]<br></li><li>def</li></ul>',
                            });
                        });
                        it('should outdent an empty ordered list within an unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ol><li><br>[]</li></ol></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>[]<br></li></ul>',
                            });
                        });
                    });
                    describe('Unordered to ordered', () => {
                        it('should merge an unordered list into an ordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>a</li></ol><ul><li>[]b</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>a[]b</li></ol>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>a</li></ol><ul><li><p>[]b</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ol><li>a[]b</li></ol>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li><p>a</p></li></ol><ul><li>[]b</li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ol><li>a[]b</li></ol>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li><p>a</p></li></ol><ul><li><p>[]b</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ol><li>a[]b</li></ol>',
                            });
                        });
                        it('should merge an unordered list item that is in an ordered list item into a non-indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ol>
                                        <li>abc</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>[]def</li>
                                                <li>ghi</li>
                                            </ul>
                                        </li>
                                    </ol>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ol>
                                        <li>abc[]def</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>ghi</li>
                                            </ul>
                                        </li>
                                    </ol>`),
                            });
                        });
                        it('should merge an unordered list item into an ordered list item that is in the same unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ol><li>abc</li></ol></li><li>[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul><li style="list-style: none;"><ol><li>abc[]def</li></ol></li></ul>',
                            });
                        });
                        it('should merge the only item in an unordered list that is in an ordered list into a list item that is in the same ordered list, and remove the now empty unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li style="list-style: none;"><ul><li>[]def</li></ul></li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>abc[]def</li></ol>',
                            });
                        });
                        it('should outdent an unordered list item that is within a ordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li style="list-style: none;"><ul><li>[]abc</li></ul></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<ol><li>[]abc</li></ol>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abc</p><ol><li style="list-style: none;"><ul><li>[]def</li></ul></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<p>abc</p><ol><li>[]def</li></ol>',
                            });
                        });
                        it('should outdent an empty unordered list item within an ordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li style="list-style: none;"><ul><li>[]<br></li><li><br></li></ul></li><li>def</li></ol>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ol><li>abc</li><li>[]<br></li><li style="list-style: none;"><ul><li><br></li></ul></li><li>def</li></ol>',
                            });
                        });
                        it('should outdent an empty unordered list within an ordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li style="list-style: none;"><ul><li>[]<br></li></ul></li><li>def</li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<ol><li>abc</li><li>[]<br></li><li>def</li></ol>',
                            });
                        });
                        it('should outdent an empty unordered list within an ordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li style="list-style: none;"><ul><li><br>[]</li></ul></li></ol>',
                                stepFunction: backspace,
                                contentAfter: '<ol><li>[]<br></li></ol>',
                            });
                        });
                    });
                });
            });
            describe('Selection not collapsed', () => {
                // Note: All tests on ordered lists should be duplicated
                // with unordered lists, and vice versa.
                describe('Ordered', () => {
                    it('should delete text within a list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab[cd]ef</li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ol><li>ab[]ef</li></ol>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab]cd[ef</li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ol><li>ab[]ef</li></ol>',
                        });
                    });
                    it('should delete all the text in a list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>[abc]</li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ol><li>[]<br></li></ol>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>]abc[</li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ol><li>[]<br></li></ol>',
                        });
                    });
                    it('should delete across two list items', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab[cd</li><li>ef]gh</li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ol><li>ab[]gh</li></ol>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ol><li>ab]cd</li><li>ef[gh</li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ol><li>ab[]gh</li></ol>',
                        });
                    });
                    it('should delete across an unindented list item and an indented list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ol><li>ab[cd</li><li style="list-style: none;"><ol><li>ef]gh</li></ol></li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ol><li>ab[]gh</li></ol>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ol><li>ab]cd</li><li style="list-style: none;"><ol><li>ef[gh</li></ol></li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ol><li>ab[]gh</li></ol>',
                        });
                    });
                    it('should delete a list', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[</p><ol><li><p>def]</p></li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc]</p><ol><li><p>def[</p></li></ol>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc[]</p>',
                        });
                    });
                    it('should merge the contents of a list item within a divider into a heading, and leave the rest of its list as it is', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ol><li>fg</li><li>h]i</li><li>jk</li></ol></div>',
                            stepFunction: deleteBackward,
                            contentAfter: '<h1>a[]i</h1><div><ol><li>jk</li></ol></div>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ol><li>fg</li><li>h[i</li><li>jk</li></ol></div>',
                            stepFunction: deleteBackward,
                            contentAfter: '<h1>a[]i</h1><div><ol><li>jk</li></ol></div>',
                        });
                    });
                });
                describe('Unordered', () => {
                    it('should delete text within a list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab[cd]ef</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ul><li>ab[]ef</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab]cd[ef</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ul><li>ab[]ef</li></ul>',
                        });
                    });
                    it('should delete all the text in a list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>[abc]</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ul><li>[]<br></li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>]abc[</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ul><li>[]<br></li></ul>',
                        });
                    });
                    it('should delete across two list items', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab[cd</li><li>ef]gh</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ul><li>ab[]gh</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<ul><li>ab]cd</li><li>ef[gh</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ul><li>ab[]gh</li></ul>',
                        });
                    });
                    it('should delete across an unindented list item and an indented list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li>ab[cd</li><li style="list-style: none;"><ul><li>ef]gh</li></ul></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ul><li>ab[]gh</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul><li>ab]cd</li><li style="list-style: none;"><ul><li>ef[gh</li></ul></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<ul><li>ab[]gh</li></ul>',
                        });
                    });
                    it('should delete a list', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[</p><ul><li><p>def]</p></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc]</p><ul><li><p>def[</p></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc[]</p>',
                        });
                    });
                    it('should merge the contents of a list item within a divider into a heading, and leave the rest of its list as it is', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ul><li>fg</li><li>h]i</li><li>jk</li></ul></div>',
                            stepFunction: deleteBackward,
                            contentAfter: '<h1>a[]i</h1><div><ul><li>jk</li></ul></div>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ul><li>fg</li><li>h[i</li><li>jk</li></ul></div>',
                            stepFunction: deleteBackward,
                            contentAfter: '<h1>a[]i</h1><div><ul><li>jk</li></ul></div>',
                        });
                    });
                });
                describe('Mixed', () => {
                    describe('Ordered to unordered', () => {
                        it('should delete across an ordered list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>ab[cd</li></ol><ul><li>ef]gh</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>ab]cd</li></ol><ul><li>ef[gh</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                        });
                        it('should delete across an ordered list item and an unordered list item within an ordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>ab[cd</li><li style="list-style: none;"><ul><li>ef]gh</li></ul></li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>ab]cd</li><li style="list-style: none;"><ul><li>ef[gh</li></ul></li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                        });
                        it('should delete an ordered list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[</p><ul><li>cd</li></ul><ol><li>ef]</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]</p>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab]</p><ul><li>cd</li></ul><ol><li>ef[</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]</p>',
                            });
                        });
                    });
                    describe('Unordered to ordered', () => {
                        it('should delete across an unordered list and an ordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>ab[cd</li></ul><ol><li>ef]gh</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>ab]cd</li></ul><ol><li>ef[gh</li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                        });
                        it('should delete across an unordered list item and an ordered list item within an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab[cd</li><li style="list-style: none;"><ol><li>ef]gh</li></ol></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab]cd</li><li style="list-style: none;"><ol><li>ef[gh</li></ol></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                        });
                        it('should delete an ordered list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[</p><ol><li>cd</li></ol><ul><li>ef]</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]</p>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab]</p><ol><li>cd</li></ol><ul><li>ef[</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]</p>',
                            });
                        });
                    });
                });
            });
        });
        describe('insertParagraphBreak', () => {
            describe('Selection collapsed', () => {
                describe('Ordered', () => {
                    describe('Basic', () => {
                        it('should add an empty list item before a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>[]abc</li></ol>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<ol><li><br></li><li>[]abc</li></ol>',
                            });
                        });
                        it('should split a list item in two', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>ab[]cd</li></ol>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<ol><li>ab</li><li>[]cd</li></ol>',
                            });
                        });
                        it('should add an empty list item after a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>abc[]</li></ol>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<ol><li>abc</li><li>[]<br></li></ol>',
                            });
                        });
                    });
                    describe('Removing items', () => {
                        // TODO: MAKE IT PASS
                        // TODO: determine whether this is the expected behavior
                        it('should add an empty list item at the end of a list, then remove it', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li>abc[]</li></ol>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter: '<ol><li>abc</li></ol><p>[]<br></p>',
                            });
                        });
                        it('should add an empty list item at the end of an indented list, then remove it', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc</li><li style="list-style: none;"><ol><li>def[]</li></ol></li><li>ghi</li></ol>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ol><li>abc</li><li style="list-style: none;"><ol><li>def</li></ol></li><li>[]<br></li><li>ghi</li></ol>',
                            });
                        });
                        it('should remove a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li><p>[]<br></p></li></ol>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<p>[]<br></p>',
                            });
                        });
                        it('should remove a list set to bold', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li><p><b>[]<br></b></p></li></ol>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<p>[]<br></p>',
                            });
                        });
                    });
                    describe('With attributes', () => {
                        it('should add two list items at the end of a list with a class', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol class="a"><li>abc[]</li></ol>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ol class="a"><li>abc</li><li>b</li><li>[]<br></li></ol>',
                            });
                        });
                        it('should add two list items with a class at the end of a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li class="a">abc[]</li></ol>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ol><li class="a">abc</li><li class="a">b</li><li class="a">[]<br></li></ol>',
                            });
                        });
                        it('should add two list items with a class and a div at the end of a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li class="a"><div>abc[]</div></li></ol>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ol><li class="a"><div>abc</div></li><li class="a"><div>b</div></li><li class="a"><div>[]<br></div></li></ol>',
                            });
                        });
                        it('should add two list items with a div with a class at the end of a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ol><li><div class="a">abc[]</div></li></ol>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ol><li><div class="a">abc</div></li><li><div class="a">b</div></li><li><div class="a">[]<br></div></li></ol>',
                            });
                        });
                        it('should add two list items with a font at the end of a list within a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul>
                                        <li>ab</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>
                                                    <font style="color: red;">cd[]</font>
                                                </li>
                                            </ul>
                                        </li>
                                        <li>ef</li>
                                    </ul>`),
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter: unformat(`
                                    <ul>
                                        <li>ab</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li><font style="color: red;">cd</font></li>
                                                <li>b</li>
                                                <li>[]<br></li>
                                            </ul>
                                        </li>
                                        <li>ef</li>
                                    </ul>`),
                            });
                        });
                    });
                });
                describe('Unordered', () => {
                    describe('Basic', () => {
                        it('should add an empty list item before a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>[]abc</li></ul>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<ul><li><br></li><li>[]abc</li></ul>',
                            });
                        });
                        it('should split a list item in two', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>ab[]cd</li></ul>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<ul><li>ab</li><li>[]cd</li></ul>',
                            });
                        });
                        it('should add an empty list item after a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>abc[]</li></ul>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<ul><li>abc</li><li>[]<br></li></ul>',
                            });
                        });
                    });
                    describe('Removing items', () => {
                        it('should add an empty list item at the end of a list, then remove it', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>abc[]</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter: '<ul><li>abc</li></ul><p>[]<br></p>',
                            });
                        });
                        it('should add an empty list item at the end of an indented list, then remove it', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul><li>def[]</li></ul></li><li>ghi</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul><li>def</li></ul></li><li>[]<br></li><li>ghi</li></ul>',
                            });
                        });
                        it('should remove a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li><p>[]<br></p></li></ul>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<p>[]<br></p>',
                            });
                        });
                        it('should remove a list set to bold', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li><p><b>[]<br></b></p></li></ul>',
                                stepFunction: insertParagraphBreak,
                                contentAfter: '<p>[]<br></p>',
                            });
                        });
                    });
                    describe('With attributes', () => {
                        it('should add two list items at the end of a list with a class', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul class="a"><li>abc[]</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ul class="a"><li>abc</li><li>b</li><li>[]<br></li></ul>',
                            });
                        });
                        it('should add two list items with a class at the end of a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li class="a">abc[]</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ul><li class="a">abc</li><li class="a">b</li><li class="a">[]<br></li></ul>',
                            });
                        });
                        it('should add two list items with a class and a div at the end of a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li class="a"><div>abc[]</div></li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ul><li class="a"><div>abc</div></li><li class="a"><div>b</div></li><li class="a"><div>[]<br></div></li></ul>',
                            });
                        });
                        it('should add two list items with a div with a class at the end of a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li><div class="a">abc[]</div></li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await insertParagraphBreak(editor);
                                    await insertText(editor, 'b');
                                    await insertParagraphBreak(editor);
                                },
                                contentAfter:
                                    '<ul><li><div class="a">abc</div></li><li><div class="a">b</div></li><li><div class="a">[]<br></div></li></ul>',
                            });
                        });
                    });
                });
                describe('Mixed', () => {
                    describe('Ordered to unordered', () => {});
                    describe('Unordered to ordered', () => {});
                });
            });
            describe('Selection not collapsed', () => {
                it('should delete part of a list item, then split it', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>ab[cd]ef</li></ul>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<ul><li>ab</li><li>[]ef</li></ul>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>ab]cd[ef</li></ul>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<ul><li>ab</li><li>[]ef</li></ul>',
                    });
                });
                it('should delete all contents of a list item, then split it', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>[abc]</li></ul>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<ul><li><br></li><li>[]<br></li></ul>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>]abc[</li></ul>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<ul><li><br></li><li>[]<br></li></ul>',
                    });
                });
                it("should delete across two list items, then split what's left", async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>ab[cd</li><li>ef]gh</li></ul>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<ul><li>ab</li><li>[]gh</li></ul>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>ab]cd</li><li>ef[gh</li></ul>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<ul><li>ab</li><li>[]gh</li></ul>',
                    });
                });
            });
        });
        describe('insertLineBreak', () => {
            describe('Selection collapsed', () => {
                it('should insert a <br> into an empty list item', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>[]<br></li></ul>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<ul><li><br>[]<br></li></ul>',
                    });
                });
                it('should insert a <br> at the beggining of a list item', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>[]abc</li></ul>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<ul><li><br>[]abc</li></ul>',
                    });
                });
                it('should insert a <br> within a list item', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>ab[]cd</li></ul>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<ul><li>ab<br>[]cd</li></ul>',
                    });
                });
                it('should insert a line break (2 <br>) at the end of a list item', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>abc[]</li></ul>',
                        stepFunction: insertLineBreak,
                        // The second <br> is needed to make the first
                        // one visible.
                        contentAfter: '<ul><li>abc<br>[]<br></li></ul>',
                    });
                });
            });
            describe('Selection not collapsed', () => {
                it('should delete part of a list item, then insert a <br>', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>ab[cd]ef</li></ul>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<ul><li>ab<br>[]ef</li></ul>',
                    });
                });
            });
        });
    });
});
