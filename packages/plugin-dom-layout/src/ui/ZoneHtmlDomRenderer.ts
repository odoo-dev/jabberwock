import { HtmlDomRenderingEngine } from '../../../plugin-html/src/HtmlDomRenderingEngine';
import { AbstractRenderer } from '../../../plugin-renderer/src/AbstractRenderer';
import { ZoneNode } from '../../../plugin-layout/src/ZoneNode';

export class ZoneHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = ZoneNode;

    async render(node: ZoneNode): Promise<Node[]> {
        const renderedChildren: Node[] = [];
        if (node.hasChildren()) {
            for (const child of node.childVNodes) {
                if (!node.hidden.get(child)) {
                    renderedChildren.push(...(await this.engine.render(child)));
                }
            }
        }
        return renderedChildren;
    }
}
