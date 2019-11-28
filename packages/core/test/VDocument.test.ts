import JWEditor from '../src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { FormatParams, InsertParams, OptionalRangeParams, RangeFromTo } from '../src/CorePlugin';
import { VNode, VNodeType } from '../src/VNode';
import { RangePosition } from '../src/VRange';
import { expect } from 'chai';

describe('stores', () => {
    describe('VDocument', () => {
        describe('withCustomRange', () => {
            it('should work with a provided VRange ', () => {
                testEditor({
                    contentBefore: 'ab[]',
                    stepFunction: async (editor: JWEditor) => {
                        await editor.vDocument.withCustomRange(editor.vDocument.range, range => {
                            editor.vDocument.insertText('c', range);
                            editor.renderer.render(editor.vDocument, editor.editable);
                        });
                    },
                    contentAfter: 'abc[]',
                });
            });
            it('should take the current range as default', () => {
                testEditor({
                    contentBefore: 'ab[]',
                    stepFunction: async (editor: JWEditor) => {
                        await editor.vDocument.withCustomRange(null, range => {
                            editor.vDocument.insertText('c', range);
                            editor.renderer.render(editor.vDocument, editor.editable);
                        });
                    },
                    contentAfter: 'abc[]',
                });
            });
            describe('rangeParam with RangeFromTo', () => {
                it('should work with without rangeParams.startPosition and rangeParams.endPosition', () => {
                    testEditor({
                        contentBefore: 'ab[]',
                        stepFunction: async (editor: JWEditor) => {
                            const aNode = editor.vDocument.root.next(node => node.value === 'a');
                            const rangeParams: RangeFromTo = {
                                start: aNode,
                                end: aNode,
                            };
                            await editor.vDocument.withCustomRange(rangeParams, range => {
                                editor.vDocument.insertText('c', range);
                                editor.renderer.render(editor.vDocument, editor.editable);
                            });
                        },
                        contentAfter: 'cab[]',
                    });
                });
                it('should work with without rangeParams.end', () => {
                    testEditor({
                        contentBefore: 'ab[]',
                        stepFunction: async (editor: JWEditor) => {
                            const aNode = editor.vDocument.root.next(node => node.value === 'a');
                            const rangeParams: RangeFromTo = {
                                start: aNode,
                            };
                            await editor.vDocument.withCustomRange(rangeParams, range => {
                                editor.vDocument.insertText('c', range);
                                editor.renderer.render(editor.vDocument, editor.editable);
                                expect(range.start).to.be.equal(range.end);
                            });
                        },
                        contentAfter: 'cab[]',
                    });
                });
                it('should work with default RangePosition.BEFORE and RangePosition.BEFORE', () => {
                    testEditor({
                        contentBefore: 'ab[]',
                        stepFunction: async (editor: JWEditor) => {
                            const aNode = editor.vDocument.root.next(node => node.value === 'a');
                            const rangeParams: RangeFromTo = {
                                start: aNode,
                                end: aNode,
                            };
                            await editor.vDocument.withCustomRange(rangeParams, range => {
                                editor.vDocument.insertText('c', range);
                                editor.renderer.render(editor.vDocument, editor.editable);
                            });
                        },
                        contentAfter: 'cab[]',
                    });
                });
                it('should work with RangePosition.BEFORE and RangePosition.BEFORE', () => {
                    testEditor({
                        contentBefore: 'ab[]',
                        stepFunction: async (editor: JWEditor) => {
                            const aNode = editor.vDocument.root.next(node => node.value === 'a');
                            const rangeParams: RangeFromTo = {
                                start: aNode,
                                startPosition: RangePosition.BEFORE,
                                end: aNode,
                                endPosition: RangePosition.BEFORE,
                            };
                            await editor.vDocument.withCustomRange(rangeParams, range => {
                                editor.vDocument.insertText('c', range);
                                editor.renderer.render(editor.vDocument, editor.editable);
                            });
                        },
                        contentAfter: 'cab[]',
                    });
                });
                it('should work with RangePosition.BEFORE and RangePosition.AFTER', () => {
                    testEditor({
                        contentBefore: 'ab[]',
                        stepFunction: async (editor: JWEditor) => {
                            const aNode = editor.vDocument.root.next(node => node.value === 'a');
                            const rangeParams: RangeFromTo = {
                                start: aNode,
                                startPosition: RangePosition.BEFORE,
                                end: aNode,
                                endPosition: RangePosition.AFTER,
                            };
                            await editor.vDocument.withCustomRange(rangeParams, range => {
                                editor.vDocument.insertText('c', range);
                                editor.renderer.render(editor.vDocument, editor.editable);
                            });
                        },
                        contentAfter: 'cb[]',
                    });
                });
                it('should work with RangePosition.AFTER and RangePosition.BEFORE', () => {
                    testEditor({
                        contentBefore: 'ab[]',
                        stepFunction: async (editor: JWEditor) => {
                            const aNode = editor.vDocument.root.next(node => node.value === 'a');
                            const bNode = editor.vDocument.root.next(node => node.value === 'b');
                            const rangeParams: RangeFromTo = {
                                start: aNode,
                                startPosition: RangePosition.AFTER,
                                end: bNode,
                                endPosition: RangePosition.BEFORE,
                            };
                            await editor.vDocument.withCustomRange(rangeParams, range => {
                                editor.vDocument.insertText('c', range);
                                editor.renderer.render(editor.vDocument, editor.editable);
                            });
                        },
                        contentAfter: 'acb[]',
                    });
                });
                it('should work with RangePosition.AFTER and RangePosition.AFTER', () => {
                    testEditor({
                        contentBefore: 'ab[]',
                        stepFunction: async (editor: JWEditor) => {
                            const aNode = editor.vDocument.root.next(node => node.value === 'a');
                            const bNode = editor.vDocument.root.next(node => node.value === 'b');
                            const rangeParams: RangeFromTo = {
                                start: aNode,
                                startPosition: RangePosition.AFTER,
                                end: bNode,
                                endPosition: RangePosition.AFTER,
                            };
                            await editor.vDocument.withCustomRange(rangeParams, range => {
                                editor.vDocument.insertText('c', range);
                                editor.renderer.render(editor.vDocument, editor.editable);
                            });
                        },
                        contentAfter: 'ac[]',
                    });
                });
            });
        });
        describe('insertText', () => {
            describe('bold', () => {
                describe('Range collapsed', () => {
                    it('should insert char not bold when range in between two paragraphs', () => {
                        testEditor({
                            contentBefore: '<p><b>a</b></p><p>[]</p><p><b>b</b></p>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<p><b>a</b></p><p>c[]</p><p><b>b</b></p>',
                        });
                    });
                    it('should insert char bold when the range in first position and next char is bold', () => {
                        testEditor({
                            contentBefore: '<b>[]a</b>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('b');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>b[]a</b>',
                        });
                    });
                    it('should insert char not bold when the range in first position and next char is not bold', () => {
                        testEditor({
                            contentBefore: '[]a',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('b');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: 'b[]a',
                        });
                    });
                    it('should insert char bold when previous char is bold and the next is not bold', () => {
                        testEditor({
                            contentBefore: '<b>a[]</b>b',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>ac[]</b>b',
                        });
                    });
                    it('should insert char not bold, when previous char is not bold, next is not bold', () => {
                        testEditor({
                            contentBefore: 'a[]b',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: 'ac[]b',
                        });
                    });
                    it('should insert char bold when previous char is bold and the next is not bold', () => {
                        testEditor({
                            contentBefore: '<b>a</b>[]b',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>ac[]</b>b',
                        });
                    });
                    it('should insert char not bold because char on a different parent should not be considered', () => {
                        testEditor({
                            contentBefore: '<p><b>a</b></p><p>[]b</p>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('c');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<p><b>a</b></p><p>c[]b</p>',
                        });
                    });
                    it('should insert with a fake range', () => {
                        testEditor({
                            contentBefore: '<p>a[b<b>c</b></p><p>de]f</p>',
                            stepFunction: (editor: JWEditor) => {
                                const bNode = editor.vDocument.root.next(
                                    node => node.value === 'b',
                                );
                                const eNode = editor.vDocument.root.next(
                                    node => node.value === 'e',
                                );
                                editor.execCommand('insertText', {
                                    value: 'gh',
                                    range: {
                                        start: bNode,
                                        end: eNode,
                                    },
                                });
                            },
                            contentAfter: '<p>a[<b>gh</b>e]f</p>',
                        });
                    });
                });

                describe('Range not collapsed', () => {
                    it('should replace without bold when nothing bold between range and nothing bold outside range', () => {
                        testEditor({
                            contentBefore: '[a]',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('b');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: 'b[]',
                        });
                        testEditor({
                            contentBefore: 'a[b]c',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('d');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: 'ad[]c',
                        });
                    });
                    it('should replace without bold when nothing bold between range and everything bold outside range', () => {
                        testEditor({
                            contentBefore: '<b>a</b>[b]<b>c</b>',
                            stepFunction: (editor: JWEditor) => {
                                editor.vDocument.insertText('d');
                                editor.renderer.render(editor.vDocument, editor.editable);
                            },
                            contentAfter: '<b>a</b>d[]<b>c</b>',
                        });
                    });
                    it('should replace with bold when anything inside the range is bold', () => {
                        testEditor({
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
                it('should make bold the next insertion', () => {
                    testEditor({
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
                it('should not make bold the next insertion when applyFormat 2 times', () => {
                    testEditor({
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
                it('should make bold the next insertion when applyFormat 1 time, after the first char', () => {
                    testEditor({
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
                it('should not make bold the next insertion when applyFormat 2 times, after the first char', () => {
                    testEditor({
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
                it('should not make bold the next insertion when applyFormat 1 time after the first char that is bold', () => {
                    testEditor({
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
                it('should make bold the next insertion when applyFormat 2 times after the first char that is bold', () => {
                    testEditor({
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
                it('should apply multiples format', () => {
                    testEditor({
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
                it('should be bold when selected is not bold', () => {
                    testEditor({
                        contentBefore: 'a[b]c',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: 'a[<b>b]</b>c',
                    });
                });
                it('should not be bold when selected is bold', () => {
                    testEditor({
                        contentBefore: 'a<b>[b]</b>c',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };
                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: 'a[b]c',
                    });
                });
                it('should be bold when one of the selected is bold', () => {
                    testEditor({
                        contentBefore: 'a<b>[b</b>c]',
                        stepFunction: (editor: JWEditor) => {
                            const params: FormatParams = {
                                format: 'bold',
                            };

                            editor.dispatcher.dispatch('applyFormat', params);
                            editor.renderer.render(editor.vDocument, editor.editable);
                        },
                        contentAfter: 'a[<b>bc]</b>',
                    });
                });
            });
            it('should applyFormat with a fake range', () => {
                testEditor({
                    contentBefore: 'a[bc]d',
                    stepFunction: (editor: JWEditor) => {
                        const aNode = editor.vDocument.root.next(node => node.value === 'a');
                        const cNode = editor.vDocument.root.next(node => node.value === 'c');
                        const params: FormatParams = {
                            format: 'bold',
                            range: {
                                start: aNode,
                                end: cNode,
                            },
                        };

                        editor.execCommand('applyFormat', params);
                    },
                    contentAfter: '<b>a[b</b>c]d',
                });
            });
        });
        describe('insert', () => {
            it('should insert with a fake range', () => {
                testEditor({
                    contentBefore: 'ab[]',
                    stepFunction: (editor: JWEditor) => {
                        const node = new VNode(VNodeType.CHAR, '#text', 'c');
                        const aNode = editor.vDocument.root.next(node => node.value === 'a');
                        const bNode = editor.vDocument.root.next(node => node.value === 'b');
                        const params: InsertParams = {
                            value: node,
                            range: {
                                start: aNode,
                                end: bNode,
                            },
                        };

                        editor.execCommand('insert', params);
                    },
                    contentAfter: 'cb[]',
                });
            });
        });
        describe('insertParagraphBreak', () => {
            it('should insertParagraphBreak with a fake range', () => {
                testEditor({
                    contentBefore: '<p>abc</p><p>de[]</p>',
                    stepFunction: (editor: JWEditor) => {
                        const bNode = editor.vDocument.root.next(node => node.value === 'b');
                        const cNode = editor.vDocument.root.next(node => node.value === 'c');
                        const params: OptionalRangeParams = {
                            range: {
                                start: bNode,
                                end: cNode,
                            },
                        };

                        editor.execCommand('insertParagraphBreak', params);
                        editor.renderer.render(editor.vDocument, editor.editable);
                    },
                    contentAfter: '<p>a</p><p>c</p><p>de[]</p>',
                });
            });
        });
    });
});
