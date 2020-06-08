import JWEditor from '../src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { Char } from '../../plugin-char/src/Char';
import { VRange, withRange } from '../src/VRange';
import { RelativePosition, Point } from '../src/VNodes/VNode';
import { BasicEditor } from '../../../bundles/BasicEditor/BasicEditor';
import { Core } from '../../core/src/Core';
import { Layout } from '../../plugin-layout/src/Layout';

const deleteForward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteForward');
const deleteBackward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteBackward');
const insertParagraphBreak = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('insertParagraphBreak');

describe('VDocument', () => {
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
                it('should not break unbreakables', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<table><tbody><tr><td>[]<br></td><td>abc</td></tr></tbody></table>',
                        stepFunction: deleteForward,
                        contentAfter:
                            '<table><tbody><tr><td>[]<br></td><td>abc</td></tr></tbody></table>',
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete two line breaks, then merge a paragraph into a paragraph with 2 <br>', async () => {
                        // 4-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete three line breaks (emptying a paragraph)', async () => {
                        // 5-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete three line breaks, then merge a paragraph into an empty parargaph', async () => {
                        // 5-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab[]<br><br><br></p><p>cd</p>',
                        });
                    });
                    it('should merge a paragraph with 4 <br> into a paragraph with text, then delete two line breaks', async () => {
                        // 6-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should merge a paragraph with 4 <br> into a paragraph with text, then delete three line breaks', async () => {
                        // 6-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                            },
                            contentAfter: '<p>ab[]</p><p>cd</p>',
                        });
                    });
                    it('should merge a paragraph with 4 <br> into a paragraph with text, then delete three line breaks, then merge two paragraphs with text', async () => {
                        // 6-5
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
                                await deleteForward(editor);
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
            describe('With attributes', () => {
                it('should merge a paragraph without class into an empty paragraph with a class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p class="a"><br>[]</p><p>abc</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p class="a">[]abc</p>',
                    });
                });
                it('should merge two paragraphs with spans of same classes', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">dom to[]</span></p><p><span class="a">edit</span></p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><span class="a">dom to[]edit</span></p>',
                    });
                });
                it('should merge two paragraphs with spans of different classes without merging the spans', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">dom to[]</span></p><p><span class="b">edit</span></p>',
                        stepFunction: deleteForward,
                        contentAfter:
                            '<p><span class="a">dom to[]</span><span class="b">edit</span></p>',
                    });
                });
                it('should merge two paragraphs of different classes, each containing spans of the same class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p class="a"><span class="b">ab[]</span></p><p class="c"><span class="b">cd</span></p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p class="a"><span class="b">ab[]cd</span></p>',
                    });
                });
                it('should merge two paragraphs of different classes, each containing spans of different classes without merging the spans', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p class="a"><span class="b">ab[]</span></p><p class="c"><span class="d">cd</span></p>',
                        stepFunction: deleteForward,
                        contentAfter:
                            '<p class="a"><span class="b">ab[]</span><span class="d">cd</span></p>',
                    });
                });
                it('should delete a line break between two spans with bold and merge these formats', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><span><b>ab[]</b></span><br/><span><b>cd</b></span></p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><span><b>ab[]cd</b></span></p>',
                    });
                });
                it('should delete a character in a span with bold, then a line break between two spans with bold and merge these formats', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span><b>a[]b</b></span><br><span><b><br>cde</b></span></p>',
                        stepFunction: async (editor: JWEditor) => {
                            await deleteForward(editor);
                            await deleteForward(editor);
                        },
                        contentAfter: '<p><span><b>a[]</b></span><br><span><b>cde</b></span></p>',
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
                // // Backward selection
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
            it('should not break unbreakables', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<table><tbody><tr><td>a[bc</td><td>de]f</td></tr></tbody></table>',
                    stepFunction: deleteForward,
                    contentAfter: '<table><tbody><tr><td>a[</td><td>]f</td></tr></tbody></table>',
                });
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc</p><p>de]f</p>',
                    stepFunction: (editor: JWEditor) => {
                        const domEngine = editor.plugins.get(Layout).engines.dom;
                        const editable = domEngine.components.get('editable')[0];
                        editable.firstChild().breakable = false;
                        editable.lastChild().breakable = false;
                        return deleteForward(editor);
                    },
                    contentAfter: '<p>a[</p><p>]f</p>',
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
                it('should not break unbreakables', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<table><tbody><tr><td>[]<br></td><td>abc</td></tr></tbody></table>',
                        stepFunction: deleteBackward,
                        contentAfter:
                            '<table><tbody><tr><td>[]<br></td><td>abc</td></tr></tbody></table>',
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]<br><br></p><p>cd</p>',
                        });
                    });
                    it('should delete two line breaks, then merge a paragraph with 3 <br> into a paragraph with text', async () => {
                        // 3-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            // A trailing line break is rendered as two <br>.
                            contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                        });
                        // 5-2
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            // This should be identical to 4-2
                            contentAfter: '<p>ab</p><p><br>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete three line breaks (emptying a paragraph)', async () => {
                        // 4-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                        });
                        // 5-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            // This should be identical to 4-3
                            contentAfter: '<p>ab</p><p>[]<br></p><p>cd</p>',
                        });
                    });
                    it('should delete three line breaks, then merge an empty parargaph into a paragraph with text', async () => {
                        // 4-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            // This should be identical to 4-4
                            contentAfter: '<p>ab[]</p><p>cd</p>',
                        });
                        // 5-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
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
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p><br><br>[]cd</p>',
                        });
                    });
                    it('should merge a paragraph into a paragraph with 4 <br>, then delete two line breaks', async () => {
                        // 6-3
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p><br>[]cd</p>',
                        });
                    });
                    it('should merge a paragraph into a paragraph with 4 <br>, then delete three line breaks', async () => {
                        // 6-4
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                            },
                            contentAfter: '<p>ab</p><p>[]cd</p>',
                        });
                    });
                    it('should merge a paragraph into a paragraph with 4 <br>, then delete three line breaks, then merge two paragraphs with text', async () => {
                        // 6-5
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab</p><p><br><br><br><br></p><p>[]cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
                                await deleteBackward(editor);
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
                        contentBefore: '<jw-block-a>a</jw-block-a><jw-block-b>[<br>]</jw-block-b>',
                        stepFunction: deleteBackward,
                        contentAfter: '<jw-block-a>a[]</jw-block-a>',
                    });
                });
                it('should merge nested elements (default behaviour)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<jw-block-a><jw-block-b>ab</jw-block-b></jw-block-a><jw-block-c><jw-block-d>[]cd</jw-block-d></jw-block-c>',
                        stepFunction: deleteBackward,
                        contentAfter: '<jw-block-a><jw-block-b>ab[]cd</jw-block-b></jw-block-a>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<jw-block-a><jw-block-b>ab</jw-block-b></jw-block-a><jw-block-c><jw-block-d>[<br>]</jw-block-d></jw-block-c>',
                        stepFunction: deleteBackward,
                        contentAfter: '<jw-block-a><jw-block-b>ab[]</jw-block-b></jw-block-a>',
                    });
                });
                it('should not break unbreakables', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<table><tbody><tr><td><br></td><td>[]abc</td></tr></tbody></table>',
                        stepFunction: deleteBackward,
                        contentAfter:
                            '<table><tbody><tr><td><br></td><td>[]abc</td></tr></tbody></table>',
                    });
                });
            });
            describe('With attributes', () => {
                it('should merge a paragraph without class into an empty paragraph with a class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p class="a"><br></p><p>[]abc</p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p class="a">[]abc</p>',
                    });
                });
                it('should merge two paragraphs with spans of same classes', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">ab</span></p><p><span class="a">[]cd</span></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><span class="a">ab[]cd</span></p>',
                    });
                });
                it('should merge two paragraphs with spans of different classes without merging the spans', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">ab</span></p><p><span class="b">[]cd</span></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><span class="a">ab[]</span><span class="b">cd</span></p>',
                    });
                });
                it('should merge two paragraphs of different classes, each containing spans of the same class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p class="a"><span class="b">ab</span></p><p class="c"><span class="b">[]cd</span></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p class="a"><span class="b">ab[]cd</span></p>',
                    });
                });
                it('should merge two paragraphs of different classes, each containing spans of different classes without merging the spans', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p class="a"><span class="b">ab</span></p><p class="c"><span class="d">[]cd</span></p>',
                        stepFunction: deleteBackward,
                        contentAfter:
                            '<p class="a"><span class="b">ab[]</span><span class="d">cd</span></p>',
                    });
                });
                it('should delete a line break between two spans with bold and merge these formats', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><span><b>ab</b></span><br/><span><b>[]cd</b></span></p>',
                        stepFunction: deleteBackward,
                        contentAfter: '<p><span><b>ab[]cd</b></span></p>',
                    });
                });
                it('should delete a character in a span with bold, then a line break between two spans with bold and merge these formats', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span><b>ab<br></b></span><br><span><b>c[]de</b></span></p>',
                        stepFunction: async (editor: JWEditor) => {
                            await deleteBackward(editor);
                            await deleteBackward(editor);
                        },
                        contentAfter: '<p><span><b>ab</b></span><br><span><b>[]de</b></span></p>',
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
                        stepFunction: async (editor: JWEditor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[<br>]</p>',
                        stepFunction: async (editor: JWEditor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><br>[]</p>',
                        stepFunction: async (editor: JWEditor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p><br></p><p><br></p><p>[]<br></p>',
                    });
                });
                it('should insert two empty paragraphs before a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]abc</p>',
                        stepFunction: async (editor: JWEditor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p><br></p><p><br></p><p>[]abc</p>',
                    });
                });
                it('should split a paragraph in three', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]cd</p>',
                        stepFunction: async (editor: JWEditor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p>ab</p><p><br></p><p>[]cd</p>',
                    });
                });
                it('should split a paragraph in four', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[]cd</p>',
                        stepFunction: async (editor: JWEditor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
                        },
                        contentAfter: '<p>ab</p><p><br></p><p><br></p><p>[]cd</p>',
                    });
                });
                it('should insert two empty paragraphs after a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>abc[]</p>',
                        stepFunction: async (editor: JWEditor) => {
                            await insertParagraphBreak(editor);
                            await insertParagraphBreak(editor);
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
            describe('With attributes', () => {
                it('should insert an empty paragraph before a paragraph with a span with a class', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore:
                            '<p><span class="a">ab</span></p><p><span class="b">[]cd</span></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter:
                            '<p><span class="a">ab</span></p><p><br></p><p><span class="b">[]cd</span></p>',
                    });
                });
                it('should split a paragraph with a span with a bold in two', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p><span><b>ab[]cd</b></span></p>',
                        stepFunction: insertParagraphBreak,
                        contentAfter:
                            '<p><span><b>ab</b></span></p><p><span><b>[]cd</b></span></p>',
                    });
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
        });
    });
    describe('withRange', () => {
        it('should work with VRange.at', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'ab[]',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const aNode = editable.next(node => node.name === 'a');
                    await withRange(VRange.at(aNode), async range => {
                        await editor.execCommand<Char>('insertText', {
                            text: 'c',
                            context: {
                                range: range,
                            },
                        });
                    });
                },
                contentAfter: 'cab[]',
            });
        });
        it('should work with VRange.selecting and default RangePosition.BEFORE and RangePosition.AFTER', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'ab[]',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const aNode = editable.next(node => node.name === 'a');
                    await withRange(VRange.selecting(aNode, aNode), async range => {
                        await editor.execCommand<Char>('insertText', {
                            text: 'c',
                            context: {
                                range: range,
                            },
                        });
                    });
                },
                contentAfter: 'cb[]',
            });
        });
        it('should work with VRange.selecting and RangePosition.BEFORE and RangePosition.BEFORE', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'ab[]',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const aNode = editable.next(node => node.name === 'a');
                    const rangeParams: [Point, Point] = [
                        [aNode, RelativePosition.BEFORE],
                        [aNode, RelativePosition.BEFORE],
                    ];
                    await withRange(rangeParams, async range => {
                        await editor.execCommand<Char>('insertText', {
                            text: 'c',
                            context: {
                                range: range,
                            },
                        });
                    });
                },
                contentAfter: 'cab[]',
            });
        });
        it('should work with RangePosition.BEFORE and RangePosition.AFTER', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'ab[]',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const aNode = editable.next(node => node.name === 'a');
                    const rangeParams: [Point, Point] = [
                        [aNode, RelativePosition.BEFORE],
                        [aNode, RelativePosition.AFTER],
                    ];
                    await withRange(rangeParams, async range => {
                        await editor.execCommand<Char>('insertText', {
                            text: 'c',
                            context: {
                                range: range,
                            },
                        });
                    });
                },
                contentAfter: 'cb[]',
            });
        });
        it('should work with same node and RangePosition.AFTER and RangePosition.AFTER', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'ab[]',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const aNode = editable.next(node => node.name === 'a');
                    const rangeParams: [Point, Point] = [
                        [aNode, RelativePosition.AFTER],
                        [aNode, RelativePosition.AFTER],
                    ];
                    await withRange(rangeParams, async range => {
                        await editor.execCommand<Char>('insertText', {
                            text: 'c',
                            context: {
                                range: range,
                            },
                        });
                    });
                },
                contentAfter: 'acb[]',
            });
        });
        it('should work with different nodes and RangePosition.AFTER and RangePosition.BEFORE', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'ab[]',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const aNode = editable.next(node => node.name === 'a');
                    const bNode = editable.next(node => node.name === 'b');
                    const rangeParams: [Point, Point] = [
                        [aNode, RelativePosition.AFTER],
                        [bNode, RelativePosition.BEFORE],
                    ];
                    await withRange(rangeParams, async range => {
                        await editor.execCommand<Char>('insertText', {
                            text: 'c',
                            context: {
                                range: range,
                            },
                        });
                    });
                },
                contentAfter: 'acb[]',
            });
        });
        it('should work with different nodes and RangePosition.AFTER and RangePosition.AFTER', async () => {
            await testEditor(BasicEditor, {
                contentBefore: 'ab[]',
                stepFunction: async (editor: JWEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const aNode = editable.next(node => node.name === 'a');
                    const bNode = editable.next(node => node.name === 'b');
                    const rangeParams: [Point, Point] = [
                        [aNode, RelativePosition.AFTER],
                        [bNode, RelativePosition.AFTER],
                    ];
                    await withRange(rangeParams, async range => {
                        await editor.execCommand<Char>('insertText', {
                            text: 'c',
                            context: {
                                range: range,
                            },
                        });
                    });
                },
                contentAfter: 'ac[]',
            });
        });
    });
});
