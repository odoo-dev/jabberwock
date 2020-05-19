import { CharNode } from './CharNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectText,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { InlineFormatDomObjectRenderer } from '../../plugin-inline/src/InlineFormatDomObjectRenderer';
import { Format } from '../../plugin-inline/src/Format';

export class CharDomObjectRenderer extends InlineFormatDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = CharNode;

    async render(node: CharNode): Promise<DomObject> {
        // Consecutive compatible char nodes are rendered as a single text node.
        const charNodes = [node];
        const siblings = node.parent.children();
        let sibling: VNode;
        let index = siblings.indexOf(node) - 1;
        while ((sibling = siblings[index]) && node.isSameTextNode(sibling)) {
            charNodes.unshift(sibling);
            index--;
        }
        index = siblings.indexOf(node) + 1;
        while ((sibling = siblings[index]) && node.isSameTextNode(sibling)) {
            charNodes.push(sibling);
            index++;
        }
        let text = '';
        for (const charNode of charNodes) {
            if (charNode.char === ' ' && text[text.length - 1] === ' ') {
                // Browsers don't render consecutive space chars otherwise.
                text += '\u00A0';
            } else {
                text += charNode.char;
            }
        }
        // Render block edge spaces as non-breakable space (otherwise browsers
        // won't render them).
        const previous = node.previousSibling();
        if (!previous || !previous.is(InlineNode)) {
            text = text.replace(/^ /g, '\u00A0');
        }
        if (!sibling || !sibling.is(InlineNode)) {
            text = text.replace(/ $/g, '\u00A0');
        }

        const textObject: DomObjectText = { text: text };
        this.engine.locate(charNodes, textObject);

        // If the node has attributes, wrap it inside a span with those
        // attributes.
        let domObject: DomObject;
        const attributes = node.modifiers.find(Attributes);
        if (attributes?.length) {
            domObject = {
                tag: 'SPAN',
                children: [textObject],
            };
            this.engine.renderAttributes(Attributes, node, domObject);
        } else {
            domObject = textObject;
        }

        const rendering = this.renderFormats(node.modifiers.filter(Format), domObject);
        return this.engine.rendered(charNodes, this, rendering);
    }
}
