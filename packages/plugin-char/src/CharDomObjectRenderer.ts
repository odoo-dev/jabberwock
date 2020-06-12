import { CharNode } from './CharNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import {
    DomObjectRenderingEngine,
    DomObjectText,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { InlineFormatDomObjectRenderer } from '../../plugin-inline/src/InlineFormatDomObjectRenderer';
import { Predicate } from '../../core/src/VNodes/VNode';

export class CharDomObjectRenderer extends InlineFormatDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = CharNode;

    async renderInline(charNodes: CharNode[]): Promise<DomObjectText[]> {
        // Create textObject.
        const texts = [];
        for (const charNode of charNodes) {
            // Same text node.
            if (charNode.char === ' ' && texts[texts.length - 1] === ' ') {
                // Browsers don't render consecutive space chars otherwise.
                texts.push('\u00A0');
            } else {
                texts.push(charNode.char);
            }
        }
        // Render block edge spaces as non-breakable space (otherwise browsers
        // won't render them).
        const previous = charNodes[0].previousSibling();
        if (!previous || !previous.is(InlineNode)) {
            texts[0] = texts[0].replace(/^ /g, '\u00A0');
        }
        const next = charNodes[charNodes.length - 1].nextSibling();
        if (!next || !next.is(InlineNode)) {
            texts[texts.length - 1] = texts[texts.length - 1].replace(/^ /g, '\u00A0');
        }
        const domObject = { text: texts.join('') };
        this.engine.locate(charNodes, domObject);
        return [domObject];
    }
}
