import { CharNode } from './CharNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { Predicate } from '../../core/src/VNodes/VNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import {
    isNodePredicate,
    previousSiblingNodeTemp,
    nextSiblingNodeTemp,
} from '../../core/src/VNodes/AbstractNode';

export class CharDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = CharNode;

    async render(charNode: CharNode): Promise<DomObject> {
        return this._renderText([charNode], charNode.modifiers.get(Attributes));
    }
    async renderBatch(charNodes: CharNode[]): Promise<DomObject[]> {
        const domObjects: DomObject[] = [];
        const groups = this._groupByAttributes(charNodes);
        for (const [charNodes, attr] of groups) {
            const domObject = this._renderText(charNodes, attr);
            for (let i = 0; i < charNodes.length; i++) domObjects.push(domObject);
        }
        return domObjects;
    }
    private _groupByAttributes(charNodes: CharNode[]): [CharNode[], Attributes][] {
        const groups: [CharNode[], Attributes][] = [];
        for (const charNode of charNodes) {
            const attr = charNode.modifiers.find(Attributes);
            const last = groups[groups.length - 1];
            if (!last || !last[1] !== !attr || (attr && !attr.isSameAs(last[1]))) {
                groups.push([[charNode], attr]);
            } else {
                last[0].push(charNode);
            }
        }
        return groups;
    }
    private _renderText(charNodes: CharNode[], attr: Attributes): DomObject {
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
        const previous = previousSiblingNodeTemp(charNodes[0]);
        if (!previous || !isNodePredicate(previous, InlineNode)) {
            texts[0] = texts[0].replace(/^ /g, '\u00A0');
        }
        const next = nextSiblingNodeTemp(charNodes[charNodes.length - 1]);
        if (!next || !isNodePredicate(next, InlineNode)) {
            texts[texts.length - 1] = texts[texts.length - 1].replace(/^ /g, '\u00A0');
        }
        const textObject = { text: texts.join('') };
        this.engine.locate(charNodes, textObject);

        if (attr?.keys().length) {
            const domObject = {
                tag: 'SPAN',
                children: [textObject],
            };
            this.engine.renderAttributes(Attributes, charNodes[0], domObject);
            return domObject;
        } else {
            return textObject;
        }
    }
}
