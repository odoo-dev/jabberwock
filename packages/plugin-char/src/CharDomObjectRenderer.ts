import { CharNode } from './CharNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { Predicate } from '../../core/src/VNodes/VNode';

export class CharDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = CharNode;

    async render(charNode: CharNode): Promise<DomObject> {
        return this._renderText([charNode]);
    }
    async renderBatch(charNodes: CharNode[]): Promise<DomObject[]> {
        const domObjects: DomObject[] = [];
        const domObject = this._renderText(charNodes);
        for (let i = 0; i < charNodes.length; i++) domObjects.push(domObject);
        return domObjects;
    }
    private _renderText(charNodes: CharNode[]): DomObject {
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
        const textObject = { text: texts.join('') };
        this.engine.locate(charNodes, textObject);
        return textObject;
    }
}
