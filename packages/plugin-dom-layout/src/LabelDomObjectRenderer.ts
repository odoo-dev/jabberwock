import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { LabelNode } from '../../plugin-layout/src/LabelNode';

export class LabelDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = LabelNode;

    async render(label: LabelNode): Promise<DomObject> {
        const objectLabel: DomObject = {
            tag: 'SPAN',
            children: [{ text: label.label }],
        };
        this.engine.renderAttributes(Attributes, label, objectLabel);
        return objectLabel;
    }
}
