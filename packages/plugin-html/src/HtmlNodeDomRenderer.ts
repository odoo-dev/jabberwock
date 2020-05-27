import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from './HtmlDomRenderingEngine';
import { HtmlNode } from './HtmlNode';

export class HtmlHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;
    predicate = HtmlNode;

    constructor(engine, superRenderer) {
        super(engine, superRenderer);
    }

    async render(node: HtmlNode): Promise<Node[]> {
        return [node.domNode];
    }
}
