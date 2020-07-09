import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { Predicate } from '../../core/src/VNodes/VNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { TemplateThumbnailSelectorNode } from './TemplateThumbnailSelectorNode';

import '../assets/Template.css';

export class TemplateThumbnailSelectorDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate: Predicate = TemplateThumbnailSelectorNode;

    async render(node: TemplateThumbnailSelectorNode): Promise<DomObject> {
        const domObject: DomObject = {
            tag: 'JW-TEMPLATES',
            children: [
                {
                    tag: 'JW-LABEL',
                    children: [{ text: 'Please choose a template' }],
                },
                ...node.children(),
            ],
        };
        this.engine.renderAttributes(Attributes, node, domObject);
        return domObject;
    }
}
