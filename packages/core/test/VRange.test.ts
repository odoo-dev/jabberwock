import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Layout } from '../../plugin-layout/src/Layout';
import JWEditor from '../src/JWEditor';
import { expect } from 'chai';
import { TagNode } from '../src/VNodes/TagNode';
import { VRange } from '../src/VRange';
import { RelativePosition } from '../src/VNodes/VNode';
import { MarkerNode } from '../src/VNodes/MarkerNode';
import { CharNode } from '../../plugin-char/src/CharNode';

describe('VRange', () => {
    describe('collapsed', () => {
        describe('selectedNodes', () => {
            it('should return an empty array', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.selectedNodes()).to.deep.equal([]);
                    },
                });
            });
        });
        describe('traversedNodes', () => {
            it('should return an empty array', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.traversedNodes()).to.deep.equal([]);
                    },
                });
            });
        });
        describe('targetedNodes', () => {
            it("should return the range's container in an array", async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.targetedNodes()).to.deep.equal([
                            editor.selection.range.startContainer,
                        ]);
                    },
                });
            });
            it('should return an empty array, based on a Predicate', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: async (editor: BasicEditor) => {
                        expect(editor.selection.range.targetedNodes(CharNode)).to.deep.equal([]);
                    },
                });
            });
        });
    });
    // When adding a test, make sure to also add with a backward selection in
    // `describe('backward')` below.
    describe('forward', () => {
        describe('split', () => {
            it('should split the range containers in place', async function() {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<v>abc<w>de[f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy]z</v>',
                    stepFunction: async (editor: BasicEditor) => {
                        editor.dispatcher.registerCommand('refresh', { handler: () => {} });
                        await editor.execCommand(async () => {
                            const nodes = editor.selection.range.split();
                            const domEngine = editor.plugins.get(Layout).engines.dom;
                            const editable = domEngine.components.editable[0];
                            editable.lastChild().after(nodes[0]);
                        });
                        await editor.execCommand('refresh');
                    },
                    contentAfter:
                        '<v>abc<w>de</w></v><v>z</v><v><w>[f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy]</v>',
                });
            });
        });
        describe('selectedNodes', () => {
            it('should return char nodes and their container', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        expect(editor.selection.range.selectedNodes()).to.deep.equal([
                            ...children,
                            p,
                        ]);
                    },
                });
            });
            it('should return char nodes and their containers (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>def]</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const pChildren = p.children();
                        const h1 = editor.selection.range.endContainer;
                        expect(h1 instanceof TagNode).to.be.true;
                        expect((h1 as TagNode).htmlTag).to.equal('H1');
                        const h1Children = h1.children();
                        expect(editor.selection.range.selectedNodes()).to.deep.equal([
                            ...pChildren,
                            ...h1Children,
                            p,
                            h1,
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.selectedNodes(CharNode)).to.deep.equal(
                            children,
                        );
                    },
                });
            });
            it('should return char nodes only, based on a Predicate (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>def]</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const pChildren = p.children();
                        expect(pChildren.every(child => child instanceof CharNode)).to.be.true;
                        const h1 = editor.selection.range.endContainer;
                        const h1Children = h1.children();
                        expect(h1Children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.selectedNodes(CharNode)).to.deep.equal([
                            ...pChildren,
                            ...h1Children,
                        ]);
                    },
                });
            });
            it('should return char nodes and their container, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>]def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        expect(editor.selection.range.selectedNodes()).to.deep.equal([
                            ...children,
                            p,
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>]def</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.selectedNodes(CharNode)).to.deep.equal(
                            children,
                        );
                    },
                });
            });
        });
        describe('traversedNodes', () => {
            it('should return char nodes', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p><h1>def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        expect(editor.selection.range.traversedNodes()).to.deep.equal(children);
                    },
                });
            });
            it('should return char nodes and the second container (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>def]</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const pChildren = p.children();
                        const h1 = editor.selection.range.endContainer;
                        expect(h1 instanceof TagNode).to.be.true;
                        expect((h1 as TagNode).htmlTag).to.equal('H1');
                        const h1Children = h1.children();
                        expect(editor.selection.range.traversedNodes()).to.deep.equal([
                            ...pChildren,
                            h1,
                            ...h1Children,
                        ]);
                    },
                });
            });
            it('should return a single char node only, based on a Predicate', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(
                            editor.selection.range.traversedNodes(
                                node => node instanceof CharNode && node.char === 'b',
                            ),
                        ).to.deep.equal([children[1]]);
                    },
                });
            });
            it('should return two char nodes only, based on a Predicate (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>def]</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const pLastChild = p.lastChild();
                        expect(pLastChild instanceof CharNode).to.be.true;
                        const h1 = editor.selection.range.endContainer;
                        const h1LastChild = h1.lastChild();
                        expect(h1LastChild instanceof CharNode).to.be.true;
                        expect(
                            editor.selection.range.traversedNodes(
                                node => node instanceof CharNode && !node.nextSibling(),
                            ),
                        ).to.deep.equal([p.lastChild(), h1.lastChild()]);
                    },
                });
            });
            it('should return char nodes and the next container, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>]def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        const h1 = editor.selection.range.endContainer;
                        expect(h1 instanceof TagNode).to.be.true;
                        expect((h1 as TagNode).htmlTag).to.equal('H1');
                        expect(editor.selection.range.traversedNodes()).to.deep.equal([
                            ...children,
                            h1,
                        ]);
                    },
                });
            });
            it('should return a single char node only, based on a Predicate, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>]def</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(
                            editor.selection.range.traversedNodes(
                                node => node instanceof CharNode && node.char === 'b',
                            ),
                        ).to.deep.equal([children[1]]);
                    },
                });
            });
        });
        describe('targetedNodes', () => {
            it('should return char nodes and the start container', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p><h1>def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.targetedNodes()).to.deep.equal([
                            editor.selection.range.startContainer,
                            ...editor.selection.range.startContainer.children(),
                        ]);
                    },
                });
            });
            it('should return char nodes and both containers (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>def]</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.targetedNodes()).to.deep.equal([
                            editor.selection.range.startContainer,
                            ...editor.selection.range.traversedNodes(),
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc]</p>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.targetedNodes(CharNode)).to.deep.equal([
                            ...children,
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>def]</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const pChildren = p.children();
                        expect(pChildren.every(child => child instanceof CharNode)).to.be.true;
                        const h1 = editor.selection.range.endContainer;
                        const h1Children = h1.children();
                        expect(h1Children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.targetedNodes(CharNode)).to.deep.equal([
                            ...p.children(),
                            ...h1.children(),
                        ]);
                    },
                });
            });
            it('should return char nodes and the start container, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>]def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        expect(editor.selection.range.targetedNodes()).to.deep.equal([
                            p,
                            ...children,
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[abc</p><h1>]def</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.targetedNodes(CharNode)).to.deep.equal(
                            children,
                        );
                    },
                });
            });
        });
    });
    describe('backward', () => {
        describe('split', () => {
            it('should split the range containers in place', async function() {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<v>abc<w>de]f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy[z</v>',
                    stepFunction: async (editor: BasicEditor) => {
                        editor.dispatcher.registerCommand('refresh', { handler: () => {} });
                        await editor.execCommand(async () => {
                            const nodes = editor.selection.range.split();
                            const domEngine = editor.plugins.get(Layout).engines.dom;
                            const editable = domEngine.components.editable[0];
                            editable.lastChild().after(nodes[0]);
                        });
                        await editor.execCommand('refresh');
                    },
                    contentAfter:
                        '<v>abc<w>de</w></v><v>z</v><v><w>]f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy[</v>',
                });
            });
        });
        describe('selectedNodes', () => {
            it('should return an empty array (collapsed)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.selectedNodes()).to.deep.equal([]);
                    },
                });
            });
            it('should return char nodes and their container', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc[</p>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        expect(editor.selection.range.selectedNodes()).to.deep.equal([
                            ...children,
                            p,
                        ]);
                    },
                });
            });
            it('should return char nodes and their containers (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>def[</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const pChildren = p.children();
                        const h1 = editor.selection.range.endContainer;
                        expect(h1 instanceof TagNode).to.be.true;
                        expect((h1 as TagNode).htmlTag).to.equal('H1');
                        const h1Children = h1.children();
                        expect(editor.selection.range.selectedNodes()).to.deep.equal([
                            ...pChildren,
                            ...h1Children,
                            p,
                            h1,
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc[</p>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.selectedNodes(CharNode)).to.deep.equal(
                            children,
                        );
                    },
                });
            });
            it('should return char nodes only, based on a Predicate (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>def[</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const pChildren = p.children();
                        expect(pChildren.every(child => child instanceof CharNode)).to.be.true;
                        const h1 = editor.selection.range.endContainer;
                        const h1Children = h1.children();
                        expect(h1Children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.selectedNodes(CharNode)).to.deep.equal([
                            ...pChildren,
                            ...h1Children,
                        ]);
                    },
                });
            });
            it('should return char nodes and their container, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>[def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        expect(editor.selection.range.selectedNodes()).to.deep.equal([
                            ...children,
                            p,
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>[def</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.selectedNodes(CharNode)).to.deep.equal(
                            children,
                        );
                    },
                });
            });
        });
        describe('traversedNodes', () => {
            it('should return an empty array (collapsed)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.traversedNodes()).to.deep.equal([]);
                    },
                });
            });
            it('should return char nodes', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc[</p><h1>def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        expect(editor.selection.range.traversedNodes()).to.deep.equal(children);
                    },
                });
            });
            it('should return char nodes and the second container (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>def[</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const pChildren = p.children();
                        const h1 = editor.selection.range.endContainer;
                        expect(h1 instanceof TagNode).to.be.true;
                        expect((h1 as TagNode).htmlTag).to.equal('H1');
                        const h1Children = h1.children();
                        expect(editor.selection.range.traversedNodes()).to.deep.equal([
                            ...pChildren,
                            h1,
                            ...h1Children,
                        ]);
                    },
                });
            });
            it('should return a single char node only, based on a Predicate', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc[</p>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(
                            editor.selection.range.traversedNodes(
                                node => node instanceof CharNode && node.char === 'b',
                            ),
                        ).to.deep.equal([children[1]]);
                    },
                });
            });
            it('should return two char nodes only, based on a Predicate (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>def[</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const pLastChild = p.lastChild();
                        expect(pLastChild instanceof CharNode).to.be.true;
                        const h1 = editor.selection.range.endContainer;
                        const h1LastChild = h1.lastChild();
                        expect(h1LastChild instanceof CharNode).to.be.true;
                        expect(
                            editor.selection.range.traversedNodes(
                                node => node instanceof CharNode && !node.nextSibling(),
                            ),
                        ).to.deep.equal([p.lastChild(), h1.lastChild()]);
                    },
                });
            });
            it('should return char nodes and the next container, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>[def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        const h1 = editor.selection.range.endContainer;
                        expect(h1 instanceof TagNode).to.be.true;
                        expect((h1 as TagNode).htmlTag).to.equal('H1');
                        expect(editor.selection.range.traversedNodes()).to.deep.equal([
                            ...children,
                            h1,
                        ]);
                    },
                });
            });
            it('should return a single char node only, based on a Predicate, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>[def</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(
                            editor.selection.range.traversedNodes(
                                node => node instanceof CharNode && node.char === 'b',
                            ),
                        ).to.deep.equal([children[1]]);
                    },
                });
            });
        });
        describe('targetedNodes', () => {
            it("should return the range's container in an array (collapsed)", async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.targetedNodes()).to.deep.equal([
                            editor.selection.range.startContainer,
                        ]);
                    },
                });
            });
            it('should return char nodes and the start container', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc[</p><h1>def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.targetedNodes()).to.deep.equal([
                            editor.selection.range.startContainer,
                            ...editor.selection.range.startContainer.children(),
                        ]);
                    },
                });
            });
            it('should return char nodes and both containers (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>def[</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        expect(editor.selection.range.targetedNodes()).to.deep.equal([
                            editor.selection.range.startContainer,
                            ...editor.selection.range.traversedNodes(),
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc[</p>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.targetedNodes(CharNode)).to.deep.equal([
                            ...children,
                        ]);
                    },
                });
            });
            it('should return an empty array, based on a Predicate (collapsed)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>ab[]cd</p>',
                    stepFunction: async (editor: BasicEditor) => {
                        expect(editor.selection.range.targetedNodes(CharNode)).to.deep.equal([]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate (cross-blocks)', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>def[</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const pChildren = p.children();
                        expect(pChildren.every(child => child instanceof CharNode)).to.be.true;
                        const h1 = editor.selection.range.endContainer;
                        const h1Children = h1.children();
                        expect(h1Children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.targetedNodes(CharNode)).to.deep.equal([
                            ...p.children(),
                            ...h1.children(),
                        ]);
                    },
                });
            });
            it('should return char nodes and the start container, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>[def</h1>',
                    stepFunction: async (editor: JWEditor) => {
                        const p = editor.selection.range.startContainer;
                        expect(p instanceof TagNode).to.be.true;
                        expect((p as TagNode).htmlTag).to.equal('P');
                        const children = p.children();
                        expect(editor.selection.range.targetedNodes()).to.deep.equal([
                            p,
                            ...children,
                        ]);
                    },
                });
            });
            it('should return char nodes only, based on a Predicate, after a triple click', async function() {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>]abc</p><h1>[def</h1>',
                    stepFunction: async (editor: BasicEditor) => {
                        const p = editor.selection.range.startContainer;
                        const children = p.children();
                        expect(children.every(child => child instanceof CharNode)).to.be.true;
                        expect(editor.selection.range.targetedNodes(CharNode)).to.deep.equal(
                            children,
                        );
                    },
                });
            });
        });
    });
    describe('isCollapsed', () => {
        let editor: JWEditor;
        let p: TagNode;
        beforeEach(async () => {
            editor = new JWEditor();
            await editor.start();
            const div = new TagNode({ htmlTag: 'DIV' });
            div.editable = true;
            p = new TagNode({ htmlTag: 'P' });
            div.append(p);
            const a = new CharNode({ char: 'A' });
            p.append(a);
            const marker1 = new MarkerNode();
            p.append(marker1);
            const b = new CharNode({ char: 'B' });
            p.append(b);
            const marker2 = new MarkerNode();
            p.append(marker2);
            const c = new CharNode({ char: 'C' });
            p.append(c);
        });
        afterEach(() => {
            editor.stop();
        });
        it('sould be colapsed when contains nothing', async function() {
            const range = new VRange(editor, [
                [p.childVNodes[0], RelativePosition.AFTER],
                [p.childVNodes[0], RelativePosition.AFTER],
            ]);
            expect(range.isCollapsed()).to.equal(true);
        });
        it('sould be colapsed when contains untangible nodes', async function() {
            const range = new VRange(editor, [
                [p.childVNodes[1], RelativePosition.BEFORE],
                [p.childVNodes[1], RelativePosition.AFTER],
            ]);
            expect(range.isCollapsed()).to.equal(true);
        });
        it('sould be not colapsed when contains element', async function() {
            const range = new VRange(editor, [
                [p.childVNodes[0], RelativePosition.BEFORE],
                [p.childVNodes[0], RelativePosition.AFTER],
            ]);
            expect(range.isCollapsed()).to.equal(false);
        });
        it('sould be not colapsed when contains element and marker', async function() {
            const range = new VRange(editor, [
                [p.childVNodes[0], RelativePosition.BEFORE],
                [p.childVNodes[1], RelativePosition.AFTER],
            ]);
            expect(range.isCollapsed()).to.equal(false);
        });
        it('sould be not colapsed when contains element and marker (2)', async function() {
            const range = new VRange(editor, [
                [p.childVNodes[1], RelativePosition.BEFORE],
                [p.childVNodes[2], RelativePosition.AFTER],
            ]);
            expect(range.isCollapsed()).to.equal(false);
        });
        it('sould be not colapsed when contains elements', async function() {
            const range = new VRange(editor, [
                [p.childVNodes[0], RelativePosition.BEFORE],
                [p.childVNodes[4], RelativePosition.AFTER],
            ]);
            expect(range.isCollapsed()).to.equal(false);
        });
    });
});
