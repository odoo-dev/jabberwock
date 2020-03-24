import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { FontawesomeNode } from './FontawesomeNode';
import { DomRenderingEngine } from '../../plugin-dom/src/DomRenderingEngine';

const zeroWidthSpace = '\u200b';

export class FontawesomeDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = FontawesomeNode;

    async render(node: FontawesomeNode): Promise<Node[]> {
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
