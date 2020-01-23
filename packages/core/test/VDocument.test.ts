import JWEditor from '../src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { FormatParams, InsertParams, InsertTextParams, ListParams } from '../src/CorePlugin';
import { LineBreakNode } from '../../plugin-linebreak/LineBreakNode';
import { VRange, withRange } from '../src/VRange';
import { RelativePosition, Point } from '../src/VNodes/VNode';
import { ListType } from '../../plugin-list/ListNode';
import { BasicEditor } from '../../../bundles/BasicEditor';

const deleteForward = (editor: JWEditor): void => editor.execCommand('deleteForward');
const deleteBackward = (editor: JWEditor): void => editor.execCommand('deleteBackward');
const insertParagraphBreak = (editor: JWEditor): void => editor.execCommand('insertParagraphBreak');
const insertLineBreak = (editor: JWEditor): void => {
    const params: InsertParams = {
        node: new LineBreakNode(),
    };
    editor.execCommand('insert', params);
};
const insertText = function(editor, text: string): void {
    const params: InsertTextParams = {
        text: text,
    };
    editor.execCommand('insertText', params);
};
const applyFormat = (editor: JWEditor, format: 'bold' | 'italic' | 'underline'): void => {
    const formatParams: FormatParams = {
        format: format,
    };
    editor.execCommand('applyFormat', formatParams);
};
const toggleOrderedList = (editor: JWEditor): void => {
    const params: ListParams = {
        type: ListType.ORDERED,
    };
    editor.execCommand('toggleList', params);
};
const toggleUnorderedList = (editor: JWEditor): void => {
    const params: ListParams = {
        type: ListType.UNORDERED,
    };
    editor.execCommand('toggleList', params);
};

