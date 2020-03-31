import { describePlugin } from "../../utils/src/testUtils";
import { TextColor } from "../src/TextColor";
import { Char } from "../../plugin-char/src/Char";
import JWEditor from "../../core/src/JWEditor";
import { BasicEditor } from "../../../bundles/BasicEditor";

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
                    contentAfter: '<p style="color: yellow;">a[<span style="color: red;">bc]</span>d</p>',
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
            it('should not set the background color of characters that already have that background color through an ancestor', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter: '<p style="color: yellow;">a[bc]d</p>',
                });
            });
            it("should only set the background color of characters that don't already have that background color through an ancestor", async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: yellow;">a[bc</p><p>de]f</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter: '<p style="color: yellow;">a[bc</p><p><span style="color: yellow;">de]</span>f</p>',
                });
            });
            it('should not set the background color of characters that already have that background color through a format', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<i style="color: yellow;">b[cd]e</i>f</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter: '<p>a<i style="color: yellow;">b[cd]e</i>f</p>',
                });
            });
            it("should only set the background color of characters that don't already have that background color through a format", async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<i style="color: yellow;">b[cd</i>e]f</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'yellow');
                    },
                    contentAfter: '<p>a<i style="color: yellow;">b[cd</i><span style="color: yellow;">e]</span>f</p>',
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
                    contentAfter: '<p style="color: red">a<span style="color: black;">b[]</span>c</p>',
                });
            });
            it('should write two characters in black background', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: red">a[]d</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                        await insertText(editor, 'b');
                        await insertText(editor, 'c');
                    },
                    contentAfter: '<p style="color: red">a<span style="color: black;">bc[]</span>d</p>',
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
                    contentAfter: '<p style="color: yellow;">a[<span style="color: black;">bc]</span>d</p>',
                });
            });
            it('should set the color of two characters to red, then unset it, within a paragraph with yellow text', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorText(editor, 'red');
                        await uncolorText(editor);
                    },
                    contentAfter: '<p style="color: yellow;">a[<span style="color: black;">bc]</span>d</p>',
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
                    contentBefore: '<p style="color: red;">[a<span style="color: black;">b</span>c<span style="color: yellow;">d</span>e]</p>',
                    stepFunction: async editor => {
                        await uncolorText(editor);
                    },
                    contentAfter: '<p>[a<span>b</span>c<span>d</span>e]</p>',
                });
            });
        });
    });
});
