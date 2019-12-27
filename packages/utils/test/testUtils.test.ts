import { expect } from 'chai';
import { testEditor } from '../src/testUtils';
import JWEditor from '../../core/src/JWEditor';
import { CharNode } from '../../core/src/VNodes/CharNode';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { VElement } from '../../core/src/VNodes/VElement';

describe('core', () => {
    describe('utils', () => {
        describe('testUtils', () => {
            describe('testEditor()', () => {
                it('content should be the same (no selection)', async () => {
                    let content;
                    content = 'a';
                    await testEditor({
                        contentBefore: content,
                        contentAfter: content,
                    });

                    content = '<b>a</b>';
                    await testEditor({
                        contentBefore: content,
                        contentAfter: content,
                    });
                });
                it('should parse with selection', () => {
                    testEditor({
                        contentBefore: '<p>[a]</p>',
                        stepFunction: (editor: JWEditor) => {
                            const vDocument = editor.vDocument;
                            expect(vDocument.root instanceof FragmentNode).to.be.true;
                            expect(vDocument.root.children.length).to.equal(1);
                            const p = vDocument.root.children[0] as VElement;
                            expect(p.htmlTag).to.equal('P');
                            expect(p.children.length).to.equal(1);
                            expect(p.children[0] instanceof CharNode).to.be.true;
                            expect((p.children[0] as CharNode).char).to.equal('a');
                        },
                    });
                });
            });
        });
    });
});
