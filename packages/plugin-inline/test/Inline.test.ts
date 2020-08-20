import { describePlugin } from '../../utils/src/testUtils';
import { Inline } from '../src/Inline';
import JWEditor from '../../core/src/JWEditor';
import { Constructor } from '../../utils/src/utils';
import { Format } from '../../core/src/Format';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { BoldFormat } from '../../plugin-bold/src/BoldFormat';
import { Char } from '../../plugin-char/src/Char';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { Direction } from '../../core/src/VSelection';

const toggleFormat = async (editor: JWEditor, FormatClass: Constructor<Format>): Promise<void> => {
    await editor.execCommand<Inline>('toggleFormat', {
        FormatClass: FormatClass,
    });
};
const removeFormat = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<Inline>('removeFormat', {});
};

describePlugin(Inline, testEditor => {
    describe('FormatDomParser', () => {
        it('should parse text with nested similar formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p>a<span class="outer">bc<span class="inner">de</span>fg</span>h</p>',
                contentAfter:
                    '<p>a<span class="outer">bc<span class="inner">de</span>fg</span>h</p>',
            });
        });
        it('should parse some nested formats in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>ab<b>cd<i>ef<u>gh</u>ij</i>kl</b>mn</p>',
                contentAfter: '<p>ab<b>cd<i>ef<u>gh</u>ij</i>kl</b>mn</p>',
            });
        });
        it('should parse empty spans', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p><span class="outer"><span class="inner"></span></span></p>',
                contentAfter: '<p><span class="outer"><span class="inner"></span></span></p>',
            });
        });
    });
    describe('toggleFormat', () => {
        // TODO: test that selection collapsed toggle format without char-plugin
        // indeed does nothing.
        describe('Selection collapsed', () => {
            it('should do nothing', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[]</p>',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: '<p>[]<br></p>',
                });
            });
            it('should add the next char in bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[]</p>',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                        await editor.execCommand<Char>('insertText', { text: 'a' });
                    },
                    contentAfter: '<p><b>a[]</b></p>',
                });
            });
        });
        describe('Selection not collapsed', () => {
            it('should be bold when selected is not bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a[b]c',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[<b>b]</b>c',
                });
            });
            it('should not be bold when selected is bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<b>[b]</b>c',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[b]c',
                });
            });
            it('should be bold when one of the selected is bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<b>[b</b>c]',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a[<b>bc]</b>',
                });
            });
            it('should not be bold but keep attributes when selected is bold with various attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        'a<b style="color: red">b[cd</b><b style="color: green">ef]g</b>',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter:
                        'a<b style="color: red;">b[</b><span style="color: red;">cd</span><span style="color: green;">ef]</span><b style="color: green;">g</b>',
                });
            });
            it('should replace all text and add the next char in bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>[abc]</b></p>',
                    stepFunction: async (editor: JWEditor) => {
                        await editor.execCommand<Char>('insertText', { text: 'd' });
                    },
                    contentAfter: '<p><b>d[]</b></p>',
                });
            });
            it('should select and replace all text and add the next char in bold', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p><b>[]abc</b></p>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.anchor.parent;
                        await editor.execCommand('setSelection', {
                            vSelection: {
                                anchorNode: p.firstLeaf(),
                                anchorPosition: RelativePosition.BEFORE,
                                focusNode: p.lastLeaf(),
                                focusPosition: RelativePosition.AFTER,
                                direction: Direction.FORWARD,
                            },
                        });
                        await editor.execCommand<Char>('insertText', { text: 'd' });
                    },
                    contentAfter: '<p><b>d[]</b></p>',
                });
            });
            it('should be bold inside a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: 'a<a href="#">b[cd]e</a>f',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: 'a<a href="#">b[<b>cd]</b>e</a>f',
                });
            });
            it('should be bold inside a link and italic', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<i>a<a href="#">b[cd]e</a>f</i>',
                    stepFunction: async (editor: JWEditor) => {
                        await toggleFormat(editor, BoldFormat);
                    },
                    contentAfter: '<i>a<a href="#">b[<b>cd]</b>e</a>f</i>',
                });
            });
        });
    });
    describe('format and attributes', () => {
        it('should keep formats in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[]ga</i></b>',
                contentAfter: '<b><i>g[]ga</i></b>',
            });
        });
        it('should keep formats in order with inline node which use the inline renderer like image', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[]g<img src="#"></i></b>',
                contentAfter: '<b><i>g[]g<img src="#"></i></b>',
            });
        });
        it('should keep formats in order with inlines nodes which use the inline renderer like image', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[]g<img src="#1"><img src="#2"></i></b>',
                contentAfter: '<b><i>g[]g<img src="#1"><img src="#2"></i></b>',
            });
        });
        it('should keep formats and attributes in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[]g</span></b>',
                contentAfter: '<b><span a="b">g[]g</span></b>',
            });
        });
        it('should keep nested formats in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[g</i>o]o</b>',
                contentAfter: '<b><i>g[g</i>o]o</b>',
            });
        });
        it('should keep nested formats and attributes in order', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[g</span>o]o</b>',
                contentAfter: '<b><span a="b">g[g</span>o]o</b>',
            });
        });
        it('should nest identical formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[g</i></b><b><i>o]o</i></b>',
                contentAfter: '<b><i>g[go]o</i></b>',
            });
        });
        it('should nest identical formats and attributes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[g</span></b><b><span a="b">o]o</span></b>',
                contentAfter: '<b><span a="b">g[go]o</span></b>',
            });
        });
        it('should nest ordered formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[g</i></b><b>o]o</b>',
                contentAfter: '<b><i>g[g</i>o]o</b>',
            });
        });
        it('should nest ordered formats and attributes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[g</span></b><b>o]o</b>',
                contentAfter: '<b><span a="b">g[g</span>o]o</b>',
            });
        });
        it('should not nest unordered formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><i>g[g</i></b><i><b>o]o</b></i>',
                contentAfter: '<b><i>g[g</i></b><i><b>o]o</b></i>',
            });
        });
        it('should not nest formats with different attributes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b>g[g</b><b a="b">o]o</b>',
                contentAfter: '<b>g[g</b><b a="b">o]o</b>',
            });
        });
        it('should not nest unordered formats and attributes', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<b><span a="b">g[g</span></b><span a="b"><b>o]o</b></span>',
                contentAfter: '<b><span a="b">g[g</span></b><span a="b"><b>o]o</b></span>',
            });
        });
    });
    describe('removeFormat', () => {
        it('should remove a format', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1><font style="color: red;">ab[cd]ef</font></h1>',
                stepFunction: async (editor: JWEditor) => {
                    await removeFormat(editor);
                },
                // TODO: the range placement is weird
                contentAfter:
                    '<h1><font style="color: red;">ab[</font>cd]<font style="color: red;">ef</font></h1>',
            });
        });
        it('should remove multiple formats', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1><i><font style="color: red;">ab[cd]ef</font></i></h1>',
                stepFunction: async (editor: JWEditor) => {
                    await removeFormat(editor);
                },
                // TODO: the range placement is weird
                contentAfter:
                    '<h1><i><font style="color: red;">ab[</font></i>cd]<i><font style="color: red;">ef</font></i></h1>',
            });
        });
    });
});
