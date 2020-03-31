import { describePlugin } from "../../utils/src/testUtils";
import { BackgroundColor } from "../src/BackgroundColor";
import { Char } from "../../plugin-char/src/Char";
import JWEditor from "../../core/src/JWEditor";
import { BasicEditor } from "../../../bundles/BasicEditor";

const colorBackground = async function(editor: JWEditor, color: string): Promise<void> {
    await editor.execCommand<BackgroundColor>('colorBackground', {
        color: color,
    });
};
const uncolorBackground = async function(editor: JWEditor): Promise<void> {
    await editor.execCommand<BackgroundColor>('uncolorBackground');
};
const insertText = async function(editor: JWEditor, text: string): Promise<void> {
    await editor.execCommand<Char>('insertText', {
        text: text,
    });
};
describePlugin(BackgroundColor, testEditor => {
    describe('colorBackground', () => {
        describe('range collapsed', () => {
            it('should write a character in red background', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]c</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'red');
                        await insertText(editor, 'b');
                    },
                    contentAfter: '<p>a<span style="background-color: red;">b[]</span>c</p>',
                });
            });
            it('should write two characters in red background', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[]d</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'red');
                        await insertText(editor, 'b');
                        await insertText(editor, 'c');
                    },
                    contentAfter: '<p>a<span style="background-color: red;">bc[]</span>d</p>',
                });
            });
        });
        describe('range not collapsed', () => {
            it('should set the background color of two characters to red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'red');
                    },
                    contentAfter: '<p>a[<span style="background-color: red;">bc]</span>d</p>',
                });
            });
            it('should set the background color of two characters to red, within a paragraph with yellow background', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'red');
                    },
                    contentAfter: '<p style="background-color: yellow;">a[<span style="background-color: red;">bc]</span>d</p>',
                });
            });
            it('should set the background color of a paragraph to red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p><p>def</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'red');
                    },
                    contentAfter: '<p style="background-color: red;">[abc]</p><p>def</p>',
                });
            });
            it('should set the background color of everything to red', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'red');
                    },
                    contentAfter: '<p style="background-color: red;">[abc]</p>',
                });
            });
            it('should not set the background color of characters that already have that background color through an ancestor', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'yellow');
                    },
                    contentAfter: '<p style="background-color: yellow;">a[bc]d</p>',
                });
            });
            it("should only set the background color of characters that don't already have that background color through an ancestor", async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: yellow;">a[bc</p><p>de]f</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'yellow');
                    },
                    contentAfter: '<p style="background-color: yellow;">a[bc</p><p><span style="background-color: yellow;">de]</span>f</p>',
                });
            });
            it('should not set the background color of characters that already have that background color through a format', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<i style="background-color: yellow;">b[cd]e</i>f</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'yellow');
                    },
                    contentAfter: '<p>a<i style="background-color: yellow;">b[cd]e</i>f</p>',
                });
            });
            it("should only set the background color of characters that don't already have that background color through a format", async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<i style="background-color: yellow;">b[cd</i>e]f</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'yellow');
                    },
                    contentAfter: '<p>a<i style="background-color: yellow;">b[cd</i><span style="background-color: yellow;">e]</span>f</p>',
                });
            });
        });
    });
    describe('uncolorBackground', () => {
        describe('range collapsed', () => {
            it('should write a character in white background', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: red">a[]c</p>',
                    stepFunction: async editor => {
                        await uncolorBackground(editor);
                        await insertText(editor, 'b');
                    },
                    contentAfter: '<p style="background-color: red">a<span style="background-color: white;">b[]</span>c</p>',
                });
            });
            it('should write two characters in white background', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: red">a[]d</p>',
                    stepFunction: async editor => {
                        await uncolorBackground(editor);
                        await insertText(editor, 'b');
                        await insertText(editor, 'c');
                    },
                    contentAfter: '<p style="background-color: red">a<span style="background-color: white;">bc[]</span>d</p>',
                });
            });
        });
        describe('range not collapsed', () => {
            it('should remove the background color of two characters', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a<span style="background-color: red;">[bc]</span>d</p>',
                    stepFunction: async editor => {
                        await uncolorBackground(editor);
                    },
                    contentAfter: '<p>a[<span>bc]</span>d</p>',
                });
            });
            it('should set, then unset the background color of two characters', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'red');
                        await uncolorBackground(editor);
                    },
                    contentAfter: '<p>a[bc]d</p>',
                });
            });
            it('should set the background color of two characters to white, within a paragraph with yellow background', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await uncolorBackground(editor);
                    },
                    contentAfter: '<p style="background-color: yellow;">a[<span style="background-color: white;">bc]</span>d</p>',
                });
            });
            it('should set the background color of two characters to red, then unset it, within a paragraph with yellow background', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: yellow;">a[bc]d</p>',
                    stepFunction: async editor => {
                        await colorBackground(editor, 'red');
                        await uncolorBackground(editor);
                    },
                    contentAfter: '<p style="background-color: yellow;">a[<span style="background-color: white;">bc]</span>d</p>',
                });
            });
            it('should unset the background color of a paragraph', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: red;">[abc]</p><p>def</p>',
                    stepFunction: async editor => {
                        await uncolorBackground(editor);
                    },
                    contentAfter: '<p>[abc]</p><p>def</p>',
                });
            });
            it('should unset the background color of everything', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: red;">[abc]</p>',
                    stepFunction: async editor => {
                        await uncolorBackground(editor);
                    },
                    contentAfter: '<p>[abc]</p>',
                });
            });
            it('should unset the background color of everything, including a few spans', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p style="background-color: red;">[a<span style="background-color: white;">b</span>c<span style="background-color: yellow;">d</span>e]</p>',
                    stepFunction: async editor => {
                        await uncolorBackground(editor);
                    },
                    contentAfter: '<p>[a<span>b</span>c<span>d</span>e]</p>',
                });
            });
        });
    });
});
