/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { HeadingNode } from '../HeadingNode';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../../bundles/BasicEditor';
import JWEditor from '../../core/src/JWEditor';

describe('plugin-heading', () => {
    describe('HeadingNode', () => {
        it('should create a heading', async () => {
            for (let i = 1; i <= 6; i++) {
                const vNode = new HeadingNode(i);
                expect(vNode.atomic).to.equal(false);
                expect(vNode.htmlTag).to.equal('H' + i);
                expect(vNode.level).to.equal(i);
            }
        });
        it('shoul<d get a list of all descendants of the root node ', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                stepFunction: (editor: JWEditor) => {
                    const descendants = editor.vDocument.root.descendants();
                    expect(descendants.map(descendant => descendant.name)).to.deep.equal([
                        'HeadingNode: 1',
                        'ParagraphNode',
                        'CharNode: a',
                        'HeadingNode: 2',
                        'CharNode: b',
                    ]);
                },
            });
        });
        it('should get a list of all non-HEADING2 descendants of the root node ', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<h1><p>a</p></h1><h2>b</h2>',
                stepFunction: (editor: JWEditor) => {
                    const descendants = editor.vDocument.root.descendants(
                        descendant => !descendant.is(HeadingNode) || descendant.level !== 2,
                    );
                    expect(descendants.map(descendant => descendant.name)).to.deep.equal([
                        'HeadingNode: 1',
                        'ParagraphNode',
                        'CharNode: a',
                        'CharNode: b',
                    ]);
                },
            });
        });
    });
});
