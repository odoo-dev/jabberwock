import JWEditor from '../src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { FormatParams } from '../src/CorePlugin';

const deleteForward = (editor: JWEditor): void => editor.execCommand('deleteForward');

describe('stores', () => {
    describe('VDocument', () => {
        describe('insertText', () => {
            describe('bold', () => {
                describe('Range collapsed', () => {
                    it('should insert char not bold when range in between two paragraphs', async () => {
                        await testEditor({
                            contentBefore: '<p><b>a</b></p><p>[]</p><p><b>b</b></p>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<p><b>a</b></p><p>c[]</p><p><b>b</b></p>',
                        });
                    });
                    it('should insert char bold when the range in first position and next char is bold', async () => {
                        await testEditor({
                            contentBefore: '<b>[]a</b>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('b');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>b[]a</b>',
                        });
                    });
                    it('should insert char not bold when the range in first position and next char is not bold', async () => {
                        await testEditor({
                            contentBefore: '[]a',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('b');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: 'b[]a',
                        });
                    });
                    it('should insert char bold when previous char is bold and the next is not bold', async () => {
                        await testEditor({
                            contentBefore: '<b>a[]</b>b',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>ac[]</b>b',
                        });
                    });
                    it('should insert char not bold, when previous char is not bold, next is not bold', async () => {
                        await testEditor({
                            contentBefore: 'a[]b',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: 'ac[]b',
                        });
                    });
                    it('should insert char bold when previous char is bold and the next is not bold', async () => {
                        await testEditor({
                            contentBefore: '<b>a</b>[]b',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>ac[]</b>b',
                        });
                    });
                    it('should insert char not bold because char on a different parent should not be considered', async () => {
                        await testEditor({
                            contentBefore: '<p><b>a</b></p><p>[]b</p>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<p><b>a</b></p><p>c[]b</p>',
                        });
                    });
                });

                describe('Range not collapsed', () => {
                    it('should replace without bold when nothing bold between range and nothing bold outside range', async () => {
                        await testEditor({
                            contentBefore: '[a]',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('b');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: 'b[]',
                        });
                        await testEditor({
                            contentBefore: 'a[b]c',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('d');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: 'ad[]c',
                        });
                    });
                    it('should replace without bold when nothing bold between range and everything bold outside range', async () => {
                        await testEditor({
                            contentBefore: '<b>a</b>[b]<b>c</b>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('d');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>a</b>d[]<b>c</b>',
                        });
                    });
                    it('should replace with bold when anything inside the range is bold', async () => {
                        await testEditor({
                            contentBefore: '<b>[a</b>b]<b>c</b>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('d');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>d[]c</b>',
                        });
                    });
                });
            });
        });
        describe('applyFormat', () => {
            describe('Range collapsed', () => {
                it('should make bold the next insertion', async () => {
                    await testEditor({
                        contentBefore: '[]a',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.vDocument.insertText('b');
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: '<b>b[]</b>a',
                    });
                });
                it('should not make bold the next insertion when applyFormat 2 times', async () => {
                    await testEditor({
                        contentBefore: '[]a',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.vDocument.insertText('b');
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: 'b[]a',
                    });
                });
                it('should make bold the next insertion when applyFormat 1 time, after the first char', async () => {
                    await testEditor({
                        contentBefore: 'a[]',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.vDocument.insertText('b');
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: 'a<b>b[]</b>',
                    });
                });
                it('should not make bold the next insertion when applyFormat 2 times, after the first char', async () => {
                    await testEditor({
                        contentBefore: 'a[]',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.vDocument.insertText('b');
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: 'ab[]',
                    });
                });
                it('should not make bold the next insertion when applyFormat 1 time after the first char that is bold', async () => {
                    await testEditor({
                        contentBefore: '<b>a</b>[]',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.vDocument.insertText('b');
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: '<b>a</b>b[]',
                    });
                });
                it('should make bold the next insertion when applyFormat 2 times after the first char that is bold', async () => {
                    await testEditor({
                        contentBefore: '<b>a</b>[]',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.vDocument.insertText('b');
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: '<b>ab[]</b>',
                    });
                });
                it('should apply multiples format', async () => {
                    await testEditor({
                        contentBefore: '[]a',
                        stepFunction: (editor: JWEditor) => {
                            const formatBold: FormatParams = {
                                format: 'bold',
                            };
                            const formatUnderline: FormatParams = {
                                format: 'underline',
                            };

                            editor.dispatcher.dispatch('applyFormat', formatBold);
                            editor.dispatcher.dispatch('applyFormat', formatUnderline);
                            editor.vDocument.insertText('b');
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: '<b><u>b[]</u></b>a',
                    });
                });
            });

            describe('Range not collapsed', () => {
                it('should be bold when selected is not bold', async () => {
                    await testEditor({
                        contentBefore: 'a[b]c',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.execCommand('applyFormat', params);
                        },
                        contentAfter: 'a[<b>b]</b>c',
                    });
                });
                it('should not be bold when selected is bold', async () => {
                    await testEditor({
                        contentBefore: 'a<b>[b]</b>c',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };
                            editor.execCommand('applyFormat', params);
                        },
                        contentAfter: 'a[b]c',
                    });
                });
                it('should be bold when one of the selected is bold', async () => {
                    await testEditor({
                        contentBefore: 'a<b>[b</b>c]',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.execCommand('applyFormat', params);
                        },
                        contentAfter: 'a[<b>bc]</b>',
                    });
                });
            });
        });
        describe('deleteForward', () => {
            describe('Range collapsed', () => {
                describe('Basic', () => {
                    it('should do nothing', async () => {
                        await testEditor({
                            contentBefore: '<p>[]</p>',
                            stepFunction: deleteForward,
                            // A <br> is automatically added to make the <p>
                            // visible.
                            contentAfter: '<p>[]<br></p>',
                        });
                        await testEditor({
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: deleteForward,
                            // The <br> is there only to make the <p> visible.
                            // It does not exist in VDocument and selecting it
                            // has no meaning in the DOM.
                            contentAfter: '<p>[]<br></p>',
                        });
                        await testEditor({
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>abc[]</p>',
                        });
                    });
                    it('should delete the first character in a paragraph', async () => {
                        await testEditor({
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>[]bc</p>',
                        });
                    });
                    it('should delete a character within a paragraph', async () => {
                        await testEditor({
                            contentBefore: '<p>a[]bc</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>a[]c</p>',
                        });
                    });
                    it('should delete the last character in a paragraph', async () => {
                        await testEditor({
                            contentBefore: '<p>ab[]c</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>ab[]</p>',
                        });
                        await testEditor({
                            contentBefore: '<p>ab []c</p>',
                            stepFunction: deleteForward,
                            // The space should be converted to an unbreakable space
                            // so it is visible.
                            contentAfter: '<p>ab&nbsp;[]</p>',
                        });
                    });
                    it('should merge a paragraph into an empty paragraph', async () => {
                        await testEditor({
                            contentBefore: '<p>[]<br></p><p>abc</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p>[]abc</p>',
                        });
                    });
                });
                describe('Line breaks', () => {
                    describe('Single', () => {
                        it('should delete a leading line break', async () => {
                            await testEditor({
                                contentBefore: '<p>[]<br>abc</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>[]abc</p>',
                            });
                            await testEditor({
                                contentBefore: '<p>[]<br> abc</p>',
                                stepFunction: deleteForward,
                                // The space after the <br> is expected to be parsed
                                // away, like it is in the DOM.
                                contentAfter: '<p>[]abc</p>',
                            });
                        });
                        it('should delete a line break within a paragraph', async () => {
                            await testEditor({
                                contentBefore: '<p>ab[]<br>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]cd</p>',
                            });
                            await testEditor({
                                contentBefore: '<p>ab []<br>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab []cd</p>',
                            });
                            await testEditor({
                                contentBefore: '<p>ab[]<br> cd</p>',
                                stepFunction: deleteForward,
                                // The space after the <br> is expected to be parsed
                                // away, like it is in the DOM.
                                contentAfter: '<p>ab[]cd</p>',
                            });
                        });
                        it('should delete a trailing line break', async () => {
                            await testEditor({
                                contentBefore: '<p>abc[]<br><br></p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>abc[]</p>',
                            });
                            await testEditor({
                                contentBefore: '<p>abc []<br><br></p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>abc&nbsp;[]</p>',
                            });
                        });
                        it('should delete a character and a line break, emptying a paragraph', async () => {
                            await testEditor({
                                contentBefore: '<p>[]a<br><br></p><p>bcd</p>',
                                stepFunction: (editor: JWEditor) => {
                                    deleteForward(editor);
                                    deleteForward(editor);
                                },
                                contentAfter: '<p>[]<br></p><p>bcd</p>',
                            });
                        });
                        it('should delete a character before a trailing line break', async () => {
                            await testEditor({
                                contentBefore: '<p>ab[]c<br><br></p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]<br><br></p>',
                            });
                        });
                    });
                    describe('Consecutive', () => {
                        it('should merge a paragraph into a paragraph with 4 <br>', async () => {
                            // 1
                            await testEditor({
                                contentBefore: '<p>ab</p><p><br><br><br><br>[]</p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab</p><p><br><br><br>[]cd</p>',
                                debug: true,
                            });
                            // 2-1
                            await testEditor({
                                contentBefore: '<p>ab</p><p><br><br><br>[]<br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                // This should be identical to 1
                                contentAfter: '<p>ab</p><p><br><br><br>[]cd</p>',
                            });
                        });
                        it('should delete a trailing line break', async () => {
                            // 3-1
                            await testEditor({
                                contentBefore: '<p>ab</p><p><br><br>[]<br><br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab</p><p><br><br>[]<br></p><p>cd</p>',
                            });
                        });
                        it('should delete a trailing line break, then merge a paragraph into a paragraph with 3 <br>', async () => {
                            // 3-2
                            await testEditor({
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
                            await testEditor({
                                contentBefore: '<p>ab</p><p><br>[]<br><br><br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab</p><p><br>[]<br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete two line breaks', async () => {
                            // 4-2
                            await testEditor({
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
                            await testEditor({
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
                            await testEditor({
                                contentBefore: '<p>ab</p><p>[]<br><br><br><br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab</p><p>[]<br><br><br></p><p>cd</p>',
                            });
                        });
                        it('should delete two line breaks', async () => {
                            // 5-2
                            await testEditor({
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
                            await testEditor({
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
                            await testEditor({
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
                            await testEditor({
                                contentBefore: '<p>ab[]</p><p><br><br><br><br></p><p>cd</p>',
                                stepFunction: deleteForward,
                                contentAfter: '<p>ab[]<br><br><br><br></p><p>cd</p>',
                            });
                        });
                        it('should merge a paragraph with 4 <br> into a paragraph with text, then delete a line break', async () => {
                            // 6-2
                            await testEditor({
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
                            await testEditor({
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
                            await testEditor({
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
                            await testEditor({
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
                        await testEditor({
                            contentBefore: '<p><b>abc[]</b>def</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<p><b>abc[]</b>ef</p>',
                        });
                        await testEditor({
                            contentBefore: '<p><b>abc</b>[]def</p>',
                            stepFunction: deleteForward,
                            // The range is normalized so we only have one way
                            // to represent a position.
                            contentAfter: '<p><b>abc[]</b>ef</p>',
                        });
                    });
                });
                describe('Merging different types of elements', () => {
                    it('should merge a paragraph with text into a heading1 with text', async () => {
                        await testEditor({
                            contentBefore: '<h1>ab[]</h1><p>cd</p>',
                            stepFunction: deleteForward,
                            contentAfter: '<h1>ab[]cd</h1>',
                        });
                    });
                    it('should merge an empty paragraph into a heading1 with text', async () => {
                        await testEditor({
                            contentBefore: '<h1>ab[]</h1><p><br></p>',
                            stepFunction: deleteForward,
                            contentAfter: '<h1>ab[]</h1>',
                        });
                    });
                });
            });

            describe('Range not collapsed', () => {
                it('should delete part of the text within a paragraph', async () => {
                    // Forward selection
                    await testEditor({
                        contentBefore: '<p>ab[cd]ef</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]ef</p>',
                    });
                    // Backward selection
                    await testEditor({
                        contentBefore: '<p>ab]cd[ef</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]ef</p>',
                    });
                });
                it('should delete across two paragraphs', async () => {
                    // Forward selection
                    await testEditor({
                        contentBefore: '<p>ab[cd</p><p>ef]gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]gh</p>',
                    });
                    // Backward selection
                    await testEditor({
                        contentBefore: '<p>ab]cd</p><p>ef[gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>ab[]gh</p>',
                    });
                });
                it('should delete all the text in a paragraph', async () => {
                    // Forward selection
                    await testEditor({
                        contentBefore: '<p>[abc]</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor({
                        contentBefore: '<p>]abc[</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('should delete a complex selection accross format nodes and multiple paragraphs', async () => {
                    // Forward selection
                    await testEditor({
                        contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>kl]</i>mn</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>ab[]</b>mn</p>',
                    });
                    await testEditor({
                        contentBefore: '<p><b>ab[cd</b></p><p><b>ef<br/>gh</b>ij<i>k]l</i>mn</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                    });
                    // Backward selection
                    await testEditor({
                        contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>kl[</i>mn</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>ab[]</b>mn</p>',
                    });
                    await testEditor({
                        contentBefore: '<p><b>ab]cd</b></p><p><b>ef<br/>gh</b>ij<i>k[l</i>mn</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p><b>ab[]</b><i>l</i>mn</p>',
                    });
                });
                it('should delete all contents of a complex DOM with format nodes and multiple paragraphs', async () => {
                    // Forward selection
                    await testEditor({
                        contentBefore: '<p><b>[abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn]</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor({
                        contentBefore: '<p><b>]abcd</b></p><p><b>ef<br/>gh</b>ij<i>kl</i>mn[</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<p>[]<br></p>',
                    });
                });
                it('should delete a selection accross a heading1 and a paragraph', async () => {
                    // Forward selection
                    await testEditor({
                        contentBefore: '<h1>ab [cd</h1><p>ef]gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>ab []gh</h1>',
                    });
                    // Backward selection
                    await testEditor({
                        contentBefore: '<h1>ab ]cd</h1><p>ef[gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>ab []gh</h1>',
                    });
                });
                it('should delete a selection from the beginning of a heading1 with a format to the middle of a paragraph', async () => {
                    // Forward selection
                    await testEditor({
                        contentBefore: '<h1><b>[abcd</b></h1><p>ef]gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    await testEditor({
                        contentBefore: '<h1>[<b>abcd</b></h1><p>ef]gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    // Backward selection
                    await testEditor({
                        contentBefore: '<h1><b>]abcd</b></h1><p>ef[gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                    await testEditor({
                        contentBefore: '<h1>]<b>abcd</b></h1><p>ef[gh</p>',
                        stepFunction: deleteForward,
                        contentAfter: '<h1>[]gh</h1>',
                    });
                });
            });
        });
    });
});
