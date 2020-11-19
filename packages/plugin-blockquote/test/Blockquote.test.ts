import { expect } from 'chai';
import { BlockquoteNode } from '../src/BlockquoteNode';
import { Blockquote } from '../src/Blockquote';
import { describePlugin } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import JWEditor from '../../core/src/JWEditor';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

const applyBlockquoteStyle = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<Blockquote>('applyBlockquoteStyle');
};

describePlugin(Blockquote, testEditor => {
    describe('BlockquoteNode', () => {
        it('should create a blockquote', async () => {
            for (let i = 1; i <= 6; i++) {
                const vNode = new BlockquoteNode();
                expect(vNode instanceof ContainerNode).to.equal(true);
                expect(vNode.htmlTag).to.equal('BLOCKQUOTE');
            }
        });
    });
    describe('applyBlockquoteStyle', () => {
        it('should turn a blockquote into a paragraph', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>ab[]cd</h1>',
                stepFunction: applyBlockquoteStyle,
                contentAfter: '<blockquote>ab[]cd</blockquote>',
            });
        });
        it('should turn a heading 1 into a blockquote (character selected)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>a[b]c</h1>',
                stepFunction: applyBlockquoteStyle,
                contentAfter: '<blockquote>a[b]c</blockquote>',
            });
        });
        it('should turn a heading 1, a paragraph and a heading 2 into three blockquote', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>a[b</h1><p>cd</p><h2>e]f</h2>',
                stepFunction: applyBlockquoteStyle,
                contentAfter:
                    '<blockquote>a[b</blockquote><blockquote>cd</blockquote><blockquote>e]f</blockquote>',
            });
        });
        it('should turn a heading 1 into a blockquote after a triple click', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1>[ab</h1><h2>]cd</h2>',
                stepFunction: applyBlockquoteStyle,
                contentAfter: '<blockquote>[ab</blockquote><h2>]cd</h2>',
            });
        });
        it('should not turn a div into a blockquote', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<div>[ab]</div>',
                stepFunction: applyBlockquoteStyle,
                contentAfter: '<div>[ab]</div>',
            });
        });
    });
    describe('insertParagraphBreak', () => {
        it('should insert a line break within the blockquote', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<blockquote>ab[]cd</blockquote>',
                stepFunction: async editor => {
                    await editor.execCommand('insertParagraphBreak');
                },
                contentAfter: '<blockquote>ab<br>[]cd</blockquote>',
            });
        });
        it('should insert a new paragraph after the blockquote', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<blockquote>abc[]</blockquote>',
                stepFunction: async editor => {
                    await editor.execCommand('insertParagraphBreak');
                },
                contentAfter: '<blockquote>abc</blockquote><p>[]<br></p>',
            });
        });
        it('should insert a new paragraph after the blockquote and not preserve modifiers', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<blockquote><u>abc[]</u></blockquote>',
                stepFunction: async editor => {
                    await editor.execCommand('insertParagraphBreak');
                    await editor.execCommand('insertText', { text: 'a' });
                },
                contentAfter: '<blockquote><u>abc</u></blockquote><p>a[]</p>',
            });
        });
    });
});
