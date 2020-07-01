import { AbstractModifierRenderer } from '../../plugin-renderer/src/AbstractModifierRenderer';
import { Modifier } from '../../core/src/Modifier';
import { HtmlDomRenderingEngine } from './HtmlDomRenderingEngine';

export class DefaultHtmlDomModifierRenderer extends AbstractModifierRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;

    /**
     * Default rendering for Format.
     *
     * @param modifier
     * @param contents
     */
    async render(modifier: Modifier, contents: Node[][]): Promise<Node[]> {
        const flatten: Node[] = [];
        for (const nodes of contents) {
            flatten.push(...nodes);
        }
        return flatten;
    }
}
