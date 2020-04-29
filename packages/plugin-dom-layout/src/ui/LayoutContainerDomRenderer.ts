import { DomRenderingEngine } from '../../../plugin-dom/src/DomRenderingEngine';
import { AbstractRenderer } from '../../../plugin-renderer/src/AbstractRenderer';
import { LayoutContainer } from './LayoutContainerNode';

export class LayoutContainerDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = LayoutContainer;

    async render(node: LayoutContainer): Promise<Node[]> {
        if (node.hasChildren()) {
            const renderedChildren = await this.renderChildren(node);
            return renderedChildren.flat();
        }
        return [];
    }
}
