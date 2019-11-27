import JWEditor from '../src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { FormatParams } from '../src/CorePlugin';

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
    });
});
