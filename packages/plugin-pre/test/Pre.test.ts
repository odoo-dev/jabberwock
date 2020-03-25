import { describePlugin } from "../../utils/src/testUtils";
import { Pre } from "../src/Pre";
import { BasicEditor } from "../../../bundles/BasicEditor";
import JWEditor from "../../core/src/JWEditor";
import { Core } from "../../core/src/Core";
import { LineBreak } from "../../plugin-linebreak/src/LineBreak";

const deleteForward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteForward');
const deleteBackward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteBackward');
const insertLineBreak = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<LineBreak>('insertLineBreak');

describePlugin(Pre, testEditor => {
    describe('parse/render', () => {
        it('should parse a pre with spaces at the beginning', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<pre>     a[b]c</pre>',
                // TODO: the space needs not be rendered as
                // non-breakable space.
                contentAfter: '<pre>&nbsp;&nbsp; &nbsp; a[b]c</pre>',
            });
        });
        it('should parse a pre with spaces at the end', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<pre>a[b]c     </pre>',
                // TODO: the space needs not be rendered as
                // non-breakable space.
                contentAfter: '<pre>a[b]c &nbsp; &nbsp;&nbsp;</pre>',
            });
        });
        it('should parse a pre with spaces at the beginning and at the end', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<pre>     a[b]c     </pre>',
                // TODO: the space needs not be rendered as
                // non-breakable space.
                contentAfter: '<pre>&nbsp;&nbsp; &nbsp; a[b]c &nbsp; &nbsp;&nbsp;</pre>',
            });
        });
        it('should parse a pre with newlines and spaces', async () => {
            await testEditor(BasicEditor, {
                contentBefore: `<pre>ab
                [c]
                de</pre>`,
                // TODO: the space needs not be rendered as
                // non-breakable space.
                contentAfter: `<pre>ab
 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;[c]
 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;de</pre>`,
            });
        });
    });
    describe('deleteForward', () => {
        describe('Selection collapsed', () => {
            describe('Pre', () => {
                it('should delete a character in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd</pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>ab[]d</pre>',
                    });
                });
                it('should delete a character in a pre (space before)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd</pre>',
                        stepFunction: deleteForward,
                        // TODO: the space needs not be rendered as
                        // non-breakable space.
                        contentAfter: '<pre>&nbsp;&nbsp; &nbsp; ab[]d</pre>',
                    });
                });
                it('should delete a character in a pre (space after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd     </pre>',
                        stepFunction: deleteForward,
                        // TODO: the space needs not be rendered as
                        // non-breakable space.
                        contentAfter: '<pre>ab[]d &nbsp; &nbsp;&nbsp;</pre>',
                    });
                });
                it('should delete a character in a pre (space before and after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd     </pre>',
                        stepFunction: deleteForward,
                        // TODO: the space needs not be rendered as
                        // non-breakable space.
                        contentAfter: '<pre>&nbsp;&nbsp; &nbsp; ab[]d &nbsp; &nbsp;&nbsp;</pre>',
                    });
                });
                it('should delete a space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>  []   ab</pre>',
                        stepFunction: deleteForward,
                        // TODO: the space needs not be rendered as
                        // non-breakable space.
                        contentAfter: '<pre>&nbsp;&nbsp;[] &nbsp;ab</pre>',
                    });
                });
                it('should delete a newline in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]\ncd</pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>ab[]cd</pre>',
                    });
                });
                it('should delete all leading space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>[]     ab</pre>',
                        stepFunction: async BasicEditor => {
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                        },
                        contentAfter: '<pre>[]ab</pre>',
                    });
                });
                it('should delete all trailing space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]     </pre>',
                        stepFunction: async BasicEditor => {
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                            await deleteForward(BasicEditor);
                        },
                        contentAfter: '<pre>ab[]</pre>',
                    });
                });
            });
        });
    });
    describe('deleteBackward', () => {
        describe('Selection collapsed', () => {
            describe('Pre', () => {
                it('should delete a character in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd</pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>a[]cd</pre>',
                    });
                });
                it('should delete a character in a pre (space before)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd</pre>',
                        stepFunction: deleteBackward,
                        // TODO: the space needs not be rendered as
                        // non-breakable space.
                        contentAfter: '<pre>&nbsp;&nbsp; &nbsp; a[]cd</pre>',
                    });
                });
                it('should delete a character in a pre (space after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd     </pre>',
                        stepFunction: deleteBackward,
                        // TODO: the space needs not be rendered as
                        // non-breakable space.
                        contentAfter: '<pre>a[]cd &nbsp; &nbsp;&nbsp;</pre>',
                    });
                });
                it('should delete a character in a pre (space before and after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd     </pre>',
                        stepFunction: deleteBackward,
                        // TODO: the space needs not be rendered as
                        // non-breakable space.
                        contentAfter: '<pre>&nbsp;&nbsp; &nbsp; a[]cd &nbsp; &nbsp;&nbsp;</pre>',
                    });
                });
                it('should delete a space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>   []  ab</pre>',
                        stepFunction: deleteBackward,
                        // TODO: the space needs not be rendered as
                        // non-breakable space.
                        contentAfter: '<pre>&nbsp;&nbsp;[] &nbsp;ab</pre>',
                    });
                });
                it('should delete a newline in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab\n[]cd</pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>ab[]cd</pre>',
                    });
                });
                it('should delete all leading space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     []ab</pre>',
                        stepFunction: async BasicEditor => {
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                        },
                        contentAfter: '<pre>[]ab</pre>',
                    });
                });
                it('should delete all trailing space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab     []</pre>',
                        stepFunction: async BasicEditor => {
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                            await deleteBackward(BasicEditor);
                        },
                        contentAfter: '<pre>ab[]</pre>',
                    });
                });
            });
        });
    });
    describe('VDocument', () => {
        describe('insertLineBreak', () => {
            describe('Selection collapsed', () => {
                describe('Pre', () => {
                    it('should insert a newline at the start of text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<pre>[]ab</pre>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<pre>\n[]ab</pre>',
                        });
                    });
                    it('should insert a newline within text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<pre>ab[]cd</pre>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<pre>ab\n[]cd</pre>',
                        });
                    });
                    it('should insert a newline at the end of text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<pre>ab[]</pre>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<pre>ab\n[]</pre>',
                        });
                    });
                });
            });
        });
    });
});
