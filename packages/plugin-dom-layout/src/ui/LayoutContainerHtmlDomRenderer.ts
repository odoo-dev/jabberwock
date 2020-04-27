import { HtmlDomRenderingEngine } from '../../../plugin-html/src/HtmlDomRenderingEngine';
import { AbstractRenderer } from '../../../plugin-renderer/src/AbstractRenderer';
import { LayoutContainer } from './LayoutContainerNode';

export class LayoutContainerHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;
    predicate = LayoutContainer;

    async render(node: LayoutContainer): Promise<Node[]> {
        if (node.hasChildren()) {
            const renderedChildren = await this.renderChildren(node);
            return renderedChildren.flat();
        }
        return [];
    }
}
