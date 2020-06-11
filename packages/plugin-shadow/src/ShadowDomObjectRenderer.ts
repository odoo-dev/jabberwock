import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ShadowNode } from './ShadowNode';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class ShadowDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ShadowNode;

    async render(shadow: ShadowNode): Promise<DomObject> {
        const domObject: DomObject = {
            tag: 'JW-SHADOW',
            shadowRoot: true,
            children: shadow.childVNodes.filter(child => child.tangible || child.is(MetadataNode)),
        };
        this.engine.renderAttributes(Attributes, shadow, domObject);
        return domObject;
    }
}
