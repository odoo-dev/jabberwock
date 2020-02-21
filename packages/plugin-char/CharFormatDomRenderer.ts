import { InlineFormatDomRenderer } from '../plugin-inline/InlineFormatDomRenderer';
import { CharNode } from './CharNode';
import { DomRenderingEngine } from '../plugin-dom/DomRenderingEngine';

export class CharFormatDomRenderer extends InlineFormatDomRenderer {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = CharNode;

    async render(node: CharNode): Promise<Node[]> {
        const previousSibling = node.previousSibling();
        if (previousSibling && node.isSameTextNode(previousSibling)) {
            return this.engine.render(previousSibling);
        }

        const textNode = await this.super.render(node);

        // If the node has attributes, wrap it inside a span with those
        // attributes.
        let rendering: Node[];
        const attributeNames = Object.keys(node.attributes);
        if (attributeNames.length) {
            const span = document.createElement('span');
            this.engine.renderAttributesTo(node.attributes, span);
            textNode.forEach(child => span.appendChild(child));
            rendering = [span];
        } else {
            rendering = textNode;
        }

        return this.renderFormats(node.formats, rendering);
    }
}
