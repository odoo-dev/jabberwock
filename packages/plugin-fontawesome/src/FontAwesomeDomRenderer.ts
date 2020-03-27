import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { FontAwesomeNode } from './FontAwesomeNode';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

const zeroWidthSpace = '\u200b';

export class FontAwesomeDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = FontAwesomeNode;

    async render(node: FontAwesomeNode): Promise<Node[]> {
        const fontawesome = document.createElement(node.htmlTag);
        this.engine.renderAttributes(node.attributes, fontawesome);
        // Surround the fontawesome with two invisible characters so the
        // selection can navigate around it.
        return [
            document.createTextNode(zeroWidthSpace),
            fontawesome,
            document.createTextNode(zeroWidthSpace),
        ];
    }
}
