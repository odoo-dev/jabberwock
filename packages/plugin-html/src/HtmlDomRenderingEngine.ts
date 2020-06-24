import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultHtmlDomRenderer } from './DefaultHtmlDomRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { DomObjectRenderingEngine } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class HtmlDomRenderingEngine extends RenderingEngine<Node[]> {
    static id = 'dom/html';
    static readonly defaultRenderer = DefaultHtmlDomRenderer;

    /**
     * Render the given node.
     *
     * @param node
     */
    async render(node: VNode): Promise<Node[]>;
    async render(nodes: VNode[]): Promise<Node[][]>;
    async render(nodes: VNode | VNode[]): Promise<Node[][] | Node[]> {
        const renderer = this.editor.plugins.get(Renderer);
        const objectEngine = renderer.engines['dom/object'] as DomObjectRenderingEngine;
        objectEngine.renderings.clear();
        objectEngine.locations.clear();
        if (nodes instanceof Array) {
            return super.render(nodes);
        } else {
            return super.render([nodes])[0];
        }
    }
}
