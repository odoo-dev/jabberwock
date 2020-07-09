import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { InputNode } from './InputNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class InputDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = InputNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: InputNode): Promise<DomObject> {
        const input = {
            tag: 'INPUT',
            attributes: {
                type: node.inputType,
                name: node.inputName,
                value: node.value,
            },
        };
        const attributes = node.modifiers.find(Attributes);
        if (attributes) {
            this.engine.renderAttributes(Attributes, node, input);
        }
        return input;
    }
}
