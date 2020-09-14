import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { History } from '../src/History';
import { describePlugin, click } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Layout } from '../../plugin-layout/src/Layout';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';
import { TagNode } from '../../core/src/VNodes/TagNode';

describePlugin(History, testEditor => {
    describe('undo', () => {
        it('should undo the selection', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abcdef</p>',
                stepFunction: async (editor: JWEditor) => {
                    const engine = editor.plugins.get(Layout).engines.dom;
                    const p = engine.components.editable[0].firstChild();

                    await editor.execCommand(() => {
                        editor.selection.select(
                            p.children()[2],
                            RelativePosition.BEFORE,
                            p.children()[3],
                            RelativePosition.AFTER,
                        );
                    });

                    const editable = document.querySelector('[contenteditable=true]');
                    const text = editable.querySelector('p').firstChild;

                    const domSelection = editable.ownerDocument.getSelection();
                    expect({
                        anchorNode: domSelection.anchorNode,
                        anchorOffset: domSelection.anchorOffset,
                        focusNode: domSelection.focusNode,
                        focusOffset: domSelection.focusOffset,
                    }).to.deep.equal({
                        anchorNode: text,
                        anchorOffset: 2,
                        focusNode: text,
                        focusOffset: 4,
                    });

                    const undoButton = document.querySelector('jw-button[name="undo"]');
                    await click(undoButton);
                },
                contentAfter: '<p>abcdef</p>',
            });
        });
        it('should undo inserted char', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abc[]def</p>',
                stepFunction: async (editor: JWEditor) => {
                    await editor.execCommand(() => {
                        editor.selection.range.start.before(new CharNode({ char: 'Z' }));
                    });

                    const editable = document.querySelector('[contenteditable=true]');
                    expect(editable.innerHTML).to.deep.equal('<p>abcZdef</p>');

                    const undoButton = document.querySelector('jw-button[name="undo"]');
                    await click(undoButton);
                },
                contentAfter: '<p>abc[]def</p>',
            });
        });
        it('should undo inserted chars and linebreak', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abc[]def</p>',
                stepFunction: async (editor: JWEditor) => {
                    await editor.execCommand(() => {
                        editor.selection.range.start.before(new CharNode({ char: 'X' }));
                    });
                    await editor.execCommand(() => {
                        editor.selection.range.start.before(new LineBreakNode());
                    });
                    await editor.execCommand(() => {
                        editor.selection.range.start.before(new CharNode({ char: 'Z' }));
                    });

                    const editable = document.querySelector('[contenteditable=true]');
                    expect(editable.innerHTML).to.deep.equal('<p>abcX<br>Zdef</p>');

                    const undoButton = document.querySelector('jw-button[name="undo"]');
                    await click(undoButton);
                    await click(undoButton);
                },
                contentAfter: '<p>abcX[]def</p>',
            });
        });
        it('should undo removed container and children', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abc[]</p><section><article>X</article></section><p>def</p>',
                stepFunction: async (editor: JWEditor) => {
                    await editor.execCommand(() => {
                        const x = editor.selection.anchor.previousLeaf();
                        editor.selection.setAt(x);
                    });
                    await editor.execCommand(() => {
                        editor.selection.anchor.parent.nextSibling().remove();
                    });

                    const editable = document.querySelector('[contenteditable=true]');
                    expect(editable.innerHTML).to.deep.equal('<p>abc</p><p>def</p>');

                    const undoButton = document.querySelector('jw-button[name="undo"]');
                    await click(undoButton);
                },
                contentAfter: '<p>ab[]c</p><section><article>X</article></section><p>def</p>',
            });
        });
        it('should undo removed container and children (few commands)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abc[]</p><p>def</p>',
                stepFunction: async (editor: JWEditor) => {
                    await editor.execCommand(() => {
                        const p = editor.selection.anchor.parent;
                        const section = new TagNode({ htmlTag: 'section' });
                        p.after(section);
                        const article = new TagNode({ htmlTag: 'article' });
                        section.append(article);
                        article.append(new CharNode({ char: 'X' }));
                    });

                    const editable = document.querySelector('[contenteditable=true]');
                    expect(editable.innerHTML).to.deep.equal(
                        '<p>abc</p><section><article>X</article></section><p>def</p>',
                    );

                    await editor.execCommand(() => {
                        const x = editor.selection.anchor.previousLeaf();
                        editor.selection.setAt(x);
                    });
                    await editor.execCommand(() => {
                        editor.selection.anchor.parent.nextSibling().remove();
                    });

                    expect(editable.innerHTML).to.deep.equal('<p>abc</p><p>def</p>');

                    const undoButton = document.querySelector('jw-button[name="undo"]');
                    await click(undoButton);
                },
                contentAfter: '<p>ab[]c</p><section><article>X</article></section><p>def</p>',
            });
        });
    });
    describe('redo', () => {
        it('should redo the selection', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abcdef</p>',
                stepFunction: async (editor: JWEditor) => {
                    const engine = editor.plugins.get(Layout).engines.dom;
                    const p = engine.components.editable[0].firstChild();

                    await editor.execCommand(() => {
                        editor.selection.select(
                            p.children()[2],
                            RelativePosition.BEFORE,
                            p.children()[3],
                            RelativePosition.AFTER,
                        );
                    });

                    const undoButton = document.querySelector('jw-button[name="undo"]');
                    await click(undoButton);

                    const redoButton = document.querySelector('jw-button[name="redo"]');
                    await click(redoButton);
                },
                contentAfter: '<p>ab[cd]ef</p>',
            });
        });
        it('should redo inserted char', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abc[]def</p>',
                stepFunction: async (editor: JWEditor) => {
                    await editor.execCommand(() => {
                        editor.selection.range.start.before(new CharNode({ char: 'Z' }));
                    });

                    const undoButton = document.querySelector('jw-button[name="undo"]');
                    await click(undoButton);

                    const redoButton = document.querySelector('jw-button[name="redo"]');
                    await click(redoButton);
                },
                contentAfter: '<p>abcZ[]def</p>',
            });
        });
        it('should redo inserted chars', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>abc[]def</p>',
                stepFunction: async (editor: JWEditor) => {
                    await editor.execCommand(() => {
                        editor.selection.range.start.before(new CharNode({ char: 'X' }));
                    });
                    await editor.execCommand(() => {
                        editor.selection.range.start.before(new LineBreakNode());
                    });
                    await editor.execCommand(() => {
                        editor.selection.range.start.before(new CharNode({ char: 'Z' }));
                    });

                    const undoButton = document.querySelector('jw-button[name="undo"]');
                    await click(undoButton);
                    await click(undoButton);

                    const redoButton = document.querySelector('jw-button[name="redo"]');
                    await click(redoButton);
                    await click(redoButton);
                },
                contentAfter: '<p>abcX<br>Z[]def</p>',
            });
        });
    });
});
