import { expect } from 'chai';
import { HeadingNode } from '../src/HeadingNode';
import { Heading } from '../src/Heading';
import { describePlugin } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import JWEditor from '../../core/src/JWEditor';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

const applyHeadingStyle = (level: number) => {
    return async (editor: JWEditor): Promise<void> => {
        await editor.execCommand<Heading>('applyHeadingStyle', { level: level });
    };
};

describePlugin(Heading, testEditor => {
    describe('HeadingNode', () => {
        it('should create a heading', async () => {
            for (let i = 1; i <= 6; i++) {
                const vNode = new HeadingNode({ level: i });
                expect(vNode instanceof ContainerNode).to.equal(true);
                expect(vNode.htmlTag).to.equal('H' + i);
                expect(vNode.level).to.equal(i);
            }
        });
    });
    describe('applyHeadingStyle', () => {
        describe('level 0', () => {
            it('should turn a heading 1 into a paragraph', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab[]cd</h1>',
                    stepFunction: applyHeadingStyle(0),
                    contentAfter: '<p>ab[]cd</p>',
                });
            });
            it('should turn a heading 1 into a paragraph (character selected)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b]c</h1>',
                    stepFunction: applyHeadingStyle(0),
                    contentAfter: '<p>a[b]c</p>',
                });
            });
            it('should turn a heading 1, a paragraph and a heading 2 into three paragraphs', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b</h1><p>cd</p><h2>e]f</h2>',
                    stepFunction: applyHeadingStyle(0),
                    contentAfter: '<p>a[b</p><p>cd</p><p>e]f</p>',
                });
            });
            it('should turn a heading 1 into a paragraph after a triple click', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>[ab</h1><h2>]cd</h2>',
                    stepFunction: applyHeadingStyle(0),
                    contentAfter: '<p>[ab</p><h2>]cd</h2>',
                });
            });
            it('should not turn a div into a heading 0', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>[ab]</div>',
                    stepFunction: applyHeadingStyle(0),
                    contentAfter: '<div>[ab]</div>',
                });
            });
        });
        describe('level 1', () => {
            it('should turn a paragraph into a heading 1', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: applyHeadingStyle(1),
                    contentAfter: '<h1>ab[]cd</h1>',
                });
            });
            it('should turn a paragraph into a heading 1 (character selected)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[b]c</p>',
                    stepFunction: applyHeadingStyle(1),
                    contentAfter: '<h1>a[b]c</h1>',
                });
            });
            it('should turn a paragraph, a heading 1 and a heading 2 into three headings 1', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>a[b</p><h1>cd</h1><h2>e]f</h2>',
                    stepFunction: applyHeadingStyle(1),
                    contentAfter: '<h1>a[b</h1><h1>cd</h1><h1>e]f</h1>',
                });
            });
            it('should turn a paragraph into a heading 1 after a triple click', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[ab</p><h2>]cd</h2>',
                    stepFunction: applyHeadingStyle(1),
                    contentAfter: '<h1>[ab</h1><h2>]cd</h2>',
                });
            });
            it('should not turn a div into a heading 1', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>[ab]</div>',
                    stepFunction: applyHeadingStyle(1),
                    contentAfter: '<div>[ab]</div>',
                });
            });
        });
        describe('level 2', () => {
            it('should turn a heading 1 into a heading 2', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab[]cd</h1>',
                    stepFunction: applyHeadingStyle(2),
                    contentAfter: '<h2>ab[]cd</h2>',
                });
            });
            it('should turn a heading 1 into a heading 2 (character selected)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b]c</h1>',
                    stepFunction: applyHeadingStyle(2),
                    contentAfter: '<h2>a[b]c</h2>',
                });
            });
            it('should turn a heading 1, a heading 2 and a paragraph into three headings 2', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b</h1><h2>cd</h2><p>e]f</p>',
                    stepFunction: applyHeadingStyle(2),
                    contentAfter: '<h2>a[b</h2><h2>cd</h2><h2>e]f</h2>',
                });
            });
            it('should turn a paragraph into a heading 2 after a triple click', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[ab</p><h1>]cd</h1>',
                    stepFunction: applyHeadingStyle(2),
                    contentAfter: '<h2>[ab</h2><h1>]cd</h1>',
                });
            });
            it('should not turn a div into a heading 2', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>[ab]</div>',
                    stepFunction: applyHeadingStyle(2),
                    contentAfter: '<div>[ab]</div>',
                });
            });
        });
        describe('level 3', () => {
            it('should turn a heading 1 into a heading 3', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab[]cd</h1>',
                    stepFunction: applyHeadingStyle(3),
                    contentAfter: '<h3>ab[]cd</h3>',
                });
            });
            it('should turn a heading 1 into a heading 3 (character selected)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b]c</h1>',
                    stepFunction: applyHeadingStyle(3),
                    contentAfter: '<h3>a[b]c</h3>',
                });
            });
            it('should turn a heading 1, a paragraph and a heading 2 into three headings 3', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b</h1><p>cd</p><h2>e]f</h2>',
                    stepFunction: applyHeadingStyle(3),
                    contentAfter: '<h3>a[b</h3><h3>cd</h3><h3>e]f</h3>',
                });
            });
            it('should turn a paragraph into a heading 3 after a triple click', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[ab</p><h1>]cd</h1>',
                    stepFunction: applyHeadingStyle(3),
                    contentAfter: '<h3>[ab</h3><h1>]cd</h1>',
                });
            });
            it('should not turn a div into a heading 3', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>[ab]</div>',
                    stepFunction: applyHeadingStyle(3),
                    contentAfter: '<div>[ab]</div>',
                });
            });
        });
        describe('level 4', () => {
            it('should turn a heading 1 into a heading 4', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab[]cd</h1>',
                    stepFunction: applyHeadingStyle(4),
                    contentAfter: '<h4>ab[]cd</h4>',
                });
            });
            it('should turn a heading 1 into a heading 4 (character selected)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b]c</h1>',
                    stepFunction: applyHeadingStyle(4),
                    contentAfter: '<h4>a[b]c</h4>',
                });
            });
            it('should turn a heading 1, a paragraph and a heading 2 into three headings 4', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b</h1><p>cd</p><h2>e]f</h2>',
                    stepFunction: applyHeadingStyle(4),
                    contentAfter: '<h4>a[b</h4><h4>cd</h4><h4>e]f</h4>',
                });
            });
            it('should turn a paragraph into a heading 4 after a triple click', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[ab</p><h1>]cd</h1>',
                    stepFunction: applyHeadingStyle(4),
                    contentAfter: '<h4>[ab</h4><h1>]cd</h1>',
                });
            });
            it('should not turn a div into a heading 4', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>[ab]</div>',
                    stepFunction: applyHeadingStyle(4),
                    contentAfter: '<div>[ab]</div>',
                });
            });
        });
        describe('level 5', () => {
            it('should turn a heading 1 into a heading 5', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab[]cd</h1>',
                    stepFunction: applyHeadingStyle(5),
                    contentAfter: '<h5>ab[]cd</h5>',
                });
            });
            it('should turn a heading 1 into a heading 5 (character selected)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b]c</h1>',
                    stepFunction: applyHeadingStyle(5),
                    contentAfter: '<h5>a[b]c</h5>',
                });
            });
            it('should turn a heading 1, a paragraph and a heading 2 into three headings 5', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b</h1><p>cd</p><h2>e]f</h2>',
                    stepFunction: applyHeadingStyle(5),
                    contentAfter: '<h5>a[b</h5><h5>cd</h5><h5>e]f</h5>',
                });
            });
            it('should turn a paragraph into a heading 5 after a triple click', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[ab</p><h1>]cd</h1>',
                    stepFunction: applyHeadingStyle(5),
                    contentAfter: '<h5>[ab</h5><h1>]cd</h1>',
                });
            });
            it('should not turn a div into a heading 5', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>[ab]</div>',
                    stepFunction: applyHeadingStyle(5),
                    contentAfter: '<div>[ab]</div>',
                });
            });
        });
        describe('level 6', () => {
            it('should turn a heading 1 into a heading 6', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>ab[]cd</h1>',
                    stepFunction: applyHeadingStyle(6),
                    contentAfter: '<h6>ab[]cd</h6>',
                });
            });
            it('should turn a heading 1 into a heading 6 (character selected)', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b]c</h1>',
                    stepFunction: applyHeadingStyle(6),
                    contentAfter: '<h6>a[b]c</h6>',
                });
            });
            it('should turn a heading 1, a paragraph and a heading 2 into three headings 6', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<h1>a[b</h1><p>cd</p><h2>e]f</h2>',
                    stepFunction: applyHeadingStyle(6),
                    contentAfter: '<h6>a[b</h6><h6>cd</h6><h6>e]f</h6>',
                });
            });
            it('should turn a paragraph into a heading 6 after a triple click', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[ab</p><h1>]cd</h1>',
                    stepFunction: applyHeadingStyle(6),
                    contentAfter: '<h6>[ab</h6><h1>]cd</h1>',
                });
            });
            it('should not turn a div into a heading 6', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>[ab]</div>',
                    stepFunction: applyHeadingStyle(6),
                    contentAfter: '<div>[ab]</div>',
                });
            });
        });
    });
    describe('insertParagraphBreak', () => {
        it('should insert a new paragraph after the heading', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>abc[]</h1>',
                stepFunction: async editor => {
                    await editor.execCommand('insertParagraphBreak');
                },
                contentAfter: '<h1>abc</h1><p>[]<br></p>',
            });
        });
        it('should insert a new paragraph after the heading and not preserve modifiers', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1><u>abc[]</u></h1>',
                stepFunction: async editor => {
                    await editor.execCommand('insertParagraphBreak');
                    await editor.execCommand('insertText', { text: 'a' });
                },
                contentAfter: '<h1><u>abc</u></h1><p>a[]</p>',
            });
        });
        it('should insert a line break at the end of the heading if the heading is not breakable', async () => {
            await testEditor(BasicEditor, {
                beforeStart: editor => {
                    editor.configure({
                        modes: [
                            {
                                id: 'unbreakable',
                                rules: [
                                    {
                                        selector: [HeadingNode],
                                        properties: {
                                            breakable: {
                                                value: false,
                                            },
                                        },
                                    },
                                ],
                            },
                        ],
                    });
                    editor.configure({ mode: 'unbreakable' });
                },
                contentBefore: '<h1>abc[]</h1>',
                stepFunction: async editor => {
                    await editor.execCommand('insertParagraphBreak');
                },
                contentAfter: '<h1>abc<br>[]<br></h1>',
            });
        });
    });
});
