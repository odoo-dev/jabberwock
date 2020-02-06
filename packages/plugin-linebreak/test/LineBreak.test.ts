import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { LineBreakNode } from '../LineBreakNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { CharNode } from '../../plugin-char/CharNode';
import { VDocument } from '../../core/src/VDocument';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { LineBreak } from '../LineBreak';
import { describePlugin } from '../../utils/src/testUtils';

const insertLineBreak = (editor: JWEditor): void => editor.execCommand('insertLineBreak');

describePlugin(LineBreak, testEditor => {
    describe('parse', () => {
        it('should not parse a placeholder BR node', async () => {
            const br = document.createElement('br');
            const fakeParent = new VElement('PARENT-NODE');
            const context = {
                currentNode: br,
                parentVNode: fakeParent,
                vDocument: new VDocument(new FragmentNode()),
            };
            const parsingMap = LineBreak.parse(context)[1];
            expect(parsingMap.size).to.equal(1);
            const node = parsingMap.keys().next().value;
            expect(node).to.equal(fakeParent);
            expect(parsingMap.get(node)).to.deep.equal([br]);
        });
        it('should parse two BR node as one line break', async () => {
            const p = document.createElement('p');
            const br1 = document.createElement('br');
            const br2 = document.createElement('br');
            p.appendChild(br1);
            p.appendChild(br2);
            const context = {
                currentNode: br1,
                parentVNode: new VElement('PARENT-NODE'),
                vDocument: new VDocument(new FragmentNode()),
            };
            const parsingMap = LineBreak.parse(context)[1];
            expect(parsingMap.size).to.equal(1);
            const lineBreak = parsingMap.keys().next().value;
            expect(lineBreak.atomic).to.equal(true);
            const node = parsingMap.keys().next().value;
            expect(node).to.equal(lineBreak);
            expect(parsingMap.get(node)).to.deep.equal([br1, br2]);
        });
        it('should not parse a SPAN node', async () => {
            const context = {
                currentNode: document.createElement('span'),
                vDocument: new VDocument(new FragmentNode()),
            };
            expect(LineBreak.parse(context)).to.be.undefined;
        });
    });
    describe('LineBreakNode', () => {
        describe('constructor', () => {
            it('should create a LineBreakNode', async () => {
                const lineBreak = new LineBreakNode();
                expect(lineBreak.atomic).to.equal(true);
            });
        });
        describe('render', () => {
            it('should render an ending lineBreak (default html arg)', async () => {
                const lineBreak = new LineBreakNode();
                const fragment = lineBreak.render<DocumentFragment>();
                expect(fragment.childNodes.length).to.equal(2);
                expect(fragment.firstChild.nodeName).to.equal('BR');
                expect(fragment.lastChild.nodeName).to.equal('BR');
            });
            it('should render an ending lineBreak', async () => {
                const lineBreak = new LineBreakNode();
                const fragment = lineBreak.render<DocumentFragment>('html');
                expect(fragment.childNodes.length).to.equal(2);
                expect(fragment.firstChild.nodeName).to.equal('BR');
                expect(fragment.lastChild.nodeName).to.equal('BR');
            });
            it('should render a lineBreak with char after', async () => {
                const p = new VElement('P');
                const lineBreak = new LineBreakNode();
                p.append(lineBreak);
                const c = new CharNode(' ');
                p.append(c);
                const fragment = lineBreak.render<DocumentFragment>('html');
                expect(fragment.childNodes.length).to.equal(1);
                expect(fragment.firstChild.nodeName).to.equal('BR');
            });
        });
        describe('clone', () => {
            it('should duplicate a LineBreakNode', async () => {
                const lineBreak = new LineBreakNode();
                const copy = lineBreak.clone();
                expect(copy).to.not.equal(lineBreak);
                expect(copy instanceof LineBreakNode).to.equal(true);
            });
        });
        describe('locate', () => {
            it('should locate where to set the selection marker at end', async () => {
                const p = new VElement('P');
                const a = new CharNode('a');
                p.append(a);
                const lineBreak = new LineBreakNode();
                p.append(lineBreak);
                const doc = document.createElement('p');
                doc.innerHTML = 'a<br><br>';
                expect(lineBreak.locate(doc.childNodes[1], 0)).to.deep.equal([lineBreak, 'BEFORE']);
                expect(lineBreak.locate(doc.childNodes[2], 0)).to.deep.equal([lineBreak, 'AFTER']);
            });
            it('should locate where to set the selection marker inside string', async () => {
                const p = new VElement('P');
                const a = new CharNode('a');
                p.append(a);
                const lineBreak = new LineBreakNode();
                p.append(lineBreak);
                const b = new CharNode('b');
                p.append(b);
                const doc = document.createElement('p');
                doc.innerHTML = 'a<br>b';
                expect(lineBreak.locate(doc.childNodes[1], 0)).to.deep.equal([lineBreak, 'BEFORE']);
            });
        });
    });
    describe('VDocument', () => {
        describe('insertLineBreak', () => {
            describe('Selection collapsed', () => {
                describe('Basic', () => {
                    it('should insert a <br> into an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                    });
                    it('should insert a <br> at the beggining of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]abc</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[] abc</p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><br>[]abc</p>',
                        });
                    });
                    it('should insert a <br> within text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p>ab<br>[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab []cd</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p>ab&nbsp;<br>[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[] cd</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p>ab<br>[]&nbsp;cd</p>',
                        });
                    });
                    it('should insert a line break (2 <br>) at the end of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p>abc<br>[]<br></p>',
                        });
                    });
                });
                describe('Consecutive', () => {
                    it('should insert two <br> at the beggining of an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                    });
                    it('should insert two <br> at the beggining of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]abc</p>',
                        });
                    });
                    it('should insert two <br> within text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            contentAfter: '<p>ab<br><br>[]cd</p>',
                        });
                    });
                    it('should insert two line breaks (3 <br>) at the end of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: (editor: JWEditor) => {
                                insertLineBreak(editor);
                                insertLineBreak(editor);
                            },
                            // the last <br> is needed to make the first one
                            // visible.
                            contentAfter: '<p>abc<br><br>[]<br></p>',
                        });
                    });
                });
                describe('Format', () => {
                    it('should insert a <br> before a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]<b>def</b></p>',
                            stepFunction: insertLineBreak,
                            // That selection is equivalent to []<b>
                            contentAfter: '<p>abc<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to []<b>
                            contentBefore: '<p>abc<b>[]def</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p>abc<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc <b>[]def</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p>abc&nbsp;<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc<b>[] def </b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p>abc<br><b>[]&nbsp;def</b></p>',
                        });
                    });
                    it('should insert a <br> after a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]def</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>abc</b><br>[]def</p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to </b>[]
                            contentBefore: '<p><b>abc[]</b>def</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>abc</b><br>[]def</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[]</b> def</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p><b>abc</b><br>[]&nbsp;def</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc []</b>def</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p><b>abc&nbsp;</b><br>[]def</p>',
                        });
                    });
                    it('should insert a <br> at the beginning of a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<b>abc</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to []<b>
                            contentBefore: '<p><b>[]abc</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>[] abc</b></p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                    });
                    it('should insert a <br> within a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab[]cd</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>ab</b><br><b>[]cd</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab []cd</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>ab&nbsp;</b><br><b>[]cd</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab[] cd</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>ab</b><br><b>[]&nbsp;cd</b></p>',
                        });
                    });
                    it('should insert a line break (2 <br>) at the end of a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]</p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to </b>[]
                            contentBefore: '<p><b>abc[]</b></p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[] </b></p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                    });
                });
            });
            describe('Selection not collapsed', () => {
                it('should delete the first half of a paragraph, then insert a <br>', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[ab]cd</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]cd</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]ab[cd</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]cd</p>',
                    });
                });
                it('should delete part of a paragraph, then insert a <br>', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[bc]d</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p>a<br>[]d</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a]bc[d</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p>a<br>[]d</p>',
                    });
                });
                it('should delete the last half of a paragraph, then insert a line break (2 <br>)', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[cd]</p>',
                        stepFunction: insertLineBreak,
                        // the second <br> is needed to make the first one
                        // visible.
                        contentAfter: '<p>ab<br>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]cd[</p>',
                        stepFunction: insertLineBreak,
                        // the second <br> is needed to make the first one
                        // visible.
                        contentAfter: '<p>ab<br>[]<br></p>',
                    });
                });
                it('should delete all contents of a paragraph, then insert a line break', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[abcd]</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]abcd[</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]<br></p>',
                    });
                });
            });
        });
    });
});
