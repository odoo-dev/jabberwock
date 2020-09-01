import { describePlugin } from '../../utils/src/testUtils';
import { TextColor } from '../src/TextColor';
import { Char } from '../../plugin-char/src/Char';
import JWEditor from '../../core/src/JWEditor';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';

const colorText = async function(editor: JWEditor, color: string): Promise<void> {
    await editor.execCommand<TextColor>('colorText', {
        color: color,
    });
};
const uncolorText = async function(editor: JWEditor): Promise<void> {
    await editor.execCommand<TextColor>('uncolorText');
};
const insertText = async function(editor: JWEditor, text: string): Promise<void> {
    await editor.execCommand<Char>('insertText', {
        text: text,
    });
};
describePlugin(TextColor, testEditor => {
    describe('colorText', () => {
        describe('range collapsed', () => {
            it('should write a character in red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]c</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                        await insertText(editor, 'b');
                    },
                    contentAfter: '<p>a<span style="color: red;">b[]</span>c</p>',
                });
            });
            it('should write two characters in red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]d</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                        await insertText(editor, 'b');
                        await insertText(editor, 'c');
                    },
                    contentAfter: '<p>a<span style="color: red;">bc[]</span>d</p>',
                });
            });
            it('should change color when write text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[]</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                        await insertText(editor, 'a');
                        await colorText(editor, 'blue');
                        await insertText(editor, 'b');
                    },
                    contentAfter:
                        '<p><span style="color: red;">a</span><span style="color: blue;">b[]</span></p>',
                });
            });
        });
        describe('range not collapsed', () => {
            it('should set the color of two characters to red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                    },
                    contentAfter: '<p>a[<span style="color: red;">bc]</span>d</p>',
                });
            });
            it('should set the color of two characters to red, within a paragraph with yellow text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                    },
                    contentAfter:
                        '<p style="color: yellow;">a[<span style="color: red;">bc]</span>d</p>',
                });
            });
            it('should set the color of a paragraph to red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p><p>def</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                    },
                    contentAfter: '<p style="color: red;">[abc]</p><p>def</p>',
                });
            });
            it('should set the color of everything to red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                    },
                    contentAfter: '<p style="color: red;">[abc]</p>',
                });
            });
            it('should not set the color of characters that already have that color through an ancestor', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter: '<p style="color: yellow;">a[bc]d</p>',
                });
            });
            it("should only set the color of characters that don't already have that color through an ancestor", async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: yellow;">a[bc</p><p>de]f</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter:
                        '<p style="color: yellow;">a[bc</p><p><span style="color: yellow;">de]</span>f</p>',
                });
            });
            it('should not set the color of characters that already have that color through a format', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<i style="color: yellow;">b[cd]e</i>f</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter: '<p>a<i style="color: yellow;">b[cd]e</i>f</p>',
                });
            });
            it("should only set the color of characters that don't already have that color through a format", async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<i style="color: yellow;">b[cd</i>e]f</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter:
                        '<p>a<i style="color: yellow;">b[cd</i><span style="color: yellow;">e]</span>f</p>',
                });
            });
            it('should set the color of an italic container', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[<i>cd]</i>ef</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter: '<p>ab[<i style="color: yellow;">cd]</i>ef</p>',
                });
            });
            it('should set the color of the first word in an italic container', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab<i>[cd] ef</i>gh</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter: '<p>ab[<i><span style="color: yellow;">cd]</span> ef</i>gh</p>',
                });
            });
            it('should set the color of the second word in an italic container', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab<i>cd [ef] gh</i>ij</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter:
                        '<p>ab<i>cd [<span style="color: yellow;">ef]</span> gh</i>ij</p>',
                });
            });
            it('should set the color of a selection including an italic container', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[b<i>cd</i>e]f</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter:
                        '<p>a[<span style="color: yellow;">b</span><i style="color: yellow;">cd</i><span style="color: yellow;">e]</span>f</p>',
                });
            });
            it('should set the color of a selection already starting and ending with that color', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<p>a[<span style="color: yellow;">b</span><i><span style="color: yellow;">cd</span>ef</i><span style="color: yellow;">g]h</span>f</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    // We keep a span without attributes because it was parsed
                    // as a span, not as a color on its text. We don't want to
                    // break the user's css if it was applied to the span.
                    contentAfter:
                        '<p>a[<span style="color: yellow;">b</span><i style="color: yellow;"><span>cd</span>ef</i><span style="color: yellow;">g]h</span>f</p>',
                });
            });
            it('should set the color of all characters to red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>[a]</h1><p>b</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                    },
                    contentAfter: '<h1 style="color: red;">[a]</h1><p>b</p>',
                });
            });
            it('should set the color of all characters to red with different attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1 class="aaa">[a]</h1><p class="yyy">b</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                    },
                    contentAfter:
                        '<h1 class="aaa" style="color: red;">[a]</h1><p class="yyy">b</p>',
                });
            });
            it('should set the color of all characters to red with same attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1 class="aaa">[a]</h1><p class="aaa">b</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                    },
                    contentAfter:
                        '<h1 class="aaa" style="color: red;">[a]</h1><p class="aaa">b</p>',
                });
            });
        });
    });
    describe('uncolorText', () => {
        describe('range collapsed', () => {
            it('should write a character in black', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: red">a[]c</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                        await insertText(editor, 'b');
                    },
                    contentAfter:
                        '<p style="color: red;">a<span style="color: black;">b[]</span>c</p>',
                });
            });
            it('should write two characters in black', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: red">a[]d</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                        await insertText(editor, 'b');
                        await insertText(editor, 'c');
                    },
                    contentAfter:
                        '<p style="color: red;">a<span style="color: black;">bc[]</span>d</p>',
                });
            });
        });
        describe('range not collapsed', () => {
            it('should remove the color of two characters', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<span style="color: red;">[bc]</span>d</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                    },
                    contentAfter: '<p>a[<span>bc]</span>d</p>',
                });
            });
            it('should set, then unset the color of two characters', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                        await uncolorText(editor);
                    },
                    contentAfter: '<p>a[bc]d</p>',
                });
            });
            it('should set the color of two characters to black, within a paragraph with yellow text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                    },
                    contentAfter:
                        '<p style="color: yellow;">a[<span style="color: black;">bc]</span>d</p>',
                });
            });
            it('should set the color of two characters to red, then unset it, within a paragraph with yellow text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                        await uncolorText(editor);
                    },
                    contentAfter:
                        '<p style="color: yellow;">a[<span style="color: black;">bc]</span>d</p>',
                });
            });
            it('should unset the color of a paragraph', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: red;">[abc]</p><p>def</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                    },
                    contentAfter: '<p>[abc]</p><p>def</p>',
                });
            });
            it('should unset the color of everything', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: red;">[abc]</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                    },
                    contentAfter: '<p>[abc]</p>',
                });
            });
            it('should unset the color of everything, including a few spans', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<p style="color: red;">[a<span style="color: black;">b</span>c<span style="color: yellow;">d</span>e]</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                    },
                    contentAfter: '<p>[a<span>b</span>c<span>d</span>e]</p>',
                });
            });
        });
    });
});
