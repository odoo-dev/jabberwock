import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { PreNode } from './PreNode';
import { nodeName } from '../../utils/src/utils';

export class PreHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;
    predicate = PreNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: PreNode): Promise<Node[]> {
        const pre = document.createElement('pre');
        this.engine.renderAttributes(node.attributes, pre);
        for (const child of node.children()) {
            const domChildren = await this.renderChild(child);
            // TODO: prevent CharNode from rendering spaces as nbsp.
            pre.append(...this._brToNewline(domChildren));
        }
        return [pre];
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Replace every <br> in a list of DOM Nodes with newlines.
     *
     * @param domNodes
     */
    _brToNewline(domNodes: Node[]): Node[] {
        if (domNodes.length > 1) {
            // Remove the last <br> if it's a placeholder (a trailing BR after
            // another <br>, added just to make the first one visible).
            const last = domNodes[domNodes.length - 1];
            const penultimate = domNodes[domNodes.length - 2];
            if (nodeName(last) === 'BR' && nodeName(penultimate) === 'BR') {
                domNodes.pop();
            }
        }
        let domNodeIndex = 0;
        for (const domNode of domNodes) {
            if (nodeName(domNode) === 'BR') {
                // Replace every <br> with a newline.
                domNodes.splice(domNodeIndex, 1, document.createTextNode('\n'));
            }
            domNodeIndex += 1;
        }
        return domNodes;
    }
}
