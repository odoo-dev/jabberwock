import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { LabelNode } from '../../plugin-layout/src/LabelNode';

export class LabelDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = LabelNode;

    async render(label: LabelNode): Promise<DomObject> {
        const objectLabel: DomObject = {
            tag: 'SPAN',
            attributes: { class: new Set(['label']) },
            children: [{ text: label.label }],
        };
        return objectLabel;
    }
}
