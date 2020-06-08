import { describePlugin } from '../../utils/src/testUtils';
import { Pre } from '../src/Pre';
import { BasicEditor } from '../../../bundles/BasicEditor/BasicEditor';
import JWEditor from '../../core/src/JWEditor';
import { Core } from '../../core/src/Core';
import { LineBreak } from '../../plugin-linebreak/src/LineBreak';
import { Heading } from '../../plugin-heading/src/Heading';

const deleteForward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteForward');
const deleteBackward = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Core>('deleteBackward');
const insertLineBreak = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<LineBreak>('insertLineBreak');
const applyPreStyle = async (editor: JWEditor): Promise<void> =>
    await editor.execCommand<Pre>('applyPreStyle');
const applyHeadingStyle = (level: number) => {
    return async (editor: JWEditor): Promise<void> =>
        await editor.execCommand<Heading>('applyHeadingStyle', { level: level });
};

describePlugin(Pre, testEditor => {
    describe('parse/render', () => {
        it('should parse a pre with spaces at the beginning', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<pre>     a[b]c</pre>',
                contentAfter: '<pre>     a[b]c</pre>',
            });
        });
        it('should parse a pre with spaces at the end', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<pre>a[b]c     </pre>',
                contentAfter: '<pre>a[b]c     </pre>',
            });
        });
        it('should parse a pre with spaces at the beginning and at the end', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<pre>     a[b]c     </pre>',
                contentAfter: '<pre>     a[b]c     </pre>',
            });
        });
        it('should parse a pre with newlines and spaces', async () => {
            await testEditor(BasicEditor, {
                contentBefore: `<pre>ab
                [c]
                de</pre>`,
                contentAfter: `<pre>ab
                [c]
                de</pre>`,
            });
        });
        it('should parse a pre with bold and italic', async () => {
            await testEditor(BasicEditor, {
                contentBefore: `<pre><b>a<i>b
                [c]</i></b>
                de</pre>`,
                contentAfter:
                    '<pre><b>a</b><b><i>b</i></b>\n' +
                    '<b><i>                [c]</i></b>\n' +
                    '                de</pre>',
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
                        contentAfter: '<pre>     ab[]d</pre>',
                    });
                });
                it('should delete a character in a pre (space after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd     </pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>ab[]d     </pre>',
                    });
                });
                it('should delete a character in a pre (space before and after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd     </pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>     ab[]d     </pre>',
                    });
                });
                it('should delete a space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>  []   ab</pre>',
                        stepFunction: deleteForward,
                        contentAfter: '<pre>  []  ab</pre>',
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
                        contentAfter: '<pre>     a[]cd</pre>',
                    });
                });
                it('should delete a character in a pre (space after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>ab[]cd     </pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>a[]cd     </pre>',
                    });
                });
                it('should delete a character in a pre (space before and after)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>     ab[]cd     </pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>     a[]cd     </pre>',
                    });
                });
                it('should delete a space in a pre', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<pre>   []  ab</pre>',
                        stepFunction: deleteBackward,
                        contentAfter: '<pre>  []  ab</pre>',
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
                    it('should insert a double newline at the end of text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<pre>ab[]</pre>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<pre>ab\n\n[]</pre>',
                        });
                    });
                });
            });
        });
    });
    describe('applyPreStyle', () => {
        it('should turn a heading 1 into a pre', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>ab[]cd</h1>',
                stepFunction: applyPreStyle,
                contentAfter: '<pre>ab[]cd</pre>',
            });
        });
        it('should turn a heading 1 into a pre (character selected)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>a[b]c</h1>',
                stepFunction: applyPreStyle,
                contentAfter: '<pre>a[b]c</pre>',
            });
        });
        it('should turn a heading 1 a pre and a paragraph into three pres', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>a[b</h1><pre>cd</pre><p>e]f</p>',
                stepFunction: applyPreStyle,
                contentAfter: '<pre>a[b</pre><pre>cd</pre><pre>e]f</pre>',
            });
        });
    });
    describePlugin(Heading, testHeadingEditor => {
        describe('applyHeadingStyle', () => {
            it('should turn a pre with space and newlines into a paragraph', async () => {
                await testHeadingEditor(BasicEditor, {
                    contentBefore: '<pre>     a\nb[]c\n     d     </pre>',
                    stepFunction: applyHeadingStyle(0),
                    contentAfter:
                        '<p>&nbsp;&nbsp; &nbsp; a<br>b[]c<br>&nbsp;&nbsp; &nbsp; d &nbsp; &nbsp;&nbsp;</p>',
                });
            });
            it('should turn a pre with space and newlines into a paragraph (character selected)', async () => {
                await testHeadingEditor(BasicEditor, {
                    contentBefore: '<pre>     a\n[b]\n     c     </pre>',
                    stepFunction: applyHeadingStyle(0),
                    contentAfter:
                        '<p>&nbsp;&nbsp; &nbsp; a<br>[b]<br>&nbsp;&nbsp; &nbsp; c &nbsp; &nbsp;&nbsp;</p>',
                });
            });
            it('should turn a heading 1, a pre with space and newlines, and a heading 2 into three paragraphs', async () => {
                await testHeadingEditor(BasicEditor, {
                    contentBefore: '<h1>a[b</h1><pre>     c\n     d     </pre><h2>e]f</h2>',
                    stepFunction: applyHeadingStyle(0),
                    contentAfter:
                        '<p>a[b</p><p>&nbsp;&nbsp; &nbsp; c<br>&nbsp;&nbsp; &nbsp; d &nbsp; &nbsp;&nbsp;</p><p>e]f</p>',
                });
            });
        });
    });
});
