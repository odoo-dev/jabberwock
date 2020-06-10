import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { Char } from '../src/Char';
import { CharNode } from '../src/CharNode';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { DomObject } from '../../plugin-html/src/DomObjectRenderingEngine';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { VNode } from '../../core/src/VNodes/VNode';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';

describe('CharDomObjectRenderer', () => {
    describe('render', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(DomLayout);
            editor.load(Char);
            await editor.start();
        });
        afterEach(async () => {
            await editor.stop();
        });
        describe('spaces', () => {
            it('should insert 1 space and 1 nbsp instead of 2 spaces', async () => {
                const root = new ContainerNode();
                const char = new CharNode({ char: 'a' });
                root.append(char);
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: 'b' }));

                const renderer = editor.plugins.get(Renderer);
                const rendered = await renderer.render<DomObject>('dom/object', char);
                expect(rendered).to.deep.equal({ text: 'a \u00A0b' });

                const locations = renderer.engines['dom/object'].locations as Map<
                    DomObject,
                    VNode[]
                >;
                expect(rendered && locations.get(rendered)).to.deep.equal(root.childVNodes);
            });
            it('should insert 2 spaces and 2 nbsp instead of 4 spaces', async () => {
                const root = new ContainerNode();
                const char = new CharNode({ char: 'a' });
                root.append(char);
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: ' ' }));
                root.append(new CharNode({ char: 'b' }));

                const renderer = editor.plugins.get(Renderer);
                const rendered = await renderer.render<DomObject>('dom/object', char);
                expect(rendered).to.deep.equal({ text: 'a \u00A0 \u00A0b' });

                const locations = renderer.engines['dom/object'].locations as Map<
                    DomObject,
                    VNode[]
                >;
                expect(rendered && locations.get(rendered)).to.deep.equal(root.children());
            });
        });
        describe('format and attributes', () => {
            it('should keep formats in order', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><i>g[]g</i></b>',
                    contentAfter: '<b><i>g[]g</i></b>',
                });
            });
            it('should keep formats and attributes in order', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><span a="b">g[]g</span></b>',
                    contentAfter: '<b><span a="b">g[]g</span></b>',
                });
            });
            it('should keep nested formats in order', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><i>g[g</i>o]o</b>',
                    contentAfter: '<b><i>g[g</i>o]o</b>',
                });
            });
            it('should keep nested formats and attributes in order', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><span a="b">g[g</span>o]o</b>',
                    contentAfter: '<b><span a="b">g[g</span>o]o</b>',
                });
            });
            it('should nest identical formats', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><i>g[g</i></b><b><i>o]o</i></b>',
                    contentAfter: '<b><i>g[go]o</i></b>',
                });
            });
            it('should nest identical formats and attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><span a="b">g[g</span></b><b><span a="b">o]o</span></b>',
                    contentAfter: '<b><span a="b">g[go]o</span></b>',
                });
            });
            it('should nest ordered formats', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><i>g[g</i></b><b>o]o</b>',
                    contentAfter: '<b><i>g[g</i>o]o</b>',
                });
            });
            it('should nest ordered formats and attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><span a="b">g[g</span></b><b>o]o</b>',
                    contentAfter: '<b><span a="b">g[g</span>o]o</b>',
                });
            });
            it('should not nest unordered formats', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><i>g[g</i></b><i><b>o]o</b></i>',
                    contentAfter: '<b><i>g[g</i></b><i><b>o]o</b></i>',
                });
            });
            it('should not nest formats with different attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b>g[g</b><b a="b">o]o</b>',
                    contentAfter: '<b>g[g</b><b a="b">o]o</b>',
                });
            });
            it('should not nest unordered formats and attributes', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<b><span a="b">g[g</span></b><span a="b"><b>o]o</b></span>',
                    contentAfter: '<b><span a="b">g[g</span></b><span a="b"><b>o]o</b></span>',
                });
            });
        });
    });
});
