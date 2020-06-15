import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultHtmlDomRenderer } from './DefaultHtmlDomRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { DomObjectRenderingEngine } from './DomObjectRenderingEngine';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';

export class HtmlDomRenderingEngine extends RenderingEngine<Node[]> {
    static id = 'dom/html';
    static readonly defaultRenderer = DefaultHtmlDomRenderer;
    /**
     * Render the given node.
     *
     * @param node
     */
    async render(node: VNode): Promise<Node[]> {
        const nodes = await super.render(node);
        if (!this.editor.mode.definition.checkEditable || node.is(AtomicNode)) {
            return nodes;
        }
        const isEditable = this.editor.mode.isNodeEditable(node);
        return nodes.map(node => {
            if (node instanceof HTMLElement && isEditable === false) {
                node.setAttribute('contenteditable', 'false');
            } else if (node instanceof HTMLElement && isEditable === true) {
                node.setAttribute('contenteditable', 'true');
            }
            return node;
        });
    }
}
