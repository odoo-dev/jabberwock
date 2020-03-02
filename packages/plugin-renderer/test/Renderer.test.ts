import { expect } from 'chai';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';
import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { Renderer } from '../src/Renderer';
import { AbstractRenderer } from '../src/AbstractRenderer';
import { RenderingEngine } from '../src/RenderingEngine';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { Dom } from '../../plugin-dom/src/Dom';

describe('Renderer', () => {
    describe('render', () => {
        it('should return a rendering or void', async () => {
            class VNodeRenderer extends AbstractRenderer<VNode> {
                async render(node: VNode): Promise<VNode> {
                    return node;
                }
            }
            class VNodeRenderingEngine extends RenderingEngine<VNode> {
                static id = 'VNode';
                static defaultRenderer = VNodeRenderer;
            }
            class VNodePlugin<T extends JWPluginConfig> extends JWPlugin<T> {
                loadables: Loadables<Renderer> = {
                    renderingEngines: [VNodeRenderingEngine],
                };
            }
            const editor = new JWEditor();
            editor.load(Dom, { target: document.createElement('p') });
            editor.load(VNodePlugin);
            editor.load(Renderer);
            await editor.start();
            const node = new VNode();
            editor.vDocument.root.append(node);
            const renderer = editor.plugins.get(Renderer);
            const rendering = await renderer.render<VNode>('VNode', editor.vDocument.root);
            if (expect(rendering).to.exist) {
                expect(rendering).to.equal(editor.vDocument.root);
            }
            const voidRendering = await renderer.render<VNode>('vNode', editor.vDocument.root);
            expect(voidRendering).to.not.exist;
        });
        it('should render textual selection at the beginning', async () => {
            const content = `<p>[a]bc</p>`;
            await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
        });
        it('should render textual selection at the end', async () => {
            const content = `<p>ab[c]</p>`;
            await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
        });
        it('should render textual selection in the whole tag', async () => {
            const content = `<p>[abc]</p>`;
            await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
        });
        it('should render textual selection that is collapsed in the beginning', async () => {
            const content = `<p>[]abc</p>`;
            await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
        });
        it('should render textual selection that is collapsed in the end', async () => {
            const content = `<p>abc[]</p>`;
            await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
        });
        it('should render textual selection that is collapsed in the middle', async () => {
            const content = `<p>ab[]c</p>`;
            await testEditor(BasicEditor, { contentBefore: content, contentAfter: content });
        });
        it('should render the selection outside the tag', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>[<b>a</b>]</p>',
                contentAfter: '<p><b>[a]</b></p>',
            });
        });
    });
});
