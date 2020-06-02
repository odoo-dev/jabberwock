import { PreNode } from './PreNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';

export class PreSeparatorHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = HtmlDomRenderingEngine.id;
    engine: HtmlDomRenderingEngine;

    predicate = (item: VNode): boolean => {
        const DefaultSeparator = this.engine.editor.configuration.defaults.Separator;
        return item.is(DefaultSeparator) && !!item.ancestor(PreNode);
    };

    /**
     * Render the VNode.
     */
    async render(node: VNode): Promise<Node[]> {
        const separators = await this.super.render(node);
        const rendering = separators.map(() => document.createTextNode('\n'));
        return this.engine.rendered([node], [this, Promise.resolve(rendering)]);
    }
}
