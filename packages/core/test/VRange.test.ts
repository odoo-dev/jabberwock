import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Layout } from '../../plugin-layout/src/Layout';
import JWEditor from '../src/JWEditor';
import { expect } from 'chai';
import { VElement } from '../src/VNodes/VElement';
import { VRange } from '../src/VRange';
import { RelativePosition } from '../src/VNodes/VNode';
import { MarkerNode } from '../src/VNodes/MarkerNode';
import { CharNode } from '../../plugin-char/src/CharNode';

describe('VRange', () => {
    describe('split', () => {
        it('should split the range containers in place', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<v>abc<w>de[f<x>ghi<y>jkl<z>mno</z>pqr</y>stu</x>vw</w>xy]z</v>',
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
    describe('isCollapsed', () => {
        let editor: JWEditor;
        let p: VElement;
        beforeEach(async () => {
            editor = new JWEditor();
            await editor.start();
            const div = new VElement({ htmlTag: 'DIV' });
            div.editable = true;
            p = new VElement({ htmlTag: 'P' });
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
