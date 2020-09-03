import { expect } from 'chai';
import { testEditor } from '../src/testUtils';
import JWEditor from '../../core/src/JWEditor';
import { CharNode } from '../../plugin-char/src/CharNode';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Layout } from '../../plugin-layout/src/Layout';

describe('core', () => {
    describe('utils', () => {
        describe('testUtils', () => {
            describe('testEditor()', () => {
                it('content should be the same (without range)', async () => {
                    let content: string;

                    // This particular test is there to trigger the addition of
                    // a range in the DOM before running the tests that are
                    // supposed to run "without range". The point is to check
                    // that the range is properly cleaned from the DOM.
                    content = '<p>[a]</p>';
                    await testEditor(BasicEditor, {
                        contentBefore: content,
                        contentAfter: content,
                    });

                    content = 'a';
                    await testEditor(BasicEditor, {
                        contentBefore: content,
                        contentAfter: content,
                    });

                    content = '<b>a</b>';
                    await testEditor(BasicEditor, {
                        contentBefore: content,
                        contentAfter: content,
                    });
                });
                it('should parse with range', () => {
                    testEditor(BasicEditor, {
                        contentBefore: '<p>[a]</p>',
                        stepFunction: (editor: JWEditor) => {
                            const domEngine = editor.plugins.get(Layout).engines.dom;
                            const editable = domEngine.components.editable[0];
                            expect(editable instanceof FragmentNode).to.be.true;
                            expect(editable.children().length).to.equal(1);
                            const p = editable.children()[0] as TagNode;
                            expect(p.htmlTag).to.equal('P');
                            expect(p.children().length).to.equal(1);
                            expect(p.children()[0] instanceof CharNode).to.be.true;
                            expect(p.children()[0].textContent).to.equal('a');
                        },
                    });
                });
            });
        });
    });
});
