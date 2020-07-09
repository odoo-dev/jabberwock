import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';
import { Modifier } from '../../core/src/Modifier';
import { HtmlDomRenderingEngine } from './HtmlDomRenderingEngine';

export class DefaultHtmlDomModifierRenderer extends ModifierRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;

    /**
     * Default rendering for Format.
     *
     * @param modifier
     * @param contents
     */
    async render(modifier: Modifier, contents: Node[][]): Promise<Node[][]> {
        return contents;
    }
}