describe('stores', () => {
    describe('VDocument', () => {
        describe('insertText', () => {
            describe('bold', () => {
                describe('Selection collapsed', () => {
                    it('should insert char not bold when selection in between two paragraphs', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>a</b></p><p>[]</p><p><b>b</b></p>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: '<p><b>a</b></p><p>c[]</p><p><b>b</b></p>',
                        });
                    });
                    it('should insert char bold when the selection in first position and next char is bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>[]a</b>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                            contentAfter: '<b>b[]a</b>',
                        });
                    });
                    it('should insert char not bold when the selection in first position and next char is not bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '[]a',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                            contentAfter: 'b[]a',
                        });
                    });
                    it('should insert char bold when previous char is bold and the next is not bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>a[]</b>b',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: '<b>ac[]</b>b',
                        });
                    });
                    it('should insert char not bold, when previous char is not bold, next is not bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: 'a[]b',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: 'ac[]b',
                        });
                    });
                    it('should insert char bold when previous char is bold and the next is not bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>a</b>[]b',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: '<b>ac[]</b>b',
                        });
                    });
                    it('should insert char not bold because char on a different parent should not be considered', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>a</b></p><p>[]b</p>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: '<p><b>a</b></p><p>c[]b</p>',
                        });
                    });
                });

                describe('Selection not collapsed', () => {
                    it('should replace without bold when nothing bold between selection and nothing bold outside selection', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '[a]',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                            contentAfter: 'b[]',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: 'a[b]c',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'd'),
                            contentAfter: 'ad[]c',
                        });
                    });
                    it('should replace without bold when nothing bold between selection and everything bold outside selection', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>a</b>[b]<b>c</b>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'd'),
                            contentAfter: '<b>a</b>d[]<b>c</b>',
                        });
                    });
                    it('should replace with bold when anything inside the selection is bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>[a</b>b]<b>c</b>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'd'),
                            contentAfter: '<b>d[]c</b>',
                        });
                    });
                });
            });
        });
        describe('applyFormat', () => {
            describe('Selection collapsed', () => {
                it('should make bold the next insertion', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: '<b>b[]</b>a',
                    });
                });
                it('should not make bold the next insertion when applyFormat 2 times', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: 'b[]a',
                    });
                });
                it('should make bold the next insertion when applyFormat 1 time, after the first char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: 'a<b>b[]</b>',
                    });
                });
                it('should not make bold the next insertion when applyFormat 2 times, after the first char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: 'ab[]',
                    });
                });
                it('should not make bold the next insertion when applyFormat 1 time after the first char that is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: '<b>a</b>b[]',
                    });
                });
                it('should make bold the next insertion when applyFormat 2 times after the first char that is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: '<b>ab[]</b>',
                    });
                });
                it('should apply multiples format', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            applyFormat(editor, 'underline');
                            insertText(editor, 'b');
                        },
                        contentAfter: '<b><u>b[]</u></b>a',
                    });
                });
            });

            describe('Selection not collapsed', () => {
                it('should be bold when selected is not bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[b]c',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[<b>b]</b>c',
                    });
                });
                it('should not be bold when selected is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a<b>[b]</b>c',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[b]c',
                    });
                });
                it('should be bold when one of the selected is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a<b>[b</b>c]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[<b>bc]</b>',
                    });
                });
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
                                contentBefore:
                                    '<ul><li>a[b</li></ul><p>cd</p><ul><li>e]f</li></ul>',
                                stepFunction: toggleUnorderedList,
                                contentAfter: '<ul><li>a[b</li><li>cd</li><li>e]f</li></ul>',
                            });
                        });
                        it('should turn a list item, a paragraph and another list into one list with all three as list items', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab<li>c[d</li></ul><p>ef</p><ul><li>g]h</li></ul>',
                                stepFunction: toggleUnorderedList,
                                contentAfter:
                                    '<ul><li>ab</li><li>c[d</li><li>ef</li><li>g]h</li></ul>',
                            });
                        });
                        it('should turn a list, a paragraph and a list item into one list with all three as list items', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>a[b</li></ul><p>cd</p><ul><li>e]f</li><li>gh</li></ul>',
                                stepFunction: toggleUnorderedList,
                                contentAfter:
                                    '<ul><li>a[b</li><li>cd</li><li>e]f</li><li>gh</li></ul>',
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
                                contentBefore:
                                    '<ol><li>a[b</li></ol><p>cd</p><ol><li>e]f</li></ol>',
                                stepFunction: toggleOrderedList,
                                contentAfter: '<ol><li>a[b</li><li>cd</li><li>e]f</li></ol>',
                            });
                        });
                        it('should turn a list item, a paragraph and another list into one list with all three as list items', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>ab<li>c[d</li></ol><p>ef</p><ol><li>g]h</li></ol>',
                                stepFunction: toggleOrderedList,
                                contentAfter:
                                    '<ol><li>ab</li><li>c[d</li><li>ef</li><li>g]h</li></ol>',
                            });
                        });
                        it('should turn a list, a paragraph and a list item into one list with all three as list items', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>a[b</li></ol><p>cd</p><ol><li>e]f</li><li>gh</li></ol>',
                                stepFunction: toggleOrderedList,
                                contentAfter:
                                    '<ol><li>a[b</li><li>cd</li><li>e]f</li><li>gh</li></ol>',
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
                            contentBefore:
                                '<p>a[b</p><ul><li>cd<ul><li>ef</li></ul></li><li>gh</li></ul><p>i]j</p>',
                            stepFunction: toggleOrderedList,
                            contentAfter:
                                '<ol><li>a[b</li><li>cd<ol><li>ef</li></ol></li><li>gh</li><li>i]j</li></ol>',
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
                            contentBefore:
                                '<ul><li>ab<li>c[d</li></ul><p>ef</p><ol><li>g]h</li></ol>',
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
                            contentBefore: [
                                /* eslint-disable prettier/prettier */
                                '<ul>',
                                    '<li>ab',
                                        '<ul>',
                                            '<li>c[d</li>',
                                            '<li>e]f</li>',
                                        '</ul>',
                                    '</li>',
                                    '<li>gh</li>',
                                '</ul>',
                            ].join(''),
                            stepFunction: toggleOrderedList,
                            contentAfter: [
                                '<ul>',
                                    '<li>ab',
                                        '<ol>',
                                            '<li>c[d</li>',
                                            '<li>e]f</li>',
                                        '</ol>',
                                    '</li>',
                                    '<li>gh</li>',
                                '</ul>',
                            ].join(''),
                                /* eslint-enable prettier/prettier */
                        });
                    });
                    it('should turn an unordered list with mixed nested elements into an ordered list with only unordered elements', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: [
                                /* eslint-disable prettier/prettier */
                                '<ul>',
                                    '<li>a[b</li>',
                                    '<li>cd',
                                        '<ul>',
                                            '<li>ef</li>',
                                            '<li>gh',
                                                '<ol>',
                                                    '<li>ij</li>',
                                                    '<li>kl',
                                                        '<ul>',
                                                            '<li>mn</li>',
                                                        '</ul>',
                                                    '</li>',
                                                    '<li>op</li>',
                                                '</ol>',
                                            '</li>',
                                        '</ul>',
                                    '</li>',
                                    '<li>q]r</li>',
                                    '<li>st</li>',
                                '</ul>',
                            ].join(''),
                            stepFunction: toggleOrderedList,
                            contentAfter: [
                                '<ol>',
                                    '<li>a[b</li>',
                                    '<li>cd',
                                        '<ol>',
                                            '<li>ef</li>',
                                            '<li>gh',
                                                '<ol>',
                                                    '<li>ij</li>',
                                                    '<li>kl',
                                                        '<ol>',
                                                            '<li>mn</li>',
                                                        '</ol>',
                                                    '</li>',
                                                    '<li>op</li>',
                                                '</ol>',
                                            '</li>',
                                        '</ol>',
                                    '</li>',
                                    '<li>q]r</li>',
                                '</ol>',
                                '<ul>',
                                    '<li>st</li>',
                                '</ul>',
                            ].join(''),
                                /* eslint-enable prettier/prettier */
                        });
                    });
                });
            });
        });
        // Note: implementing a test for deleteForward, make sure to implement
        // its equivalent for deleteBackward.
        describe('deleteForward', () => {
            describe('Selection collapsed', () => {
                describe('Basic', () => {
                    it('should do nothing', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]</p>',
                            stepFunction: deleteForward,
                            // A <br> is automatically added to make the <p>
                            // visible.
                            contentAfter: '<p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: deleteForward,
                            // The <br> is there only to make the <p> visible.
                            // It does not exist in VDocument and selecting it
                            // has no meaning in the DOM.
                            contentAfter: '<p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                    });
                    it('should delete the first character in a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>[]bc</p>',
                        });
                    });
                    it('should delete a character within a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>a[]bc</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>a[]c</p>',
                        });
                    });
                    it('should delete the last character in a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]c</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab[]</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab []c</p>',
                            stepFunction: deleteForward,
                            // The space should be converted to an unbreakable space
                            // so it is visible.
                            contentAfter: '<p>ab&nbsp;[]</p>',
                        });
                    });
                    it('should merge a paragraph into an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p><p>abc</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>[]abc</p>',
                        });
                    });
                });
                describe('Line breaks', () => {
                    describe('Single', () => {
                        it('should delete a leading line break', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>[]<br>abc</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>[]abc</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>[]<br> abc</p>',
                                stepFunction: deleteForward,
                                // The space after the <br> is expected to be parsed
                                // away, like it is in the DOM.
                                contentAfter: '<p>[]abc</p>',
                            });
                        });
                        it('should delete a line break within a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]<br>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]cd</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab []<br>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab []cd</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]<br> cd</p>',
                                stepFunction: deleteForward,
                                // The space after the <br> is expected to be parsed
                                // away, like it is in the DOM.
                                contentAfter: '<p>ab[]cd</p>',
                            });
                        });
                        it('should delete a trailing line break', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>abc[]<br><br></p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>abc[]</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>abc []<br><br></p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>abc&nbsp;[]</p>',
                            });
                        });
                        it('should delete a character and a line break, emptying a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>[]a<br><br></p><p>bcd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>[]<br></p><p>bcd</p>',
                            });
                        });
                        it('should delete a character before a trailing line break', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]c<br><br></p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]<br><br></p>',
                            });
                        });
                    });
                    describe('Consecutive', () => {
                        it('should merge a paragraph into a paragraph with 4 <br>', async () => {
                            // 1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab</p><p><br><br><br>[]cd</p>',
                            });
                            // 2-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                // This should be identical to 1
                                contentAfter: '<p>ab</p><p><br><br><br>[]cd</p>',
                            });
                        });
                        it('should delete a trailing line break', async () => {
                            // 3-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab</p><p><br><br>[]<br></p><p>cd</p>',
                            });
                        });
                        it('should delete a trailing line break, then merge a paragraph into a paragraph with 3 <br>', async () => {
                            // 3-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab</p><p><br><br>[]cd</p>',
                            });
                        });
                        it('should delete a line break', async () => {
                            // 4-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab</p><p><br>[]<br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete two line breaks', async () => {
                            // 4-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                            });
                        });
                        it('should delete two line breaks, then merge a paragraph into a paragraph with 2 <br>', async () => {
                            // 4-3
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab</p><p><br>[]cd</p>',
                            });
                        });
                        it('should delete a line break', async () => {
                            // 5-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab</p><p>[]<br><br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete two line breaks', async () => {
                            // 5-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab</p><p>[]<br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete three line breaks (emptying a paragraph)', async () => {
                            // 5-3
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                            });
                        });
                        it('should delete three line breaks, then merge a paragraph into an empty parargaph', async () => {
                            // 5-4
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab</p><p>[]cd</p>',
                            });
                        });
                        it('should merge a paragraph with 4 <br> into a paragraph with text', async () => {
                            // 6-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]<br><br><br><br></p><p>cd</p>',
                            });
                        });
                        it('should merge a paragraph with 4 <br> into a paragraph with text, then delete a line break', async () => {
                            // 6-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab[]<br><br><br></p><p>cd</p>',
                            });
                        });
                        it('should merge a paragraph with 4 <br> into a paragraph with text, then delete two line breaks', async () => {
                            // 6-3
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab[]<br><br></p><p>cd</p>',
                            });
                        });
                        it('should merge a paragraph with 4 <br> into a paragraph with text, then delete three line breaks', async () => {
                            // 6-4
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab[]</p><p>cd</p>',
                            });
                        });
                        it('should merge a paragraph with 4 <br> into a paragraph with text, then delete three line breaks, then merge two paragraphs with text', async () => {
                            // 6-5
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>ab[]cd</p>',
                            });
                        });
                    });
                });
                describe('Formats', () => {
                    it('should delete a character after a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[]</b>def</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p><b>abc[]</b>ef</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]def</p>',
                            stepFunction: deleteForward,
                            // The selection is normalized so we only have one way
                            // to represent a position.
                            contentAfter: '<p><b>abc[]</b>ef</p>',
                        });
                    });
                });
                describe('Merging different types of elements', () => {
                    it('should merge a paragraph with text into a heading1 with text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab[]</h1><p>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<h1>ab[]cd</h1>',
                        });
                    });
                    it('should merge an empty paragraph into a heading1 with text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab[]</h1><p><br></p>',
                            stepFunction: deleteForward,
                            contentAfter: '<h1>ab[]</h1>',
                        });
                    });
                });
                describe('Lists', () => {
                    describe('Basic', () => {
                        it('should do nothing', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li>[]<br></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>[]<br></li></ul>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<ul><li><ul><li>abc[]</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li><ul><li>abc[]</li></ul></li></ul>',
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
                    });
                    describe('Indented', () => {
                        it('should merge an indented list item into a non-indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>abc[]<ol><li>def</li><li>ghi</li></ol></li></ol>',
                                stepFunction: deleteForward,
                                contentAfter: '<ol><li>abc[]def<ol><li>ghi</li></ol></li></ol>',
                            });
                        });
                        it('should merge a non-indented list item into an indented list item', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><ul><li>abc[]</li></ul></li><li>def</li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li><ul><li>abc[]def</li></ul></li></ul>',
                            });
                        });
                        it('should merge the only item in an indented list into a non-indented list item and remove the now empty indented list', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>abc[]</li><li><ul><li>def</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>abc[]def</li></ul>',
                            });
                        });
                    });
                    describe('Complex merges', () => {
                        it('should merge a list item into a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab[]cd</p><ul><li>ef</li><li>gh</li></ul>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
                                    deleteForward(editor);
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
                                contentBefore:
                                    '<ul><li><i>abc</i>def[]</li></ul><p><b>ghi</b>jkl</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li><i>abc</i>def[]<b>ghi</b>jkl</li></ul>',
                            });
                        });
                        it('should merge a paragraph starting with bold text into a list item with ending with italic text', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li><b>abc</b><i>def[]</i></li></ul><p><b>ghi</b>jkl</p>',
                                stepFunction: deleteForward,
                                contentAfter:
                                    '<ul><li><b>abc</b><i>def[]</i><b>ghi</b>jkl</li></ul>',
                            });
                        });
                    });
                });
            });

            describe('Selection not collapsed', () => {
                it('should delete part of the text within a paragraph', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[cd]ef</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]ef</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]cd[ef</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]ef</p>',
                    });
                });
                it('should delete across two paragraphs', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[cd</p><p>ef]gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]gh</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]cd</p><p>ef[gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]gh</p>',
                    });
                });
                it('should delete all the text in a paragraph', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[abc]</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]abc[</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('should delete a complex selection accross format nodes and multiple paragraphs', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>kl]</i>mn</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>ab[]</b>mn</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>k]l</i>mn</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>kl[</i>mn</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>ab[]</b>mn</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>k[l</i>mn</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                    });
                });
                it('should delete all contents of a complex DOM with format nodes and multiple paragraphs', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>[abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn]</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>]abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn[</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('should delete a selection accross a heading1 and a paragraph', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab [cd</h1><p>ef]gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>ab []gh</h1>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab ]cd</h1><p>ef[gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>ab []gh</h1>',
                    });
                });
                it('should delete a selection from the beginning of a heading1 with a format to the middle of a paragraph', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1><b>[abcd</b></h1><p>ef]gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>[<b>abcd</b></h1><p>ef]gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1><b>]abcd</b></h1><p>ef[gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>]<b>abcd</b></h1><p>ef[gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                });
                describe('Lists', () => {
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
                                    '<ol><li>ab[cd</li><li><ol><li>ef]gh</li></ol></li></ol>',
                                stepFunction: deleteForward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>ab]cd</li><li><ol><li>ef[gh</li></ol></li></ol>',
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
                                    '<ul><li>ab[cd</li><li><ul><li>ef]gh</li></ul></li></ul>',
                                stepFunction: deleteForward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab]cd</li><li><ul><li>ef[gh</li></ul></li></ul>',
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
                                        '<ol><li>ab[cd</li><li><ul><li>ef]gh</li></ul></li></ol>',
                                    stepFunction: deleteForward,
                                    contentAfter: '<ol><li>ab[]gh</li></ol>',
                                });
                                // Backward selection
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>ab]cd</li><li><ul><li>ef[gh</li></ul></li></ol>',
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
                                        '<ul><li>ab[cd</li><li><ol><li>ef]gh</li></ol></li></ul>',
                                    stepFunction: deleteForward,
                                    contentAfter: '<ul><li>ab[]gh</li></ul>',
                                });
                                // Backward selection
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>ab]cd</li><li><ol><li>ef[gh</li></ol></li></ul>',
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
        });
        // Note: implementing a test for deleteBackward, make sure to implement
        // its equivalent for deleteForward.
        describe('deleteBackward', () => {
            describe('Selection collapsed', () => {
                describe('Basic', () => {
                    it('should do nothing', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]</p>',
                            stepFunction: deleteBackward,
                            // A <br> is automatically added to make the <p>
                            // visible.
                            contentAfter: '<p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: deleteBackward,
                            // The <br> is there only to make the <p> visible.
                            // It does not exist in VDocument and selecting it
                            // has no meaning in the DOM.
                            contentAfter: '<p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>[]abc</p>',
                        });
                    });
                    it('should delete the first character in a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>a[]bc</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>[]bc</p>',
                        });
                    });
                    it('should delete a character within a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]c</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>a[]c</p>',
                        });
                    });
                    it('should delete the last character in a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>ab[]</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab c[]</p>',
                            stepFunction: deleteBackward,
                            // The space should be converted to an unbreakable space
                            // so it is visible.
                            contentAfter: '<p>ab&nbsp;[]</p>',
                        });
                    });
                    it('should merge a paragraph into an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br></p><p>[]abc</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>[]abc</p>',
                        });
                    });
                });
                describe('Line breaks', () => {
                    describe('Single', () => {
                        it('should delete a leading line break', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p><br>[]abc</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>[]abc</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p><br>[] abc</p>',
                                stepFunction: deleteBackward,
                                // The space after the <br> is expected to be parsed
                                // away, like it is in the DOM.
                                contentAfter: '<p>[]abc</p>',
                            });
                        });
                        it('should delete a line break within a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab<br>[]cd</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]cd</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab <br>[]cd</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab []cd</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab<br>[] cd</p>',
                                stepFunction: deleteBackward,
                                // The space after the <br> is expected to be parsed
                                // away, like it is in the DOM.
                                contentAfter: '<p>ab[]cd</p>',
                            });
                        });
                        it('should delete a trailing line break', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>abc<br><br>[]</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>abc[]</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>abc<br>[]<br></p>',
                                stepFunction: deleteBackward,
                                // This should be identical to the one before.
                                contentAfter: '<p>abc[]</p>',
                            });
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>abc <br><br>[]</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>abc&nbsp;[]</p>',
                            });
                        });
                        it('should delete a character and a line break, emptying a paragraph', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>aaa</p><p><br>a[]</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>aaa</p><p>[]<br></p>',
                            });
                        });
                        it('should delete a character after a trailing line break', async () => {
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab<br>c[]</p>',
                                stepFunction: deleteBackward,
                                // A new <br> should be insterted, to make the first one
                                // visible.
                                contentAfter: '<p>ab<br>[]<br></p>',
                            });
                        });
                    });
                    describe('Consecutive', () => {
                        it('should merge a paragraph with 4 <br> into a paragraph with text', async () => {
                            // 1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab[]<br><br><br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete a line break', async () => {
                            // 2-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab</p><p>[]<br><br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete a line break, then merge a paragraph with 3 <br> into a paragraph with text', async () => {
                            // 2-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab[]<br><br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete a line break', async () => {
                            // 3-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab</p><p><br>[]<br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete two line breaks', async () => {
                            // 3-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab</p><p>[]<br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete two line breaks, then merge a paragraph with 3 <br> into a paragraph with text', async () => {
                            // 3-3
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab[]<br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete a line break', async () => {
                            // 4-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                                stepFunction: deleteBackward,
                                // A trailing line break is rendered as two <br>.
                                contentAfter: '<p>ab</p><p><br><br>[]<br></p><p>cd</p>',
                            });
                            // 5-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                                stepFunction: deleteBackward,
                                // This should be identical to 4-1
                                contentAfter: '<p>ab</p><p><br><br>[]<br></p><p>cd</p>',
                            });
                        });
                        it('should delete two line breaks', async () => {
                            // 4-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                // A trailing line break is rendered as two <br>.
                                contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                            });
                            // 5-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                // This should be identical to 4-2
                                contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                            });
                        });
                        it('should delete three line breaks (emptying a paragraph)', async () => {
                            // 4-3
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                            });
                            // 5-3
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                // This should be identical to 4-3
                                contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                            });
                        });
                        it('should delete three line breaks, then merge an empty parargaph into a paragraph with text', async () => {
                            // 4-4
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                // This should be identical to 4-4
                                contentAfter: '<p>ab[]</p><p>cd</p>',
                            });
                            // 5-4
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab[]</p><p>cd</p>',
                            });
                        });
                        it('should merge a paragraph into a paragraph with 4 <br>', async () => {
                            // 6-1
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                                stepFunction: deleteBackward,
                                contentAfter: '<p>ab</p><p><br><br><br>[]cd</p>',
                            });
                        });
                        it('should merge a paragraph into a paragraph with 4 <br>, then delete a trailing line break', async () => {
                            // 6-2
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab</p><p><br><br>[]cd</p>',
                            });
                        });
                        it('should merge a paragraph into a paragraph with 4 <br>, then delete two line breaks', async () => {
                            // 6-3
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab</p><p><br>[]cd</p>',
                            });
                        });
                        it('should merge a paragraph into a paragraph with 4 <br>, then delete three line breaks', async () => {
                            // 6-4
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab</p><p>[]cd</p>',
                            });
                        });
                        it('should merge a paragraph into a paragraph with 4 <br>, then delete three line breaks, then merge two paragraphs with text', async () => {
                            // 6-5
                            await testEditor(BasicEditor, {
                                contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                    deleteBackward(editor);
                                },
                                contentAfter: '<p>ab[]cd</p>',
                            });
                        });
                    });
                });
                describe('Formats', () => {
                    it('should delete a character before a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc<b>[]def</b></p>',
                            stepFunction: deleteBackward,
                            // The selection is normalized so we only have one way
                            // to represent a position.
                            contentAfter: '<p>ab[]<b>def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]<b>def</b></p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<p>ab[]<b>def</b></p>',
                        });
                    });
                });
                describe('Merging different types of elements', () => {
                    it('should merge a paragraph with text into a heading1 with text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab</h1><p>[]cd</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<h1>ab[]cd</h1>',
                        });
                    });
                    it('should merge an empty paragraph into a heading1 with text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab</h1><p>[]<br></p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<h1>ab[]</h1>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab</h1><p>[<br>]</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<h1>ab[]</h1>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<h1>ab</h1><p><br>[]</p>',
                            stepFunction: deleteBackward,
                            contentAfter: '<h1>ab[]</h1>',
                        });
                    });
                    it('should merge with previous node (default behaviour)', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<jw-block-a>a</jw-block-a><jw-block-b>[]b</jw-block-b>',
                            stepFunction: deleteBackward,
                            contentAfter: '<jw-block-a>a[]b</jw-block-a>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<jw-block-a>a</jw-block-a><jw-block-b>[<br>]</jw-block-b>',
                            stepFunction: deleteBackward,
                            contentAfter: '<jw-block-a>a[]</jw-block-a>',
                        });
                    });
                    it('should merge nested elements (default behaviour)', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<jw-block-a><jw-block-b>ab</jw-block-b></jw-block-a><jw-block-c><jw-block-d>[]cd</jw-block-d></jw-block-c>',
                            stepFunction: deleteBackward,
                            contentAfter:
                                '<jw-block-a><jw-block-b>ab[]cd</jw-block-b></jw-block-a>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<jw-block-a><jw-block-b>ab</jw-block-b></jw-block-a><jw-block-c><jw-block-d>[<br>]</jw-block-d></jw-block-c>',
                            stepFunction: deleteBackward,
                            contentAfter: '<jw-block-a><jw-block-b>ab[]</jw-block-b></jw-block-a>',
                        });
                    });
                });
                describe('Lists', () => {
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
                                    contentBefore: '<ol><li><ol><li>[]abc</li></ol></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li><ol><li>[]abc</li></ol></li></ol>',
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
                                    contentBefore:
                                        '<ol><li>abc</li><li>[]def</li><li>ghi</li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>abc[]def</li><li>ghi</li></ol>',
                                });
                                // Where the list item to merge into is empty, with an
                                // empty list item before.
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li><br></li><li><br></li><li>[]abc</li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li><br></li><li>[]abc</li></ol>',
                                });
                            });
                        });
                        describe('Indented', () => {
                            it('should merge an indented list item into a non-indented list item', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>abc<ol><li>[]def</li><li>ghi</li></ol></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>abc[]def<ol><li>ghi</li></ol></li></ol>',
                                });
                            });
                            it('should merge a non-indented list item into an indented list item', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li><ol><li>abc</li></ol></li><li>[]def</li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li><ol><li>abc[]def</li></ol></li></ol>',
                                });
                            });
                            it('should merge the only item in an indented list into a non-indented list item and remove the now empty indented list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>abc</li><li><ol><li>[]def</li></ol></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>abc[]def</li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            it.skip('should outdent a list item', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ol><li><ol><li>[]abc</li></ol></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>[]abc</li></ol>',
                                });
                                // With a paragraph before the list:
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<p>abc</p><ol><li><ol><li>[]def</li></ol></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<p>abc</p><ol><li>[]def</li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty list item within a list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>abc</li><li><ol><li>[]<br></li><li><br></li></ol></li><li>def</li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter:
                                        '<ol><li>abc</li><li>[]<br></li><li><ol></li><br></li></ol></li><li><p>def</p></li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty list within a list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>abc</li><li><ol><li>[]<br></li></ol></li><li>def</li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter:
                                        '<ol><li>abc</li><li>[]<br></li><li><p>def</p></li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ol><li><ol><li><br>[]</li></ol></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>[]<br></li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip("should outdent a list to the point that it's a paragraph", async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ol><li>[]<br></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<p>[]<br></p>',
                                });
                                // With a paragraph before the list:
                                await testEditor(BasicEditor, {
                                    contentBefore: '<p><br></p><ol><li>[]<br></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<p><br></p><p>[]<br></p>',
                                });
                            });
                        });
                        describe('Complex merges', () => {
                            it('should merge a list item into a paragraph', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<p>abcd</p><ol><li>ef[]gh</li><li>ij</li></ol>',
                                    stepFunction: (editor: JWEditor) => {
                                        deleteBackward(editor);
                                        deleteBackward(editor);
                                        deleteBackward(editor);
                                        deleteBackward(editor);
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
                                    contentAfter:
                                        '<ol><li>abc</li><li>def[]ghi</li><li>klm</li></ol>',
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
                                    contentBefore: '<ul><li><ul><li>[]abc</li></ul></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li><ul><li>[]abc</li></ul></li></ul>',
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
                                    contentBefore:
                                        '<ul><li>abc</li><li>[]def</li><li>ghi</li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>abc[]def</li><li>ghi</li></ul>',
                                });
                                // Where the list item to merge into is empty, with an
                                // empty list item before.
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li><br></li><li><br></li><li>[]abc</li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li><br></li><li>[]abc</li></ul>',
                                });
                            });
                        });
                        describe('Indented', () => {
                            it('should merge an indented list item into a non-indented list item', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>abc<ul><li>[]def</li><li>ghi</li></ul></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>abc[]def<ul><li>ghi</li></ul></li></ul>',
                                });
                            });
                            it('should merge a non-indented list item into an indented list item', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li><ul><li>abc</li></ul></li><li>[]def</li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li><ul><li>abc[]def</li></ul></li></ul>',
                                });
                            });
                            it('should merge the only item in an indented list into a non-indented list item and remove the now empty indented list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>abc</li><li><ul><li>[]def</li></ul></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>abc[]def</li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            it.skip('should outdent a list item', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ul><li><ul><li>[]abc</li></ul></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>[]abc</li></ul>',
                                });
                                // With a paragraph before the list:
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<p>abc</p><ul><li><ul><li>[]def</li></ul></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<p>abc</p><ul><li>[]def</li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty list item within a list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>abc</li><li><ul><li>[]<br></li><li><br></li></ul></li><li>def</li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter:
                                        '<ul><li>abc</li><li>[]<br></li><li><ul></li><br></li></ul></li><li><p>def</p></li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty list within a list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>abc</li><li><ul><li>[]<br></li></ul></li><li>def</li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter:
                                        '<ul><li>abc</li><li>[]<br></li><li><p>def</p></li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ul><li><ul><li><br>[]</li></ul></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>[]<br></li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip("should outdent a list to the point that it's a paragraph", async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ul><li>[]<br></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<p>[]<br></p>',
                                });
                                // With a paragraph before the list:
                                await testEditor(BasicEditor, {
                                    contentBefore: '<p><br></p><ul><li>[]<br></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<p><br></p><p>[]<br></p>',
                                });
                            });
                        });
                        describe('Complex merges', () => {
                            it('should merge a list item into a paragraph', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<p>abcd</p><ul><li>ef[]gh</li><li>ij</li></ul>',
                                    stepFunction: (editor: JWEditor) => {
                                        deleteBackward(editor);
                                        deleteBackward(editor);
                                        deleteBackward(editor);
                                        deleteBackward(editor);
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
                                    contentAfter:
                                        '<ul><li>abc</li><li>def[]ghi</li><li>klm</li></ul>',
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
                                    contentBefore:
                                        '<ul><li>a</li></ul><ol><li><p>[]b</p></li></ol>',
                                    stepFunction: deleteBackward,
                                    // Paragraphs in list items are treated as nonsense.
                                    contentAfter: '<ul><li>a[]b</li></ul>',
                                });
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li><p>a</p></li></ul><ol><li>[]b</li></ol>',
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
                                        '<ul><li>abc<ol><li>[]def</li><li>ghi</li></ol></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>abc[]def<ol><li>ghi</li></ol></li></ul>',
                                });
                            });
                            it('should merge an ordered list item into an unordered list item that is in the same ordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li><ul><li>abc</li></ul></li><li>[]def</li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li><ul><li>abc[]def</li></ul></li></ol>',
                                });
                            });
                            it('should merge the only item in an ordered list that is in an unordered list into a list item that is in the same unordered list, and remove the now empty ordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>abc</li><li><ol><li>[]def</li></ol></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>abc[]def</li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            it.skip('should outdent an ordered list item that is within a unordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ul><li><ol><li>[]abc</li></ol></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>[]abc</li></ul>',
                                });
                                // With a paragraph before the list:
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<p>abc</p><ul><li><ol><li>[]def</li></ol></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<p>abc</p><ul><li>[]def</li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty ordered list item within an unordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>abc</li><li><ol><li>[]<br></li><li><br></li></ol></li><li>def</li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter:
                                        '<ul><li>abc</li><li>[]<br></li><li><ol></li><br></li></ol></li><li><p>def</p></li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty ordered list within an unordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>abc</li><li><ol><li>[]<br></li></ol></li><li>def</li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter:
                                        '<ul><li>abc</li><li>[]<br></li><li><p>def</p></li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty ordered list within an unordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ul><li><ol><li><br>[]</li></ol></li></ul>',
                                    stepFunction: deleteBackward,
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
                                    contentBefore:
                                        '<ol><li>a</li></ol><ul><li><p>[]b</p></li></ul>',
                                    stepFunction: deleteBackward,
                                    // Paragraphs in list items are treated as nonsense.
                                    contentAfter: '<ol><li>a[]b</li></ol>',
                                });
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li><p>a</p></li></ol><ul><li>[]b</li></ul>',
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
                                    contentBefore:
                                        '<ol><li>abc<ul><li>[]def</li><li>ghi</li></ul></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>abc[]def<ul><li>ghi</li></ul></li></ol>',
                                });
                            });
                            it('should merge an unordered list item into an ordered list item that is in the same unordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li><ol><li>abc</li></ol></li><li>[]def</li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li><ol><li>abc[]def</li></ol></li></ul>',
                                });
                            });
                            it('should merge the only item in an unordered list that is in an ordered list into a list item that is in the same ordered list, and remove the now empty unordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>abc</li><li><ul><li>[]def</li></ul></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>abc[]def</li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            it.skip('should outdent an unordered list item that is within a ordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ol><li><ul><li>[]abc</li></ul></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>[]abc</li></ol>',
                                });
                                // With a paragraph before the list:
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<p>abc</p><ol><li><ul><li>[]def</li></ul></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<p>abc</p><ol><li>[]def</li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty unordered list item within an ordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>abc</li><li><ul><li>[]<br></li><li><br></li></ul></li><li>def</li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter:
                                        '<ol><li>abc</li><li>[]<br></li><li><ul></li><br></li></ul></li><li><p>def</p></li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty unordered list within an ordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>abc</li><li><ul><li>[]<br></li></ul></li><li>def</li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter:
                                        '<ol><li>abc</li><li>[]<br></li><li><p>def</p></li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should outdent an empty unordered list within an ordered list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ol><li><ul><li><br>[]</li></ul></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>[]<br></li></ol>',
                                });
                            });
                        });
                    });
                });
            });

            describe('Selection not collapsed', () => {
                it('should delete part of the text within a paragraph', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[cd]ef</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]ef</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]cd[ef</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]ef</p>',
                    });
                });
                it('should delete across two paragraphs', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[cd</p><p>ef]gh</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]gh</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]cd</p><p>ef[gh</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>ab[]gh</p>',
                    });
                });
                it('should delete all the text in a paragraph', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[abc]</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]abc[</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('should delete a complex selection accross format nodes and multiple paragraphs', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>kl]</i>mn</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><b>ab[]</b>mn</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>k]l</i>mn</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>kl[</i>mn</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><b>ab[]</b>mn</p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>k[l</i>mn</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                    });
                });
                it('should delete all contents of a complex DOM with format nodes and multiple paragraphs', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>[abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn]</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><b>]abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn[</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('should delete a selection accross a heading1 and a paragraph', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab [cd</h1><p>ef]gh</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>ab []gh</h1>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>ab ]cd</h1><p>ef[gh</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>ab []gh</h1>',
                    });
                });
                it('should delete a selection from the beginning of a heading1 with a format to the middle fo a paragraph', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1><b>[abcd</b></h1><p>ef]gh</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>[<b>abcd</b></h1><p>ef]gh</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1><b>]abcd</b></h1><p>ef[gh</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>]<b>abcd</b></h1><p>ef[gh</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                });
                describe('Lists', () => {
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
                                    '<ol><li>ab[cd</li><li><ol><li>ef]gh</li></ol></li></ol>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ol><li>ab[]gh</li></ol>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ol><li>ab]cd</li><li><ol><li>ef[gh</li></ol></li></ol>',
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
                                    '<ul><li>ab[cd</li><li><ul><li>ef]gh</li></ul></li></ul>',
                                stepFunction: deleteBackward,
                                contentAfter: '<ul><li>ab[]gh</li></ul>',
                            });
                            // Backward selection
                            await testEditor(BasicEditor, {
                                contentBefore:
                                    '<ul><li>ab]cd</li><li><ul><li>ef[gh</li></ul></li></ul>',
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
                                        '<ol><li>ab[cd</li><li><ul><li>ef]gh</li></ul></li></ol>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ol><li>ab[]gh</li></ol>',
                                });
                                // Backward selection
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>ab]cd</li><li><ul><li>ef[gh</li></ul></li></ol>',
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
                                        '<ul><li>ab[cd</li><li><ol><li>ef]gh</li></ol></li></ul>',
                                    stepFunction: deleteBackward,
                                    contentAfter: '<ul><li>ab[]gh</li></ul>',
                                });
                                // Backward selection
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>ab]cd</li><li><ol><li>ef[gh</li></ol></li></ul>',
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
        });
        describe('insertParagraphBreak', () => {
            describe('Selection collapsed', () => {
                describe('Basic', () => {
                    it('should duplicate an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><br></p><p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><br></p><p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]</p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><br></p><p>[]<br></p>',
                        });
                    });
                    it('should insert an empty paragraph before a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><br></p><p>[]abc</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[] abc</p>',
                            stepFunction: insertParagraphBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><br></p><p>[]abc</p>',
                        });
                    });
                    it('should split a paragraph in two', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p>ab</p><p>[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab []cd</p>',
                            stepFunction: insertParagraphBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p>ab&nbsp;</p><p>[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[] cd</p>',
                            stepFunction: insertParagraphBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p>ab</p><p>[]&nbsp;cd</p>',
                        });
                    });
                    it('should insert an empty paragraph after a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p>abc</p><p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[] </p>',
                            stepFunction: insertParagraphBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p>abc</p><p>[]<br></p>',
                        });
                    });
                });
                describe('Consecutive', () => {
                    it('should duplicate an empty paragraph twice', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: (editor: JWEditor) => {
                                insertParagraphBreak(editor);
                                insertParagraphBreak(editor);
                            },
                            contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertParagraphBreak(editor);
                                insertParagraphBreak(editor);
                            },
                            contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertParagraphBreak(editor);
                                insertParagraphBreak(editor);
                            },
                            contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                        });
                    });
                    it('should insert two empty paragraphs before a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertParagraphBreak(editor);
                                insertParagraphBreak(editor);
                            },
                            contentAfter: '<p><br></p><p><br></p><p>[]abc</p>',
                        });
                    });
                    it('should split a paragraph in three', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertParagraphBreak(editor);
                                insertParagraphBreak(editor);
                            },
                            contentAfter: '<p>ab</p><p><br></p><p>[]cd</p>',
                        });
                    });
                    it('should split a paragraph in four', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertParagraphBreak(editor);
                                insertParagraphBreak(editor);
                                insertParagraphBreak(editor);
                            },
                            contentAfter: '<p>ab</p><p><br></p><p><br></p><p>[]cd</p>',
                        });
                    });
                    it('should insert two empty paragraphs after a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertParagraphBreak(editor);
                                insertParagraphBreak(editor);
                            },
                            contentAfter: '<p>abc</p><p><br></p><p>[]<br></p>',
                        });
                    });
                });
                describe('Format', () => {
                    it('should split a paragraph before a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]<b>def</b></p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p>abc</p><p><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to []<b>
                            contentBefore: '<p>abc<b>[]def</b></p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p>abc</p><p><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc <b>[]def</b></p>',
                            stepFunction: insertParagraphBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p>abc&nbsp;</p><p><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc<b>[] def </b></p>',
                            stepFunction: insertParagraphBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p>abc</p><p><b>[]&nbsp;def</b></p>',
                        });
                    });
                    it('should split a paragraph after a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]def</p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><b>abc</b></p><p>[]def</p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to </b>[]
                            contentBefore: '<p><b>abc[]</b>def</p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><b>abc</b></p><p>[]def</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[]</b> def</p>',
                            stepFunction: insertParagraphBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>abc</b></p><p>[]&nbsp;def</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc []</b>def</p>',
                            stepFunction: insertParagraphBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p><b>abc&nbsp;</b></p><p>[]def</p>',
                        });
                    });
                    it('should split a paragraph at the beginning of a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<b>abc</b></p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><br></p><p><b>[]abc</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to []<b>
                            contentBefore: '<p><b>[]abc</b></p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><br></p><p><b>[]abc</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>[] abc</b></p>',
                            stepFunction: insertParagraphBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><br></p><p><b>[]abc</b></p>',
                        });
                    });
                    it('should split a paragraph within a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab[]cd</b></p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><b>ab</b></p><p><b>[]cd</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab []cd</b></p>',
                            stepFunction: insertParagraphBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>ab&nbsp;</b></p><p><b>[]cd</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab[] cd</b></p>',
                            stepFunction: insertParagraphBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>ab</b></p><p><b>[]&nbsp;cd</b></p>',
                        });
                    });
                    it('should split a paragraph at the end of a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]</p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><b>abc</b></p><p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to </b>[]
                            contentBefore: '<p><b>abc[]</b></p>',
                            stepFunction: insertParagraphBreak,
                            contentAfter: '<p><b>abc</b></p><p>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[] </b></p>',
                            stepFunction: insertParagraphBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><b>abc</b></p><p>[]<br></p>',
                        });
                    });
                });
                describe('Lists', () => {
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
                            it.skip('should add an empty list item at the end of a list, then remove it', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ol><li>abc[]</li></ol>',
                                    stepFunction: (editor: JWEditor) => {
                                        insertParagraphBreak(editor);
                                        insertParagraphBreak(editor);
                                    },
                                    contentAfter: '<ol><li>abc</li></ol><p>[]<br></p>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should add an empty list item at the end of an indented list, then remove it', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ol><li>abc</li><li><ol><li>def[]</li></ol></li><li>ghi</li></ol>',
                                    stepFunction: (editor: JWEditor) => {
                                        insertParagraphBreak(editor);
                                        insertParagraphBreak(editor);
                                    },
                                    contentAfter:
                                        '<ol><li>abc</li><li><ol><li>def</li></ol></li><li>[]<br></li><li>ghi</li></ol>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should remove a list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ol><li><p>[]<br></p></li></ol>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter: '<p>[]<br></p>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should remove a list set to bold', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ol><li><p><b>[]<br></b></p></li></ol>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter: '<p>[]<br></p>',
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
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should add an empty list item at the end of a list, then remove it', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ul><li>abc[]</li></ul>',
                                    stepFunction: (editor: JWEditor) => {
                                        insertParagraphBreak(editor);
                                        insertParagraphBreak(editor);
                                    },
                                    contentAfter: '<ul><li>abc</li></ul><p>[]<br></p>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should add an empty list item at the end of an indented list, then remove it', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore:
                                        '<ul><li>abc</li><li><ul><li>def[]</li></ul></li><li>ghi</li></ul>',
                                    stepFunction: (editor: JWEditor) => {
                                        insertParagraphBreak(editor);
                                        insertParagraphBreak(editor);
                                    },
                                    contentAfter:
                                        '<ul><li>abc</li><li><ul><li>def</li></ul></li><li>[]<br></li><li>ghi</li></ul>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should remove a list', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ul><li><p>[]<br></p></li></ul>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter: '<p>[]<br></p>',
                                });
                            });
                            // TODO: MAKE IT PASS
                            // TODO: determine whether this is the expected behavior
                            it.skip('should remove a list set to bold', async () => {
                                await testEditor(BasicEditor, {
                                    contentBefore: '<ul><li><p><b>[]<br></b></p></li></ul>',
                                    stepFunction: insertParagraphBreak,
                                    contentAfter: '<p>[]<br></p>',
                                });
                            });
                        });
                    });
                    describe('Mixed', () => {
                        describe('Ordered to unordered', () => {});
                        describe('Unordered to ordered', () => {});
                    });
                });
            });
            describe('Selection not collapsed', () => {
                it('should delete the first half of a paragraph, then split it', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[ab]cd</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p>[]cd</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]ab[cd</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p>[]cd</p>',
                    });
                });
                it('should delete part of a paragraph, then split it', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[bc]d</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>a</p><p>[]d</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a]bc[d</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>a</p><p>[]d</p>',
                    });
                });
                it('should delete the last half of a paragraph, then split it', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[cd]</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>ab</p><p>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]cd[</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p>ab</p><p>[]<br></p>',
                    });
                });
                it('should delete all contents of a paragraph, then split it', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[abcd]</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]abcd[</p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter: '<p><br></p><p>[]<br></p>',
                    });
                });
                describe('Lists', () => {
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
        });
        describe('insertLineBreak', () => {
            describe('Selection collapsed', () => {
                describe('Basic', () => {
                    it('should insert a <br> into an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                    });
                    it('should insert a <br> at the beggining of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]abc</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[] abc</p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><br>[]abc</p>',
                        });
                    });
                    it('should insert a <br> within text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p>ab<br>[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab []cd</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p>ab&nbsp;<br>[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[] cd</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p>ab<br>[]&nbsp;cd</p>',
                        });
                    });
                    it('should insert a line break (2 <br>) at the end of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p>abc<br>[]<br></p>',
                        });
                    });
                });
                describe('Consecutive', () => {
                    it('should insert two <br> at the beggining of an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                    });
                    it('should insert two <br> at the beggining of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]abc</p>',
                        });
                    });
                    it('should insert two <br> within text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p>ab<br><br>[]cd</p>',
                        });
                    });
                    it('should insert two line breaks (3 <br>) at the end of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            // the last <br> is needed to make the first one
                            // visible.
                            contentAfter: '<p>abc<br><br>[]<br></p>',
                        });
                    });
                });
                describe('Format', () => {
                    it('should insert a <br> before a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]<b>def</b></p>',
                            stepFunction: insertLineBreak,
                            // That selection is equivalent to []<b>
                            contentAfter: '<p>abc<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to []<b>
                            contentBefore: '<p>abc<b>[]def</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p>abc<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc <b>[]def</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p>abc&nbsp;<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc<b>[] def </b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p>abc<br><b>[]&nbsp;def</b></p>',
                        });
                    });
                    it('should insert a <br> after a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]def</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>abc</b><br>[]def</p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to </b>[]
                            contentBefore: '<p><b>abc[]</b>def</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>abc</b><br>[]def</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[]</b> def</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p><b>abc</b><br>[]&nbsp;def</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc []</b>def</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p><b>abc&nbsp;</b><br>[]def</p>',
                        });
                    });
                    it('should insert a <br> at the beginning of a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<b>abc</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to []<b>
                            contentBefore: '<p><b>[]abc</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>[] abc</b></p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                    });
                    it('should insert a <br> within a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab[]cd</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>ab</b><br><b>[]cd</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab []cd</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>ab&nbsp;</b><br><b>[]cd</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab[] cd</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>ab</b><br><b>[]&nbsp;cd</b></p>',
                        });
                    });
                    it('should insert a line break (2 <br>) at the end of a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]</p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to </b>[]
                            contentBefore: '<p><b>abc[]</b></p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[] </b></p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                    });
                });
                describe('Lists', () => {
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
            });
            describe('Selection not collapsed', () => {
                it('should delete the first half of a paragraph, then insert a <br>', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[ab]cd</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]cd</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]ab[cd</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]cd</p>',
                    });
                });
                it('should delete part of a paragraph, then insert a <br>', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[bc]d</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p>a<br>[]d</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a]bc[d</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p>a<br>[]d</p>',
                    });
                });
                it('should delete the last half of a paragraph, then insert a line break (2 <br>)', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[cd]</p>',
                        stepFunction: insertLineBreak,
                        // the second <br> is needed to make the first one
                        // visible.
                        contentAfter: '<p>ab<br>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]cd[</p>',
                        stepFunction: insertLineBreak,
                        // the second <br> is needed to make the first one
                        // visible.
                        contentAfter: '<p>ab<br>[]<br></p>',
                    });
                });
                it('should delete all contents of a paragraph, then insert a line break', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[abcd]</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]abcd[</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]<br></p>',
                    });
                });
                describe('Lists', () => {
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
        describe('withRange', () => {
            it('should work with VRange.at', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'ab[]',
                    stepFunction: (editor: JWEditor) => {
                        const aNode = editor.vDocument.root.next(node => node.name === 'a');
                        withRange(VRange.at(aNode), range => {
                            const insertParams: InsertTextParams = {
                                range: range,
                                text: 'c',
                            };
                            editor.execCommand('insertText', insertParams);
                        });
                    },
                    contentAfter: 'cab[]',
                });
            });
            it('should work with VRange.selecting and default RangePosition.BEFORE and RangePosition.AFTER', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'ab[]',
                    stepFunction: (editor: JWEditor) => {
                        const aNode = editor.vDocument.root.next(node => node.name === 'a');
                        withRange(VRange.selecting(aNode, aNode), range => {
                            const insertParams: InsertTextParams = {
                                range: range,
                                text: 'c',
                            };
                            editor.execCommand('insertText', insertParams);
                        });
                    },
                    contentAfter: 'cb[]',
                });
            });
            it('should work with VRange.selecting and RangePosition.BEFORE and RangePosition.BEFORE', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'ab[]',
                    stepFunction: (editor: JWEditor) => {
                        const aNode = editor.vDocument.root.next(node => node.name === 'a');
                        const rangeParams: [Point, Point] = [
                            [aNode, RelativePosition.BEFORE],
                            [aNode, RelativePosition.BEFORE],
                        ];
                        withRange(rangeParams, range => {
                            const insertParams: InsertTextParams = {
                                range: range,
                                text: 'c',
                            };
                            editor.execCommand('insertText', insertParams);
                        });
                    },
                    contentAfter: 'cab[]',
                });
            });
            it('should work with RangePosition.BEFORE and RangePosition.AFTER', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'ab[]',
                    stepFunction: (editor: JWEditor) => {
                        const aNode = editor.vDocument.root.next(node => node.name === 'a');
                        const rangeParams: [Point, Point] = [
                            [aNode, RelativePosition.BEFORE],
                            [aNode, RelativePosition.AFTER],
                        ];
                        withRange(rangeParams, range => {
                            const insertParams: InsertTextParams = {
                                range: range,
                                text: 'c',
                            };
                            editor.execCommand('insertText', insertParams);
                        });
                    },
                    contentAfter: 'cb[]',
                });
            });
            it('should work with same node and RangePosition.AFTER and RangePosition.AFTER', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'ab[]',
                    stepFunction: (editor: JWEditor) => {
                        const aNode = editor.vDocument.root.next(node => node.name === 'a');
                        const rangeParams: [Point, Point] = [
                            [aNode, RelativePosition.AFTER],
                            [aNode, RelativePosition.AFTER],
                        ];
                        withRange(rangeParams, range => {
                            const insertParams: InsertTextParams = {
                                range: range,
                                text: 'c',
                            };
                            editor.execCommand('insertText', insertParams);
                        });
                    },
                    contentAfter: 'acb[]',
                });
            });
            it('should work with different nodes and RangePosition.AFTER and RangePosition.BEFORE', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'ab[]',
                    stepFunction: (editor: JWEditor) => {
                        const aNode = editor.vDocument.root.next(node => node.name === 'a');
                        const bNode = editor.vDocument.root.next(node => node.name === 'b');
                        const rangeParams: [Point, Point] = [
                            [aNode, RelativePosition.AFTER],
                            [bNode, RelativePosition.BEFORE],
                        ];
                        withRange(rangeParams, range => {
                            const insertParams: InsertTextParams = {
                                range: range,
                                text: 'c',
                            };
                            editor.execCommand('insertText', insertParams);
                        });
                    },
                    contentAfter: 'acb[]',
                });
            });
            it('should work with different nodes and RangePosition.AFTER and RangePosition.AFTER', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'ab[]',
                    stepFunction: (editor: JWEditor) => {
                        const aNode = editor.vDocument.root.next(node => node.name === 'a');
                        const bNode = editor.vDocument.root.next(node => node.name === 'b');
                        const rangeParams: [Point, Point] = [
                            [aNode, RelativePosition.AFTER],
                            [bNode, RelativePosition.AFTER],
                        ];
                        withRange(rangeParams, range => {
                            const insertParams: InsertTextParams = {
                                range: range,
                                text: 'c',
                            };
                            editor.execCommand('insertText', insertParams);
                        });
                    },
                    contentAfter: 'ac[]',
                });
            });
        });
    });
});
