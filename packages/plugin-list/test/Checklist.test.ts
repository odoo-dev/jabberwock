import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { Core } from '../../core/src/Core';
import { ListType } from '../src/ListNode';
import { describePlugin, keydown, unformat, click } from '../../utils/src/testUtils';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { List } from '../src/List';
import { Char } from '../../plugin-char/src/Char';
import { Dom } from '../../plugin-dom/src/Dom';
import { ChecklistNode } from '../src/ChecklistNode';
import { CharNode } from '../../plugin-char/src/CharNode';

const deleteForward = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<Core>('deleteForward');
};
const deleteBackward = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<Core>('deleteBackward');
};
const insertParagraphBreak = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('insertParagraphBreak');
const indentList = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<List>('indent');
};
const outdentList = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<List>('outdent');
};
const toggleChecklist = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<List>('toggleList', {
        type: ListType.CHECKLIST,
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
        describe('Checklist', () => {
            it('should parse a checkedttribute', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul class="checklist"><li class="checked">a</li></ul>',
                    contentAfter: '<ul class="checklist"><li class="checked">a</li></ul>',
                });
            });
            it('should not parse a checkedttribute on empty checklist item (without any content/container)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul class="checklist"><li class="checked"><br></li></ul>',
                    contentAfter: '<ul class="checklist"><li class="unchecked"><br></li></ul>',
                });
            });
            it('should parse a checkedttribute in indented', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                        <ul class="checklist">
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">1</li>
                                </ul>
                            </li>
                        </ul>`),
                    stepFunction: toggleChecklist,
                    contentAfter: unformat(`
                        <ul class="checklist">
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">1</li>
                                </ul>
                            </li>
                        </ul>`),
                });
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                        <ul class="checklist">
                            <li class="checked">2</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">2.1</li>
                                </ul>
                            </li>
                        </ul>`),
                    stepFunction: toggleChecklist,
                    contentAfter: unformat(`
                        <ul class="checklist">
                            <li class="checked">2</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">2.1</li>
                                </ul>
                            </li>
                        </ul>`),
                });
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                        <ul class="checklist">
                            <li>3</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">3.1</li>
                                </ul>
                            </li>
                        </ul>`),
                    stepFunction: toggleChecklist,
                    contentAfter: unformat(`
                        <ul class="checklist">
                            <li class="checked">3</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">3.1</li>
                                </ul>
                            </li>
                        </ul>`),
                });
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                        <ul class="checklist">
                            <li class="unchecked">4</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">4.1</li>
                                </ul>
                            </li>
                        </ul>`),
                    stepFunction: toggleChecklist,
                    contentAfter: unformat(`
                        <ul class="checklist">
                            <li class="checked">4</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">4.1</li>
                                </ul>
                            </li>
                        </ul>`),
                });
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                        <ul class="checklist">
                            <li>5</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">5.1</li>
                                    <li class="unchecked">5.2</li>
                                </ul>
                            </li>
                        </ul>`),
                    stepFunction: toggleChecklist,
                    contentAfter: unformat(`
                        <ul class="checklist">
                            <li class="unchecked">5</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">5.1</li>
                                    <li class="unchecked">5.2</li>
                                </ul>
                            </li>
                        </ul>`),
                });
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                        <ul class="checklist">
                            <li>6</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <ul class="checklist">
                                        <li class="checked">6.1.1</li>
                                        <li class="checked">6.1.2</li>
                                    </ul>
                                </ul>
                            </li>
                        </ul>`),
                    stepFunction: toggleChecklist,
                    contentAfter: unformat(`
                        <ul class="checklist">
                            <li class="checked">6</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">6.1.1</li>
                                            <li class="checked">6.1.2</li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                        </ul>`),
                });
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                        <ul class="checklist">
                            <li>7</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <ul class="checklist">
                                        <li class="checked">7.1.1</li>
                                        <li class="unchecked">7.1.2</li>
                                    </ul>
                                </ul>
                            </li>
                        </ul>`),
                    stepFunction: toggleChecklist,
                    contentAfter: unformat(`
                        <ul class="checklist">
                            <li class="unchecked">7</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">7.1.1</li>
                                            <li class="unchecked">7.1.2</li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                        </ul>`),
                });
            });
            it('should parse a complet checklist', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: unformat(`
                        <ul class="checklist">
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">1</li>
                                </ul>
                            </li>
                            <li class="checked">2</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">2.1</li>
                                </ul>
                            </li>
                            <li class="unchecked">3</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">3.1</li>
                                    <li class="unchecked">3.2</li>
                                </ul>
                            </li>
                            <li class="checked">4</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">4.1</li>
                                    <li class="unchecked">4.2</li>
                                </ul>
                            </li>
                            <li>5</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li>5.1</li>
                                    <ul class="checklist">
                                        <li class="checked">5.1.1</li>
                                        <li class="checked">5.1.2</li>
                                    </ul>
                                </ul>
                            </li>
                            <li>6</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <ul class="checklist">
                                        <li class="checked">6.1.1.1</li>
                                    </ul>
                                </ul>
                            </li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <ul class="checklist">
                                        <li class="checked">7.1.1.1</li>
                                    </ul>
                                </ul>
                            </li>
                        </ul>`),
                    stepFunction: toggleChecklist,
                    contentAfter: unformat(`
                        <ul class="checklist">
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">1</li>
                                </ul>
                            </li>
                            <li class="checked">2</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">2.1</li>
                                </ul>
                            </li>
                            <li class="unchecked">3</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">3.1</li>
                                    <li class="unchecked">3.2</li>
                                </ul>
                            </li>
                            <li class="unchecked">4</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">4.1</li>
                                    <li class="unchecked">4.2</li>
                                </ul>
                            </li>
                            <li class="checked">5</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">5.1</li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">5.1.1</li>
                                            <li class="checked">5.1.2</li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                            <li class="checked">6</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">6.1.1.1</li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">7.1.1.1</li>
                                        </ul>
                                    </li>
                                </ul>
                            </li>
                        </ul>`),
                });
            });
        });
    });
    describe('toggleList', () => {
        describe('Range collapsed', () => {
            describe('Checklist', () => {
                describe('Insert', () => {
                    it('should turn an empty paragraph into a checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                        });
                    });
                    it('should turn a paragraph into a checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]cd</li></ul>',
                        });
                    });
                    it('should turn a heading into a checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab[]cd</h1>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked"><h1>ab[]cd</h1></li></ul>',
                        });
                    });
                    it('should turn a paragraph in a div into a checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>ab[]cd</p></div>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<div><ul class="checklist"><li class="unchecked">ab[]cd</li></ul></div>',
                        });
                    });
                    it('should turn a paragraph with formats into a checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</p>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked"><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</li></ul>',
                        });
                    });
                    it('should turn a paragraph into a checklist betweet 2 checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">abc</li></ul><p>d[]ef</p><ul class="checklist"><li class="checked">ghi</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">d[]ef</li><li class="checked">ghi</li></ul>',
                        });
                    });
                    it('should turn a unordered list into a checklist betweet 2 checklist inside a checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: unformat(`
                                <ul class="checklist">
                                    <li class="checked">abc</li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">def</li>
                                        </ul>
                                    </li>
                                    <li style="list-style: none;">
                                        <ul>
                                            <li>g[]hi</li>
                                        </ul>
                                    </li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">jkl</li>
                                        </ul>
                                    </li>
                                </ul>`),
                            stepFunction: toggleChecklist,
                            contentAfter: unformat(`
                                <ul class="checklist">
                                    <li class="unchecked">abc</li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">def</li>
                                            <li class="unchecked">g[]hi</li>
                                            <li class="checked">jkl</li>
                                        </ul>
                                    </li>
                                </ul>`),
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: unformat(`
                                <ul class="checklist">
                                    <li class="checked">abc</li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">def</li>
                                        </ul>
                                    </li>
                                    <li style="list-style: none;">
                                        <ul>
                                            <li class="a">g[]hi</li>
                                        </ul>
                                    </li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">jkl</li>
                                        </ul>
                                    </li>
                                </ul>`),
                            stepFunction: toggleChecklist,
                            contentAfter: unformat(`
                                <ul class="checklist">
                                    <li class="unchecked">abc</li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">def</li>
                                            <li class="a unchecked">g[]hi</li>
                                            <li class="checked">jkl</li>
                                        </ul>
                                    </li>
                                </ul>`),
                        });
                    });
                });
                describe('Remove', () => {
                    it('should turn an empty list into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter: '<p>[]<br></p>',
                        });
                    });
                    it('should turn a checklist into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">ab[]cd</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter: '<p>ab[]cd</p>',
                        });
                    });
                    it('should turn a checklist into a heading', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked"><h1>ab[]cd</h1></li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter: '<h1>ab[]cd</h1>',
                        });
                    });
                    it('should turn a checklist item into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>ab</p><ul class="checklist"><li class="unchecked">cd</li><li class="unchecked">ef[]gh</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<p>ab</p><ul class="checklist"><li class="unchecked">cd</li></ul><p>ef[]gh</p>',
                        });
                    });
                    it('should turn a checklist with formats into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked"><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<p><span><b>ab</b></span> <span><i>cd</i></span> ef[]gh</p>',
                        });
                    });
                    it('should turn nested list items into paragraphs', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: unformat(`
                                <ul class="checklist">
                                    <li class="checked">a</li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">[]b</li>
                                        </ul>
                                    </li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="checked">c</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>`),
                            stepFunction: toggleChecklist,
                            contentAfter: unformat(`
                                <ul class="checklist">
                                    <li class="checked">a</li>
                                </ul>
                                <p>[]b</p>
                                <ul class="checklist">
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="checked">c</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>`),
                        });
                    });
                });
            });
        });
        describe('Range not collapsed', () => {
            describe('Checklist', () => {
                describe('Insert', () => {
                    it('should turn a paragraph into a checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>cd[ef]gh</p>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<p>ab</p><ul class="checklist"><li class="unchecked">cd[ef]gh</li></ul>',
                        });
                    });
                    it('should turn a heading into a checklist', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><h1>cd[ef]gh</h1>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<p>ab</p><ul class="checklist"><li class="unchecked"><h1>cd[ef]gh</h1></li></ul>',
                        });
                    });
                    it('should turn two paragraphs into a checklist with two items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>cd[ef</p><p>gh]ij</p>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<p>ab</p><ul class="checklist"><li class="unchecked">cd[ef</li><li class="unchecked">gh]ij</li></ul>',
                        });
                    });
                    it('should turn two paragraphs in a div into a checklist with two items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<div><p>ab[cd</p><p>ef]gh</p></div>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<div><ul class="checklist"><li class="unchecked">ab[cd</li><li class="unchecked">ef]gh</li></ul></div>',
                        });
                    });
                    it('should turn a paragraph and a checklist item into two list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>a[b</p><ul class="checklist"><li class="checked">c]d</li><li class="unchecked">ef</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">a[b</li><li class="checked">c]d</li><li class="unchecked">ef</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>a[b</p><ul class="checklist"><li class="checked">c]d</li><li class="checked">ef</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">a[b</li><li class="checked">c]d</li><li class="checked">ef</li></ul>',
                        });
                    });
                    it('should turn a checklist item and a paragraph into two list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">ab</li><li class="checked">c[d</li></ul><p>e]f</p>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab</li><li class="checked">c[d</li><li class="unchecked">e]f</li></ul>',
                        });
                    });
                    it('should turn a checklist, a paragraph and another list into one list with three list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">a[b</li></ul><p>cd</p><ul class="checklist"><li class="checked">e]f</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">a[b</li><li class="unchecked">cd</li><li class="checked">e]f</li></ul>',
                        });
                    });
                    it('should turn a checklist item, a paragraph and another list into one list with all three as list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab<li>c[d</li></ul><p>ef</p><ul class="checklist"><li class="checked">g]h</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab</li><li class="unchecked">c[d</li><li class="unchecked">ef</li><li class="checked">g]h</li></ul>',
                        });
                    });
                    it('should turn a checklist, a paragraph and a checklist item into one list with all three as list items', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">a[b</li></ul><p>cd</p><ul class="checklist"><li class="checked">e]f</li><li class="unchecked">gh</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">a[b</li><li class="unchecked">cd</li><li class="checked">e]f</li><li class="unchecked">gh</li></ul>',
                        });
                    });
                });
                describe('Remove', () => {
                    it('should turn a checklist into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>ab</p><ul class="checklist"><li class="unchecked">cd[ef]gh</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter: '<p>ab</p><p>cd[ef]gh</p>',
                        });
                    });
                    it('should turn a checklist into a heading', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>ab</p><ul class="checklist"><li class="unchecked"><h1>cd[ef]gh</h1></li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter: '<p>ab</p><h1>cd[ef]gh</h1>',
                        });
                    });
                    it('should turn a checklist into two paragraphs', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>ab</p><ul class="checklist"><li class="unchecked">cd[ef</li><li class="unchecked">gh]ij</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter: '<p>ab</p><p>cd[ef</p><p>gh]ij</p>',
                        });
                    });
                    it('should turn a checklist item into a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>ab</p><ul class="checklist"><li class="checked">cd</li><li class="checked">ef[gh]ij</li></ul>',
                            stepFunction: toggleChecklist,
                            contentAfter:
                                '<p>ab</p><ul class="checklist"><li class="checked">cd</li></ul><p>ef[gh]ij</p>',
                        });
                    });
                });
            });
            describe('Mixed', () => {
                it('should turn an unordered list into a checklist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<ul><li>a[b]c</li></ul>',
                        stepFunction: toggleChecklist,
                        contentAfter: '<ul class="checklist"><li class="unchecked">a[b]c</li></ul>',
                    });
                });
                it('should turn an unordered list into a checklist just after a checklist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<ul class="checklist"><li class="checked">abc</li></ul><ul><li>d[e]f</li></ul>',
                        stepFunction: toggleChecklist,
                        contentAfter:
                            '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">d[e]f</li></ul>',
                    });
                });
                it('should turn an unordered list into a checklist just after a checklist and inside a checklist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">title</li>
                                <ul class="checklist">
                                    <li class="checked">abc</li>
                                </ul>
                                <ul><li>d[e]f</li></ul>
                            </ul>`),
                        stepFunction: toggleChecklist,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">title</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">abc</li>
                                        <li class="unchecked">d[e]f</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                });
            });
        });
    });
    describe('VDocument', () => {
        describe('deleteForward', () => {
            describe('Selection collapsed', () => {
                describe('Checklist', () => {
                    describe('Basic', () => {
                        it('should do nothing', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked">abc[]</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked">abc[]</li></ul></li></ul>',
                            });
                        });
                        it('should delete the first character in a checklist item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">[]defg</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">[]efg</li></ul>',
                            });
                        });
                        it('should delete a character within a checklist item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">de[]fg</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">de[]g</li></ul>',
                            });
                        });
                        it('should delete the last character in a checklist item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">def[]g</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">def[]</li></ul>',
                            });
                        });
                        it('should remove the only character in a checklist', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">[]a</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">[]<br></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><p>[]a</p></li></ul>',
                                stepFunction: deleteForward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">[]<br></li></ul>',
                            });
                        });
                        it('should merge a checklist item with its next list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc[]</li><li class="unchecked">def</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li></ul>',
                            });
                            // With another list item before.
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">def[]</li><li class="checked">ghi</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">def[]ghi</li></ul>',
                            });
                            // Where the list item to merge into is empty, with an
                            // empty list item before.
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked"><br></li><li class="unchecked">[]<br></li><li class="unchecked">abc</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked"><br></li><li class="unchecked">[]abc</li></ul>',
                            });
                        });
                        it('should rejoin sibling lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">a[]</li></ul><p>b</p><ul class="checklist"><li class="checked">c</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">a[]b</li><li class="checked">c</li></ul>',
                            });
                        });
                        it('should rejoin multi-level sibling lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                        <ul class="checklist">
                                            <li class="checked">a</li>
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="checked">b[]</li>
                                                </ul>
                                            </li>
                                        </ul>
                                        <p>c</p>
                                        <ul class="checklist">
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="unchecked">d</li>
                                                </ul>
                                            </li>
                                            <li class="unchecked">e</li>
                                        </ul>`),
                                stepFunction: deleteForward,
                                contentAfter: unformat(`
                                        <ul class="checklist">
                                            <li class="unchecked">a</li>
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="checked">b[]c</li>
                                                    <li class="unchecked">d</li>
                                                </ul>
                                            </li>
                                            <li class="unchecked">e</li>
                                        </ul>`),
                            });
                        });
                        it('should only rejoin same-level lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                        <ul class="checklist">
                                            <li class="checked">a</li>
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="checked">b</li>
                                                </ul>
                                            </li>
                                            <li class="checked">c[]</li>
                                        </ul>
                                        <p>d</p>
                                        <ul class="checklist">
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="unchecked">e</li>
                                                </ul>
                                            </li>
                                            <li class="checked">f</li>
                                        </ul>`),
                                stepFunction: deleteForward,
                                contentAfter: unformat(`
                                        <ul class="checklist">
                                            <li class="checked">a</li>
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="checked">b</li>
                                                </ul>
                                            </li>
                                            <li class="unchecked">c[]d</li>
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="unchecked">e</li>
                                                </ul>
                                            </li>
                                            <li class="checked">f</li>
                                        </ul>`),
                            });
                        });
                        it('should not convert mixed lists on rejoin', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">a[]</li></ul><p>b</p><ul><li>c</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">a[]b</li></ul><ul><li>c</li></ul>',
                            });
                        });
                        it('should not convert mixed multi-level lists on rejoin', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                        <ul class="checklist">
                                            <li class="checked">a</li>
                                            <li style="list-style: none;">
                                                <ul>
                                                    <li class="checked">b[]</li>
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
                                        <ul class="checklist">
                                            <li class="checked">a</li>
                                            <li style="list-style: none;">
                                                <ul>
                                                    <li class="checked">b[]c</li>
                                                </ul>
                                            </li>
                                        </ul>
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
                                    '<ul class="checklist"><li class="unchecked">abc[]</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">def</li><li class="checked">ghi</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ghi</li></ul></li></ul>',
                            });
                        });
                        it('should merge the only item in an indented list into a non-indented list item and remove the now empty indented list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">abc[]</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">def</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">abc[]def</li></ul>',
                            });
                        });
                    });
                    describe('Complex merges', () => {
                        it('should merge a checklist item into a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[]cd</p><ul class="checklist"><li class="checked">ef</li><li class="checked">gh</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await deleteForward(editor);
                                    await deleteForward(editor);
                                    await deleteForward(editor);
                                    await deleteForward(editor);
                                },
                                contentAfter:
                                    '<p>ab[]f</p><ul class="checklist"><li class="checked">gh</li></ul>',
                            });
                        });
                        it('should merge a paragraph into a checklist item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc[]</li></ul><p>def</p>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li></ul>',
                            });
                        });
                        it('should treat two blocks in a checklist item as two list items and merge them', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><p>abc</p></li><li class="unchecked"><p>def[]</p><p>ghi</p></li><li class="checked"><p>klm</p></li></ul>',
                                stepFunction: deleteForward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">def[]ghi</li><li class="checked">klm</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><h1>abc</h1></li><li class="checked"><h2>def[]</h2><h3>ghi</h3></li><li class="checked"><h4>klm</h4></li></ul>',
                                stepFunction: deleteForward,
                                // Paragraphs in list items are treated as nonsense.
                                // Headings aren't, as they do provide extra information.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><h1>abc</h1></li><li class="checked"><h2>def[]ghi</h2></li><li class="checked"><h4>klm</h4></li></ul>',
                            });
                        });
                        it('should treat two blocks in a checklist item (checked/unchecked) as two list items and merge them', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><h1>abc</h1></li><li class="unchecked"><h2>def[]</h2><h3>ghi</h3></li><li class="checked"><h4>klm</h4></li></ul>',
                                stepFunction: deleteForward,
                                // Paragraphs in list items are treated as nonsense.
                                // unchecked folowed by checked
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><h1>abc</h1></li><li class="unchecked"><h2>def[]ghi</h2></li><li class="checked"><h4>klm</h4></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><h1>abc</h1></li><li class="checked"><h2>def[]</h2><h3>ghi</h3></li><li class="unchecked"><h4>klm</h4></li></ul>',
                                stepFunction: deleteForward,
                                // Paragraphs in list items are treated as nonsense.
                                // checked folowed by unchecked
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><h1>abc</h1></li><li class="checked"><h2>def[]ghi</h2></li><li class="unchecked"><h4>klm</h4></li></ul>',
                            });
                        });
                        it('should merge a bold list item into a non-formatted list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">abc</li><li class="unchecked"><b>de</b>fg[]</li><li class="unchecked"><b>hij</b>klm</li><li class="unchecked">nop</li></ul>',
                                stepFunction: deleteForward,
                                // all checked
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">abc</li><li class="unchecked"><b>de</b>fg[]<b>hij</b>klm</li><li class="unchecked">nop</li></ul>',
                            });
                        });
                        it('should merge a bold list item (checked/unchecked) into a non-formatted list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked"><b>de</b>fg[]</li><li class="checked"><b>hij</b>klm</li><li class="checked">nop</li></ul>',
                                stepFunction: deleteForward,
                                // all checked
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked"><b>de</b>fg[]<b>hij</b>klm</li><li class="checked">nop</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked"><b>de</b>fg[]</li><li class="unchecked"><b>hij</b>klm</li><li class="checked">nop</li></ul>',
                                stepFunction: deleteForward,
                                // only the removed li are unchecked
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked"><b>de</b>fg[]<b>hij</b>klm</li><li class="checked">nop</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">abc</li><li class="unchecked"><b>de</b>fg[]</li><li class="checked"><b>hij</b>klm</li><li class="unchecked">nop</li></ul>',
                                stepFunction: deleteForward,
                                // only the removed li are checked
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">abc</li><li class="unchecked"><b>de</b>fg[]<b>hij</b>klm</li><li class="unchecked">nop</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><p>abc</p></li><li class="unchecked"><p><b>de</b>fg[]</p><p><b>hij</b>klm</p></li><li class="checked"><p>nop</p></li></ul>',
                                stepFunction: deleteForward,
                                // Two paragraphs in a checklist item = Two list items.
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked"><b>de</b>fg[]<b>hij</b>klm</li><li class="checked">nop</li></ul>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a checklist item with ending without formatting', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked"><i>abc</i>def[]</li></ul><p><b>ghi</b>jkl</p>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked"><i>abc</i>def[]<b>ghi</b>jkl</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><i>abc</i>def[]</li></ul><p><b>ghi</b>jkl</p>',
                                stepFunction: deleteForward,
                                // kepp checked
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><i>abc</i>def[]<b>ghi</b>jkl</li></ul>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a checklist item with ending with italic text', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked"><b>abc</b><i>def[]</i></li></ul><p><b>ghi</b>jkl</p>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked"><b>abc</b><i>def[]</i><b>ghi</b>jkl</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><b>abc</b><i>def[]</i></li></ul><p><b>ghi</b>jkl</p>',
                                stepFunction: deleteForward,
                                // kepp checked
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><b>abc</b><i>def[]</i><b>ghi</b>jkl</li></ul>',
                            });
                        });
                    });
                });
            });
            describe('Selection not collapsed', () => {
                // Note: All tests on checklist lists should be duplicated
                // with unordered lists, and vice versa.
                describe('Checklist', () => {
                    it('should delete text within a checklist item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd]ef</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]ef</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">ab[cd]ef</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]ef</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd[ef</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]ef</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">ab]cd[ef</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]ef</li></ul>',
                        });
                    });
                    it('should delete all the text in a checklist item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">[abc]</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">[]<br></li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">[abc]</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">]abc[</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">[]<br></li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">]abc[</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                        });
                    });
                    it('should delete across two list items', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd</li><li class="checked">ef]gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd</li><li class="unchecked">ef]gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">ab[cd</li><li class="checked">ef]gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">ab[cd</li><li class="unchecked">ef]gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd</li><li class="checked">ef[gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">ab]cd</li><li class="checked">ef[gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd</li><li class="unchecked">ef[gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="unchecked">ab]cd</li><li class="unchecked">ef[gh</li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                        });
                    });
                    it('should delete across an unindented list item and an indented list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef]gh</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li>ab[cd</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">ef]gh</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            // falsy unchecked => because the title (all items of indented ul) is checked
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li>ab[cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef]gh</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            // falsy unchecked => because is used as the title of all items of indented ul
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef[gh</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li>ab]cd</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">ef[gh</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            // falsy unchecked => because the title (all items of indented ul) is checked
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li>ab]cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef[gh</li></ul></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                    });
                    it('should delete a checklist', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>abc[</p><ul class="checklist"><li><p>def]</p></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>abc]</p><ul class="checklist"><li><p>def[</p></li></ul>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                    });
                    it('should merge the contents of a checklist item within a divider into a heading, and leave the rest of its list as it is', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ul class="checklist"><li class="checked">fg</li><li>h]i</li><li class="checked">jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="checked">jk</li></ul></div>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ul class="checklist"><li class="unchecked">fg</li><li>h]i</li><li class="checked">jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="checked">jk</li></ul></div>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ul class="checklist"><li class="checked">fg</li><li>h]i</li><li class="unchecked">jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="unchecked">jk</li></ul></div>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ul class="checklist"><li class="unchecked">fg</li><li>h]i</li><li class="unchecked">jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="unchecked">jk</li></ul></div>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ul class="checklist"><li>fg</li><li class="checked">h[i</li><li class="checked">jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="checked">jk</li></ul></div>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ul class="checklist"><li>fg</li><li class="unchecked">h[i</li><li class="checked">jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="checked">jk</li></ul></div>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ul class="checklist"><li>fg</li><li class="checked">h[i</li><li class="unchecked">jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="unchecked">jk</li></ul></div>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ul class="checklist"><li>fg</li><li class="unchecked">h[i</li><li class="unchecked">jk</li></ul></div>',
                            stepFunction: deleteForward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="unchecked">jk</li></ul></div>',
                        });
                    });
                });
                describe('Mixed', () => {
                    describe('Checklist to unordered', () => {
                        it('should delete across an checklist list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab[cd</li></ul><ul><li class="checked">ef]gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">ab[cd</li></ul><ul><li class="checked">ef]gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab[cd</li></ul><ul><li class="unchecked">ef]gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">ab[cd</li></ul><ul><li class="unchecked">ef]gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab]cd</li></ul><ul><li class="checked">ef[gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">ab]cd</li></ul><ul><li class="checked">ef[gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab]cd</li></ul><ul><li class="unchecked">ef[gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">ab]cd</li></ul><ul><li class="unchecked">ef[gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                            });
                        });
                        it('should delete across an checklist list item and an unordered list item within an checklist list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab[cd</li><li style="list-style: none;"><ul><li class="checked">ef]gh</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">ab[cd</li><li style="list-style: none;"><ul><li class="unchecked">ef]gh</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab]cd</li><li style="list-style: none;"><ul><li class="checked">ef[gh</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">ab]cd</li><li style="list-style: none;"><ul><li class="unchecked">ef[gh</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                            });
                        });
                        it('should delete an checklist list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[</p><ul><li>cd</li></ul><ul class="checklist"><li class="checked">ef]</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]</p>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab]</p><ul><li>cd</li></ul><ul class="checklist"><li class="checked">ef[</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]</p>',
                            });
                        });
                    });
                    describe('Unordered to checklist', () => {
                        it('should delete across an unordered list and an checklist list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab[cd</li></ul><ul class="checklist"><li class="checked">ef]gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab]cd</li></ul><ul class="checklist"><li>ef[gh</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                        });
                        it('should delete across an unordered list item and an checklist list item within an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab[cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef]gh</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab]cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef[gh</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                        });
                        it('should delete an checklist list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[</p><ul class="checklist"><li class="checked">cd</li></ul><ul><li>ef]</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]</p>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab]</p><ul class="checklist"><li class="checked">cd</li></ul><ul><li>ef[</li></ul>',
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
                describe('Checklist', () => {
                    describe('Basic', () => {
                        it('should do nothing', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked"><br>[]</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><br>[]</li></ul>',
                                stepFunction: deleteBackward,
                                // no real line, don't remember checked state
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked">[]abc</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked">[]abc</li></ul></li></ul>',
                            });
                        });
                        it('should delete the first character in a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">d[]efg</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">[]efg</li></ul>',
                            });
                        });
                        it('should delete a character within a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">de[]fg</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">d[]fg</li></ul>',
                            });
                        });
                        it('should delete the last character in a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">defg[]</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">def[]</li></ul>',
                            });
                        });
                        it('should remove the only character in a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">a[]</li></ul>',
                                stepFunction: deleteBackward,
                                // keep checked because contains the paragraph
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">[]<br></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><p>a[]</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">[]<br></li></ul>',
                            });
                        });
                        it('should merge a list item with its previous list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">abc</li><li class="checked">[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">abc[]def</li></ul>',
                            });
                            // With another list item after.
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">[]def</li><li class="checked">ghi</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li><li class="checked">ghi</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">[]def</li><li class="unchecked">ghi</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li><li class="unchecked">ghi</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">[]def</li><li class="checked">ghi</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li><li class="checked">ghi</li></ul>',
                            });
                            // Where the list item to merge into is empty, with an
                            // empty list item before.
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked"><br></li><li class="unchecked"><br></li><li class="checked">[]abc</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked"><br></li><li class="unchecked">[]abc</li></ul>',
                            });
                        });
                        it('should rejoin sibling lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">a</li></ul><p>[]b</p><ul class="checklist"><li class="checked">c</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">a[]b</li><li class="checked">c</li></ul>',
                            });
                        });
                        it('should rejoin multi-level sibling lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">a</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">b</li>
                                            </ul>
                                        </li>
                                    </ul>
                                    <p>[]c</p>
                                    <ul class="checklist">
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">d</li>
                                            </ul>
                                        </li>
                                        <li class="checked">e</li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">a</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">b[]c</li>
                                                <li class="checked">d</li>
                                            </ul>
                                        </li>
                                        <li class="checked">e</li>
                                    </ul>`),
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">a</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">b</li>
                                            </ul>
                                        </li>
                                    </ul>
                                    <p>[]c</p>
                                    <ul class="checklist">
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="unchecked">d</li>
                                            </ul>
                                        </li>
                                        <li class="checked">e</li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul class="checklist">
                                        <li class="unchecked">a</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">b[]c</li>
                                                <li class="unchecked">d</li>
                                            </ul>
                                        </li>
                                        <li class="checked">e</li>
                                    </ul>`),
                            });
                        });
                        it('should only rejoin same-level lists', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">a</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">b</li>
                                            </ul>
                                        </li>
                                        <li class="checked">c</li>
                                    </ul>
                                    <p>[]d</p>
                                    <ul class="checklist">
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">e</li>
                                            </ul>
                                        </li>
                                        <li class="checked">f</li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">a</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">b</li>
                                            </ul>
                                        </li>
                                        <li class="checked">c[]d</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">e</li>
                                            </ul>
                                        </li>
                                        <li class="checked">f</li>
                                    </ul>`),
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">a</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">b</li>
                                            </ul>
                                        </li>
                                        <li class="unchecked">c</li>
                                    </ul>
                                    <p>[]d</p>
                                    <ul class="checklist">
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">e</li>
                                            </ul>
                                        </li>
                                        <li class="checked">f</li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">a</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">b</li>
                                            </ul>
                                        </li>
                                        <li class="checked">c[]d</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="checked">e</li>
                                            </ul>
                                        </li>
                                        <li class="checked">f</li>
                                    </ul>`),
                            });
                        });
                        it('should not convert mixed lists on rejoin', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">a</li></ul><p>[]b</p><ul><li>c</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">a[]b</li></ul><ul><li>c</li></ul>',
                            });
                        });
                        it('should not convert mixed multi-level lists on rejoin', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">a</li>
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
                                    <ul class="checklist">
                                        <li class="checked">a</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>b[]c</li>
                                            </ul>
                                        </li>
                                    </ul>
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
                                    '<ul class="checklist"><li class="checked">abc</li><li style="list-style: none;"><ul class="checklist"><li class="checked">[]def</li><li class="checked">ghi</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ghi</li></ul></li></ul>',
                            });
                        });
                        it('should merge a non-indented list item into an indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked">abc</li></ul></li><li class="checked">[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked">abc[]def</li></ul></li></ul>',
                            });
                        });
                        it('should merge the only item in an indented list into a non-indented list item and remove the now empty indented list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li style="list-style: none;"><ul class="checklist"><li class="checked">[]def</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li></ul>',
                            });
                        });
                        it('should outdent a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked">[]abc</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">[]abc</li></ul>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abc</p><ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked">[]def</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<p>abc</p><ul class="checklist"><li class="checked">[]def</li></ul>',
                            });
                        });
                        it('should outdent while nested within a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><div>abc</div></li><li class="checked"><div><div>[]def</div></div></li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><div>abc</div></li></ul><div><div>[]def</div></div>',
                            });
                            // With a div before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<div>abc</div><ul class="checklist"><li class="checked"><div><div>[]def</div></div></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<div>abc</div><div><div>[]def</div></div>',
                            });
                        });
                        it('should outdent an empty list item within a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul class="checklist">
                                        <li class="unchecked">abc</li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="unchecked">[]<br></li>
                                                <li class="unchecked"><br></li>
                                            </ul>
                                        </li>
                                        <li class="checked">def</li>
                                    </ul>`),
                                stepFunction: backspace,
                                contentAfter: unformat(`
                                    <ul class="checklist">
                                        <li class="unchecked">abc</li>
                                        <li class="unchecked">[]<br></li>
                                        <li style="list-style: none;">
                                            <ul class="checklist">
                                                <li class="unchecked"><br></li>
                                            </ul>
                                        </li>
                                        <li class="checked">def</li>
                                    </ul>`),
                            });
                        });
                        it('should outdent an empty list within a list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">abc</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">[]<br></li></ul></li><li class="checked">def</li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">abc</li><li class="unchecked">[]<br></li><li class="checked">def</li></ul>',
                            });
                        });
                        it('should outdent an empty list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li style="list-style: none;"><ul class="checklist"><li class="checked"><br>[]</li></ul></li></ul>',
                                stepFunction: backspace,
                                // empty ligne without anything are unchecked
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                            });
                        });
                        it("should outdent a list to the point that it's a paragraph", async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<p>[]<br></p>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p><br></p><ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<p><br></p><p>[]<br></p>',
                            });
                        });
                    });
                    describe('Complex merges', () => {
                        it('should merge a list item into a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abcd</p><ul class="checklist"><li class="checked">ef[]gh</li><li class="checked">ij</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                },
                                contentAfter:
                                    '<p>abc[]gh</p><ul class="checklist"><li class="checked">ij</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abcd</p><ul class="checklist"><li class="unchecked">ef[]gh</li><li class="checked">ij</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                },
                                contentAfter:
                                    '<p>abc[]gh</p><ul class="checklist"><li class="checked">ij</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abcd</p><ul class="checklist"><li class="checked">ef[]gh</li><li class="unchecked">ij</li></ul>',
                                stepFunction: async (editor: JWEditor) => {
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                    await deleteBackward(editor);
                                },
                                contentAfter:
                                    '<p>abc[]gh</p><ul class="checklist"><li class="unchecked">ij</li></ul>',
                            });
                        });
                        it('should merge a paragraph into a list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li></ul><p>[]def</p>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li></ul>',
                            });
                        });
                        it('should treat two blocks in a list item as two list items and merge them', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><p>abc</p></li><li class="checked"><p>def</p><p>[]ghi</p></li><li class="checked"><p>klm</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">def[]ghi</li><li class="checked">klm</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><h1>abc</h1></li><li class="checked"><h2>def</h2><h3>[]ghi</h3></li><li class="checked"><h4>klm</h4></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                // Headings aren't, as they do provide extra information.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><h1>abc</h1></li><li class="checked"><h2>def[]ghi</h2></li><li class="checked"><h4>klm</h4></li></ul>',
                            });
                        });
                        it('should merge a bold list item into a non-formatted list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked"><b>de</b>fg</li><li class="checked"><b>[]hij</b>klm</li><li class="checked">nop</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked"><b>de</b>fg[]<b>hij</b>klm</li><li class="checked">nop</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><p>abc</p></li><li class="checked"><p><b>de</b>fg</p><p><b>[]hij</b>klm</p></li><li class="checked"><p>nop</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Two paragraphs in a list item = Two list items.
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked"><b>de</b>fg[]<b>hij</b>klm</li><li class="checked">nop</li></ul>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a list item with ending without formatting', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><i>abc</i>def</li></ul><p><b>[]ghi</b>jkl</p>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><i>abc</i>def[]<b>ghi</b>jkl</li></ul>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a list item with ending with italic text', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><b>abc</b><i>def</i></li></ul><p><b>[]ghi</b>jkl</p>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked"><b>abc</b><i>def[]</i><b>ghi</b>jkl</li></ul>',
                            });
                        });
                    });
                });
                describe('Mixed', () => {
                    describe('Checklist to unordered', () => {
                        it('should merge an checklist list into an unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>a</li></ul><ul class="checklist"><li>[]b</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>a</li></ul><ul class="checklist"><li><p>[]b</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ul><li>a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><p>a</p></li></ul><ul class="checklist"><li>[]b</li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ul><li>a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><p>a</p></li></ul><ul class="checklist"><li><p>[]b</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter: '<ul><li>a[]b</li></ul>',
                            });
                        });
                        it('should merge an checklist list item that is in an unordered list item into a non-indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul class="checklist"><li class="checked">[]def</li><li class="checked">ghi</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul><li>abc[]def</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ghi</li></ul></li></ul>',
                            });
                        });
                        it('should merge an checklist list item into an unordered list item that is in the same checklist list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li style="list-style: none;"><ul><li>abc</li></ul></li><li>[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li style="list-style: none;"><ul><li>abc[]def</li></ul></li></ul>',
                            });
                        });
                        it('should merge the only item in an checklist list that is in an unordered list into a checklist item that is in the same unordered list, and remove the now empty checklist list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul class="checklist"><li class="checked">[]def</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>abc[]def</li></ul>',
                            });
                        });
                        it('should outdent an checklist list item that is within a unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ul class="checklist"><li class="checked">[]abc</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>[]abc</li></ul>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abc</p><ul><li style="list-style: none;"><ul class="checklist"><li class="checked">[]def</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<p>abc</p><ul><li>[]def</li></ul>',
                            });
                        });
                        it('should outdent an empty checklist list item within an unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">[]<br></li><li><br></li></ul></li><li>def</li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul><li>abc</li><li>[]<br></li><li style="list-style: none;"><ul class="checklist"><li class="unchecked"><br></li></ul></li><li>def</li></ul>',
                            });
                        });
                        it('should outdent an empty checklist list within an unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">[]<br></li></ul></li><li>def</li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>abc</li><li>[]<br></li><li>def</li></ul>',
                            });
                        });
                        it('should outdent an empty checklist list within an unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ul class="checklist"><li class="unchecked"><br>[]</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter: '<ul><li>[]<br></li></ul>',
                            });
                        });
                    });
                    describe('Unordered to checklist', () => {
                        it('should merge an unordered list into an checklist list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">a</li></ul><ul><li>[]b</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">a</li></ul><ul><li><p>[]b</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><p>a</p></li></ul><ul><li>[]b</li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">a[]b</li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked"><p>a</p></li></ul><ul><li><p>[]b</p></li></ul>',
                                stepFunction: deleteBackward,
                                // Paragraphs in list items are treated as nonsense.
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">a[]b</li></ul>',
                            });
                        });
                        it('should merge an unordered list item that is in an checklist list item into a non-indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">abc</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>[]def</li>
                                                <li>ghi</li>
                                            </ul>
                                        </li>
                                    </ul>`),
                                stepFunction: deleteBackward,
                                contentAfter: unformat(`
                                    <ul class="checklist">
                                        <li class="checked">abc[]def</li>
                                        <li style="list-style: none;">
                                            <ul>
                                                <li>ghi</li>
                                            </ul>
                                        </li>
                                    </ul>`),
                            });
                        });
                        it('should merge an unordered list item into an checklist list item that is in the same unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li style="list-style: none;"><ul class="checklist"><li class="checked">abc</li></ul></li><li>[]def</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul><li style="list-style: none;"><ul class="checklist"><li class="checked">abc[]def</li></ul></li></ul>',
                            });
                        });
                        it('should merge the only item in an unordered list that is in an checklist list into a checklist item that is in the same checklist list, and remove the now empty unordered list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li style="list-style: none;"><ul><li>[]def</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc[]def</li></ul>',
                            });
                        });
                        it('should outdent an unordered list item that is within a checklist list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li style="list-style: none;"><ul><li>[]abc</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">[]abc</li></ul>',
                            });
                            // With a paragraph before the list:
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>abc</p><ul class="checklist"><li style="list-style: none;"><ul><li>[]def</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<p>abc</p><ul class="checklist"><li class="unchecked">[]def</li></ul>',
                            });
                        });
                        it('should outdent an empty unordered list item within an checklist list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li style="list-style: none;"><ul><li>[]<br></li><li><br></li></ul></li><li class="checked">def</li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">[]<br></li><li style="list-style: none;"><ul><li><br></li></ul></li><li class="checked">def</li></ul>',
                            });
                        });
                        it('should outdent an empty unordered list within an checklist list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">abc</li><li style="list-style: none;"><ul><li>[]<br></li></ul></li><li class="checked">def</li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">abc</li><li class="checked">[]<br></li><li class="checked">def</li></ul>',
                            });
                        });
                        it('should outdent an empty unordered list within an checklist list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li style="list-style: none;"><ul><li><br>[]</li></ul></li></ul>',
                                stepFunction: backspace,
                                contentAfter:
                                    '<ul class="checklist"><li class="unchecked">[]<br></li></ul>',
                            });
                        });
                    });
                });
            });
            describe('Selection not collapsed', () => {
                // Note: All tests on checklist lists should be duplicated
                // with unordered lists, and vice versa.
                describe('Checklist', () => {
                    it('should delete text within a checklist item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd]ef</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]ef</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd[ef</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]ef</li></ul>',
                        });
                    });
                    it('should delete all the text in a checklist item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">[abc]</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">[]<br></li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">]abc[</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">[]<br></li></ul>',
                        });
                    });
                    it('should delete across two list items', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd</li><li class="checked">ef]gh</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd</li><li class="unchecked">ef]gh</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd</li><li class="checked">ef[gh</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd</li><li class="unchecked">ef[gh</li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                    });
                    it('should delete across an unindented list item and an indented list item', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef]gh</li></ul></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab[cd</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">ef]gh</li></ul></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef[gh</li></ul></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<ul class="checklist"><li class="checked">ab]cd</li><li style="list-style: none;"><ul class="checklist"><li class="unchecked">ef[gh</li></ul></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<ul class="checklist"><li class="unchecked">ab[]gh</li></ul>',
                        });
                    });
                    it('should delete a checklist', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>abc[</p><ul class="checklist"><li class="checked"><p>def]</p></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc[]</p>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p>abc]</p><ul class="checklist"><li class="checked"><p>def[</p></li></ul>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>abc[]</p>',
                        });
                    });
                    it('should merge the contents of a checklist item within a divider into a heading, and leave the rest of its list as it is', async () => {
                        // Forward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a[b</h1><p>de</p><div><ul class="checklist"><li class="checked">fg</li><li class="checked">h]i</li><li class="checked">jk</li></ul></div>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="checked">jk</li></ul></div>',
                        });
                        // Backward selection
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<h1>a]b</h1><p>de</p><div><ul class="checklist"><li class="checked">fg</li><li class="checked">h[i</li><li class="checked">jk</li></ul></div>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<h1>a[]i</h1><div><ul class="checklist"><li class="checked">jk</li></ul></div>',
                        });
                    });
                });
                describe('Mixed', () => {
                    describe('Ordered to unordered', () => {
                        it('should delete across an checklist list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab[cd</li></ul><ul><li>ef]gh</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab]cd</li></ul><ul><li>ef[gh</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                        });
                        it('should delete across an checklist list item and an unordered list item within an checklist list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab[cd</li><li style="list-style: none;"><ul><li>ef]gh</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul class="checklist"><li class="checked">ab]cd</li><li style="list-style: none;"><ul><li>ef[gh</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter:
                                    '<ul class="checklist"><li class="checked">ab[]gh</li></ul>',
                            });
                        });
                        it('should delete an checklist list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[</p><ul><li>cd</li></ul><ul class="checklist"><li class="checked">ef]</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]</p>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab]</p><ul><li>cd</li></ul><ul class="checklist"><li class="checked">ef[</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]</p>',
                            });
                        });
                    });
                    describe('Unordered to checklist', () => {
                        it('should delete across an unordered list and an checklist list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab[cd</li></ul><ul class="checklist"><li class="checked">ef]gh</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab]cd</li></ul><ul class="checklist"><li class="checked">ef[gh</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                        });
                        it('should delete across an unordered list item and an checklist list item within an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab[cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef]gh</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab]cd</li><li style="list-style: none;"><ul class="checklist"><li class="checked">ef[gh</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                        });
                        it('should delete an checklist list and an unordered list', async () => {
                            // Forward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab[</p><ul class="checklist"><li class="checked">cd</li></ul><ul><li>ef]</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]</p>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<p>ab]</p><ul class="checklist"><li class="checked">cd</li></ul><ul><li>ef[</li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]</p>',
                            });
                        });
                    });
                });
            });
        });
        describe('insertParagraphBreak', () => {
            describe('Checklist', () => {
                describe('Selection collapsed', () => {
                    describe('Checklist', () => {
                        describe('Basic', () => {
                            it('should add an empty list item before a checklist item', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="checked">[]abc</li></ul>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter:
                                        '<ul class="checklist"><li class="checked"><br></li><li class="unchecked">[]abc</li></ul>',
                                });
                            });
                            it('should split a checklist item in two', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="checked">ab[]cd</li></ul>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter:
                                        '<ul class="checklist"><li class="checked">ab</li><li class="unchecked">[]cd</li></ul>',
                                });
                            });
                            it('should add an empty list item after a checklist item', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="checked">abc[]</li></ul>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter:
                                        '<ul class="checklist"><li class="checked">abc</li><li class="unchecked">[]<br></li></ul>',
                                });
                            });
                        });
                        describe('Removing items', () => {
                            it('should add an empty list item at the end of a checklist, then remove it', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="checked">abc[]</li></ul>',
                                    stepFunction: async (editor: JWEditor) => {
                                        await insertParagraphBreak(editor);
                                        await insertParagraphBreak(editor);
                                    },
                                    contentAfter:
                                        '<ul class="checklist"><li class="checked">abc</li></ul><p>[]<br></p>',
                                });
                            });
                            it('should add an empty list item at the end of an indented list, then remove it', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="checked">abc</li><li style="list-style: none;"><ul class="checklist"><li class="checked">def[]</li></ul></li><li class="checked">ghi</li></ul>',
                                    stepFunction: async (editor: JWEditor) => {
                                        await insertParagraphBreak(editor);
                                        await insertParagraphBreak(editor);
                                    },
                                    contentAfter:
                                        '<ul class="checklist"><li class="checked">abc</li><li style="list-style: none;"><ul class="checklist"><li class="checked">def</li></ul></li><li class="unchecked">[]<br></li><li class="checked">ghi</li></ul>',
                                });
                            });
                            it('should remove a checklist', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="checked"><p>[]<br></p></li></ul>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter: '<p>[]<br></p>',
                                });
                            });
                            it('should remove a checklist set to bold', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="checked"><p><b>[]<br></b></p></li></ul>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter: '<p>[]<br></p>',
                                });
                            });
                        });
                        describe('With attributes', () => {
                            it('should add two list items at the end of a checklist with a class', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist a"><li class="checked">abc[]</li></ul>',
                                    stepFunction: async (editor: JWEditor) => {
                                        await insertParagraphBreak(editor);
                                        await insertText(editor, 'b');
                                        await insertParagraphBreak(editor);
                                    },
                                    contentAfter:
                                        '<ul class="checklist a"><li class="checked">abc</li><li class="unchecked">b</li><li class="unchecked">[]<br></li></ul>',
                                });
                            });
                            it('should add two list items with a class at the end of a checklist', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="a checked">abc[]</li></ul>',
                                    stepFunction: async (editor: JWEditor) => {
                                        await insertParagraphBreak(editor);
                                        await insertText(editor, 'b');
                                        await insertParagraphBreak(editor);
                                    },
                                    contentAfter:
                                        '<ul class="checklist"><li class="a checked">abc</li><li class="a unchecked">b</li><li class="a unchecked">[]<br></li></ul>',
                                });
                            });
                            it('should add two list items with a class and a div at the end of a checklist', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="a checked"><div>abc[]</div></li></ul>',
                                    stepFunction: async (editor: JWEditor) => {
                                        await insertParagraphBreak(editor);
                                        await insertText(editor, 'b');
                                        await insertParagraphBreak(editor);
                                    },
                                    contentAfter:
                                        '<ul class="checklist"><li class="a checked"><div>abc</div></li><li class="a unchecked"><div>b</div></li><li class="a unchecked"><div>[]<br></div></li></ul>',
                                });
                            });
                            it('should add two list items with a div with a class at the end of a checklist', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul class="checklist"><li class="checked"><div class="a">abc[]</div></li></ul>',
                                    stepFunction: async (editor: JWEditor) => {
                                        await insertParagraphBreak(editor);
                                        await insertText(editor, 'b');
                                        await insertParagraphBreak(editor);
                                    },
                                    contentAfter:
                                        '<ul class="checklist"><li class="checked"><div class="a">abc</div></li><li class="unchecked"><div class="a">b</div></li><li class="unchecked"><div class="a">[]<br></div></li></ul>',
                                });
                            });
                            it('should add two list items with a font at the end of a checklist within a checklist', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: unformat(`
                                        <ul class="checklist">
                                            <li class="checked">ab</li>
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="checked">
                                                        <font style="color: red;">cd[]</font>
                                                    </li>
                                                </ul>
                                            </li>
                                            <li class="checked">ef</li>
                                        </ul>`),
                                    stepFunction: async (editor: JWEditor) => {
                                        await insertParagraphBreak(editor);
                                        await insertText(editor, 'b');
                                        await insertParagraphBreak(editor);
                                    },
                                    contentAfter: unformat(`
                                        <ul class="checklist">
                                            <li class="unchecked">ab</li>
                                            <li style="list-style: none;">
                                                <ul class="checklist">
                                                    <li class="checked"><font style="color: red;">cd</font></li>
                                                    <li class="unchecked">b</li>
                                                    <li class="unchecked">[]<br></li>
                                                </ul>
                                            </li>
                                            <li class="checked">ef</li>
                                        </ul>`),
                                });
                            });
                        });
                    });
                });
                describe('Selection not collapsed', () => {
                    describe('Checklist', () => {
                        it('should delete part of a checklist item, then split it', async () => {
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
                        it('should delete all contents of a checklist item, then split it', async () => {
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
            });
        });
        describe('indent', () => {
            describe('Checklist', () => {
                it('should indent a checklist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">a[b]c</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">a[b]c</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">a[b]c</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">a[b]c</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                });
                it('should indent a checklist and previous ligne become the "title"', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li class="checked">d[e]f</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                    <li class="checked">d[e]f</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li class="unchecked">d[e]f</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                    <li class="unchecked">d[e]f</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li class="unchecked">d[e]f</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                    <li class="unchecked">d[e]f</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li class="checked">d[e]f</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                    <li class="checked">d[e]f</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                });
                it('should indent a checklist and merge it with previous siblings', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">def</li>
                                    </ul>
                                </li>
                                <li class="checked">g[h]i</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">def</li>
                                        <li class="checked">g[h]i</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">def</li>
                                    </ul>
                                </li>
                                <li class="checked">g[h]i</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">def</li>
                                        <li class="checked">g[h]i</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">def</li>
                                    </ul>
                                </li>
                                <li class="unchecked">g[h]i</li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">def</li>
                                        <li class="unchecked">g[h]i</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                });
                it('should indent a checklist and merge it with next siblings', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li class="checked">d[e]f</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">ghi</li>
                                    </ul>
                                </li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">d[e]f</li>
                                        <li class="checked">ghi</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li class="checked">d[e]f</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">ghi</li>
                                    </ul>
                                </li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">d[e]f</li>
                                        <li class="checked">ghi</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li class="unchecked">d[e]f</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">ghi</li>
                                    </ul>
                                </li>
                            </ul>`),
                        stepFunction: indentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">d[e]f</li>
                                        <li class="unchecked">ghi</li>
                                    </ul>
                                </li>
                            </ul>`),
                    });
                });
            });
        });
        describe('outdent', () => {
            describe('Checklist', () => {
                it('should outdent a checklist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">a[b]c</li>
                                    </ul>
                                </li>
                            </ul>`),
                        stepFunction: outdentList,
                        contentAfter: unformat(`
                        <ul class="checklist">
                            <li class="checked">a[b]c</li>
                        </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">a[b]c</li>
                                    </ul>
                                </li>
                            </ul>`),
                        stepFunction: outdentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">a[b]c</li>
                            </ul>`),
                    });
                });
                it('should outdent a checklist and previous ligne as "title"', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                    <li class="checked">d[e]f</li>
                                    </ul>
                                </li>
                            </ul>`),
                        stepFunction: outdentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="checked">abc</li>
                                <li class="checked">d[e]f</li>
                            </ul>`),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                    <li class="unchecked">d[e]f</li>
                                    </ul>
                                </li>
                            </ul>`),
                        stepFunction: outdentList,
                        contentAfter: unformat(`
                            <ul class="checklist">
                                <li class="unchecked">abc</li>
                                <li class="unchecked">d[e]f</li>
                            </ul>`),
                    });
                });
            });
        });
    });
    describe('toggleListCheck', () => {
        it('should throw if we try to check an outside item', async () => {
            const checklist = new ChecklistNode();
            const node = new CharNode('a');
            expect(() => {
                checklist.check(node);
            }).to.throw();
        });
        it('should do nothing if do not click on the checkbox', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">1</li>
                    </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[0];
                    await click(li, { clientX: li.getBoundingClientRect().left + 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">[]1</li>
                    </ul>`),
            });
        });
        it('should check a simple item', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">1</li>
                    </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[0];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="checked">[]1</li>
                    </ul>`),
            });
        });
        it('should uncheck a simple item', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                    <ul class="checklist">
                        <li class="checked">1</li>
                    </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[0];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">[]1</li>
                    </ul>`),
            });
        });
        it('should check a nested item and the previous checklist item used as title', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                <ul class="checklist">
                    <li class="unchecked">2</li>
                    <li style="list-style: none;">
                        <ul class="checklist">
                            <li class="checked">2.1</li>
                            <li class="unchecked">2.2</li>
                        </ul>
                    </li>
                </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[2];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                <ul class="checklist">
                    <li class="checked">2</li>
                    <li style="list-style: none;">
                        <ul class="checklist">
                            <li class="checked">2.1</li>
                            <li class="checked">[]2.2</li>
                        </ul>
                    </li>
                </ul>`),
            });
        });
        it('should uncheck a nested item and the previous checklist item used as title', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                <ul class="checklist">
                    <li class="checked">2</li>
                    <li style="list-style: none;">
                        <ul class="checklist">
                            <li class="checked">2.1</li>
                            <li class="checked">2.2</li>
                        </ul>
                    </li>
                </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[2];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                <ul class="checklist">
                    <li class="unchecked">2</li>
                    <li style="list-style: none;">
                        <ul class="checklist">
                            <li class="checked">2.1</li>
                            <li class="unchecked">[]2.2</li>
                        </ul>
                    </li>
                </ul>`),
            });
        });
        it('should check a nested item and the wrapper wrapper title', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="unchecked">3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.2.1</li>
                                        <li class="unchecked">3.2.2</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[3];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="checked">3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="checked">3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.2.1</li>
                                        <li class="checked">[]3.2.2</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`),
            });
        });
        it('should uncheck a nested item and the wrapper wrapper title', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                    <ul class="checklist">
                        <li class="checked">3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="checked">3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.1.1</li>
                                        <li class="checked">3.1.2</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[3];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="unchecked">3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.1.1</li>
                                        <li class="unchecked">[]3.1.2</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`),
            });
        });
        it('should check all nested checklist item', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                        <ul class="checklist">
                            <li class="unchecked">3</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="unchecked">3.1</li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">3.1.1</li>
                                            <li class="unchecked">3.1.2</li>
                                        </ul>
                                    </li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">3.2.1</li>
                                            <li class="unchecked">3.2.2</li>
                                        </ul>
                                    </li>
                                    <li class="unchecked">3.3</li>
                                </ul>
                            </li>
                        </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[0];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="checked">[]3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="checked">3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.1.1</li>
                                        <li class="checked">3.1.2</li>
                                    </ul>
                                </li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.2.1</li>
                                        <li class="checked">3.2.2</li>
                                    </ul>
                                </li>
                                <li class="checked">3.3</li>
                            </ul>
                        </li>
                    </ul>`),
            });
        });
        it('should uncheck all nested checklist item', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                        <ul class="checklist">
                            <li class="checked">3</li>
                            <li style="list-style: none;">
                                <ul class="checklist">
                                    <li class="checked">3.1</li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">3.1.1</li>
                                            <li class="checked">3.1.2</li>
                                        </ul>
                                    </li>
                                    <li style="list-style: none;">
                                        <ul class="checklist">
                                            <li class="checked">3.2.1</li>
                                            <li class="checked">3.2.2</li>
                                        </ul>
                                    </li>
                                    <li class="checked">3.3</li>
                                </ul>
                            </li>
                        </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[0];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">[]3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="unchecked">3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">3.1.1</li>
                                        <li class="unchecked">3.1.2</li>
                                    </ul>
                                </li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">3.2.1</li>
                                        <li class="unchecked">3.2.2</li>
                                    </ul>
                                </li>
                                <li class="unchecked">3.3</li>
                            </ul>
                        </li>
                    </ul>`),
            });
        });
        it('should check all nested checklist item and update wrapper title', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="unchecked">3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.2.1</li>
                                        <li class="unchecked">3.2.2</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[1];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="checked">3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="checked">[]3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.2.1</li>
                                        <li class="checked">3.2.2</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`),
            });
        });
        it('should uncheck all nested checklist item and update wrapper title', async () => {
            await testEditor(BasicEditor, {
                contentBefore: unformat(`
                    <ul class="checklist">
                        <li class="checked">3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="checked">3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="checked">3.2.1</li>
                                        <li class="checked">3.2.2</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`),
                stepFunction: async () => {
                    const editable = document.querySelector('[contenteditable=true]');
                    const lis = editable.querySelectorAll('li.checked, li.unchecked');
                    const li = lis[1];
                    await click(li, { clientX: li.getBoundingClientRect().left - 10 });
                },
                contentAfter: unformat(`
                    <ul class="checklist">
                        <li class="unchecked">3</li>
                        <li style="list-style: none;">
                            <ul class="checklist">
                                <li class="unchecked">[]3.1</li>
                                <li style="list-style: none;">
                                    <ul class="checklist">
                                        <li class="unchecked">3.2.1</li>
                                        <li class="unchecked">3.2.2</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`),
            });
        });
    });
});
