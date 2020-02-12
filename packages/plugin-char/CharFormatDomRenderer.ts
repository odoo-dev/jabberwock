import { InlineFormatDomRenderer } from '../plugin-inline/InlineFormatDomRenderer';
import { CharNode } from './CharNode';

export class CharFormatDomRenderer extends InlineFormatDomRenderer {
    static id = 'dom';
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
            for (const name of attributeNames) {
                const value = node.attributes[name];
                if (typeof value === 'string') {
                    span.setAttribute(name, value);
                }
            }
            textNode.forEach(child => span.appendChild(child));
            rendering = [span];
        } else {
            rendering = textNode;
        }

        return this.renderFormats(node.formats, rendering);
    }
}
