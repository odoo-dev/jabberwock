import { expect } from 'chai';
import { testEditor } from '../src/testUtils';
import { VNodeType } from '../../core/src/VNodes/VNode';
import JWEditor from '../../core/src/JWEditor';
import { CharNode } from '../../core/src/VNodes/CharNode';

describe('core', () => {
    describe('utils', () => {
        describe('testUtils', () => {
            describe('testEditor()', () => {
                it('content should be the same (without range)', async () => {
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
                it('should parse with range', () => {
                    testEditor({
                        contentBefore: '<p>[a]</p>',
                        stepFunction: (editor: JWEditor) => {
                            const vDocument = editor.vDocument;
                            expect(vDocument.root.type).to.equal(VNodeType.ROOT);
                            expect(vDocument.root.children.length).to.equal(1);
                            const p = vDocument.root.children[0];
                            expect(p.type).to.equal(VNodeType.PARAGRAPH);
                            expect(p.children.length).to.equal(1);
                            expect(p.children[0].type).to.equal(VNodeType.CHAR);
                            expect((p.children[0] as CharNode).char).to.equal('a');
                        },
                    });
                });
            });
        });
    });
});
