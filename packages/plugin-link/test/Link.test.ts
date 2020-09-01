import { describePlugin } from '../../utils/src/testUtils';
import { Link } from '../src/Link';
import { Char } from '../../plugin-char/src/Char';
import JWEditor from '../../core/src/JWEditor';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Core } from '../../core/src/Core';
import { LineBreak } from '../../plugin-linebreak/src/LineBreak';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { Direction } from '../../core/src/VSelection';

const convertToLink = async function(editor: JWEditor): Promise<void> {
    await editor.execCommand<Link>('link', { url: 'url' });
};
const insertLink = async function(editor: JWEditor): Promise<void> {
    await editor.execCommand<Link>('link', { url: 'url', label: 'label' });
};
const unLink = async function(editor: JWEditor): Promise<void> {
    await editor.execCommand<Link>('unlink');
};
const insertText = async function(editor: JWEditor, text: string): Promise<void> {
    await editor.execCommand<Char>('insertText', {
        text: text,
    });
};
const insertParagraphBreak = async function(editor: JWEditor): Promise<void> {
    await editor.execCommand<Core>('insertParagraphBreak');
};
const insertLineBreak = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<LineBreak>('insertLineBreak');
};
describePlugin(Link, testEditor => {
    describe('insert Link', () => {
        describe('range collapsed', () => {
            it('should insert a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]c</p>',
                    stepFunction: async editor => {
                        await insertLink(editor);
                    },
                    contentAfter: '<p>a<a href="url">label[]</a>c</p>',
                });
            });
            it('should insert a link and write a character after the link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]c</p>',
                    stepFunction: async editor => {
                        await insertLink(editor);
                        await insertText(editor, 'b');
                    },
                    contentAfter: '<p>a<a href="url">label</a>b[]c</p>',
                });
            });
            it('should write two characters after the link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]d</p>',
                    stepFunction: async editor => {
                        await insertLink(editor);
                        await insertText(editor, 'b');
                        await insertText(editor, 'c');
                    },
                    contentAfter: '<p>a<a href="url">label</a>bc[]d</p>',
                });
            });
            it('should insert a link and write a character after the link then create a new <p>', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]c</p>',
                    stepFunction: async editor => {
                        await insertLink(editor);
                        await insertText(editor, 'b');
                        await insertParagraphBreak(editor);
                    },
                    contentAfter: '<p>a<a href="url">label</a>b</p><p>[]c</p>',
                });
            });
            it('should insert a link and write a character, a new <p> and another character', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]d</p>',
                    stepFunction: async editor => {
                        await insertLink(editor);
                        await insertText(editor, 'b');
                        await insertParagraphBreak(editor);
                        await insertText(editor, 'c');
                    },
                    contentAfter: '<p>a<a href="url">label</a>b</p><p>c[]d</p>',
                });
            });
            it.skip('should insert a link and write a character at the end of the link then insert a <br>', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]c</p>',
                    stepFunction: async editor => {
                        await insertLink(editor);
                        await insertText(editor, 'b');
                        await insertLineBreak(editor);
                    },
                    contentAfter: '<p>a<a href="url">labelb<br>[]</a>c</p>',
                });
            });
            it.skip('should insert a link and write a character insert a <br> and another character', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]d</p>',
                    stepFunction: async editor => {
                        await insertLink(editor);
                        await insertText(editor, 'b');
                        await insertLineBreak(editor);
                        await insertText(editor, 'c');
                    },
                    contentAfter: '<p>a<a href="url">labelb<br>c[]</a>d</p>',
                });
            });
        });
        describe('range not collapsed', () => {
            it('should set the link on two existing characters and loose range', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]d</p>',
                    stepFunction: async editor => {
                        await convertToLink(editor);
                    },
                    contentAfter: '<p>a<a href="url">bc[]</a>d</p>',
                });
            });
            it('should set the link on two existing characters, lose range and add a character', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]e</p>',
                    stepFunction: async editor => {
                        await convertToLink(editor);
                        await insertText(editor, 'd');
                    },
                    contentAfter: '<p>a<a href="url">bc</a>d[]e</p>',
                });
            });
        });
    });
    describe('remove link', () => {
        describe('range collapsed', () => {
            it('should remove the link if collapsed range at the end of a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<a href="exist">bcd[]</a>e</p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p>abcd[]e</p>',
                });
            });
            it('should remove the link if collapsed range in the middle a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<a href="exist">b[]cd</a>e</p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p>ab[]cde</p>',
                });
            });
            it('should remove the link if collapsed range at the start of a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<a href="exist">[]bcd</a>e</p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p>a[]bcde</p>',
                });
            });
            it('should remove only the current link if collapsed range in the middle of a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<p><a href="exist">a</a>b<a href="exist">c[]d</a>e<a href="exist">f</a></p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p><a href="exist">a</a>bc[]de<a href="exist">f</a></p>',
                });
            });
        });
        describe('range not collapsed', () => {
            it('should remove the link in the selected range at the end of a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<a href="exist">bc[d]</a>e</p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p>a<a href="exist">bc[</a>d]e</p>',
                });
            });
            it('should remove the link in the selected range in the middle of a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<a href="exist">b[c]d</a>e</p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p>a<a href="exist">b[</a>c]<a href="exist">d</a>e</p>',
                });
            });
            it('should remove the link in the selected range at the start of a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<a href="exist">[b]cd</a>e</p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p>a[b]<a href="exist">cd</a>e</p>',
                });
            });
            it('should remove the link in the selected range overlapping the end of a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<a href="exist">bc[d</a>e]f</p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p>a<a href="exist">bc[</a>de]f</p>',
                });
            });
            it('should remove the link in the selected range overlapping the start of a link', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[b<a href="exist">c]de</a>f</p>',
                    stepFunction: async editor => {
                        await unLink(editor);
                    },
                    contentAfter: '<p>a[bc]<a href="exist">de</a>f</p>',
                });
            });
        });
    });
    describe('existing link', () => {
        it('should parse correctly a span inside a Link', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist"><span>b[]</span></a>c</p>',
                contentAfter: '<p>a<a href="exist"><span>b[]</span></a>c</p>',
            });
        });
        it('should parse correctly an empty span inside a Link', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist">b[]<span></span></a>c</p>',
                contentAfter: '<p>a<a href="exist">b[]<span></span></a>c</p>',
            });
        });
        it('should parse correctly a span inside a Link 2', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist"><span>b[]</span>c</a>d</p>',
                contentAfter: '<p>a<a href="exist"><span>b[]</span>c</a>d</p>',
            });
        });
        it('should parse correctly an empty span inside a Link then add a char', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist">b[]<span></span></a>c</p>',
                stepFunction: async editor => {
                    await insertText(editor, 'c');
                },
                contentAfter: '<p>a<a href="exist">bc[]<span></span></a>c</p>',
            });
        });
        it('should parse correctly a span inside a Link then add a char', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist"><span>b[]</span></a>d</p>',
                stepFunction: async editor => {
                    await insertText(editor, 'c');
                },
                contentAfter: '<p>a<span><a href="exist">b</a>c[]</span>d</p>',
            });
        });
        it('should parse correctly a span inside a Link then add a char 2', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist"><span>b[]</span>d</a>e</p>',
                stepFunction: async editor => {
                    await insertText(editor, 'c');
                },
                contentAfter: '<p>a<a href="exist"><span>bc[]</span>d</a>e</p>',
            });
        });
        it('should parse correctly a span inside a Link then add a char 3', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist"><span>b</span>c[]</a>e</p>',
                stepFunction: async editor => {
                    await insertText(editor, 'd');
                },
                contentAfter: '<p>a<a href="exist"><span>b</span>c</a>d[]e</p>',
            });
        });
        it('should add a character after the link', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist">b[]</a>d</p>',
                stepFunction: async editor => {
                    await insertText(editor, 'c');
                },
                contentAfter: '<p>a<a href="exist">b</a>c[]d</p>',
            });
        });
        it('should add a character after the link if range just after link', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist">b</a>[]d</p>',
                stepFunction: async editor => {
                    await insertText(editor, 'c');
                },
                contentAfter: '<p>a<a href="exist">b</a>c[]d</p>',
            });
        });
        it('should add a character in the link after a br tag', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist">b<br>[]</a>d</p>',
                stepFunction: async editor => {
                    await insertText(editor, 'c');
                },
                contentAfter: '<p>a<a href="exist">b<br>c[]</a>d</p>',
            });
        });
        it('should not add a character in the link if start of paragraph', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a<a href="exist">b</a></p><p>[]d</p>',
                stepFunction: async editor => {
                    await insertText(editor, 'c');
                },
                contentAfter: '<p>a<a href="exist">b</a></p><p>c[]d</p>',
            });
        });
        it('should select and replace all text and add the next char in bold', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<div><p>[]123</p><p><a href="#">abc</a></p></div>',
                stepFunction: async (editor: JWEditor) => {
                    const p = editor.selection.anchor.parent.nextSibling();
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
                contentAfter: '<div><p>123</p><p><a href="#">d[]</a></p></div>',
            });
        });
    });
});
