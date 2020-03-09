/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import { testEditor } from '../src/testUtils';
import JWEditor from '../../core/src/JWEditor';
import { CharNode } from '../../plugin-char/src/CharNode';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { BasicEditor } from '../../../bundles/BasicEditor';

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
                            const vDocument = editor.vDocument;
                            expect(vDocument.root instanceof FragmentNode).to.be.true;
                            expect(vDocument.root.children().length).to.equal(1);
                            const p = vDocument.root.children()[0] as VElement;
                            expect(p.htmlTag).to.equal('P');
                            expect(p.children().length).to.equal(1);
                            expect(p.children()[0] instanceof CharNode).to.be.true;
                            expect((p.children()[0] as CharNode).char).to.equal('a');
                        },
                    });
                });
            });
        });
    });
});
