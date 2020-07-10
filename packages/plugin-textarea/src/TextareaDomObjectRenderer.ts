import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { TextareaNode } from './TextareaNode';
import { DomObjectText } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class TextareaDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = TextareaNode;

    /**
     * Render the TextareaNode.
     */
    async render(node: TextareaNode): Promise<DomObject> {
        const text: DomObjectText = { text: node.value };
        const textarea: DomObject = {
            tag: 'TEXTAREA',
            children: [text],
        };
        this.engine.renderAttributes(Attributes, node, textarea);
        return textarea;
    }
}
