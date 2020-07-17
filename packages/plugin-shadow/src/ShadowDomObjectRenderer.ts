import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ShadowNode } from './ShadowNode';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { isNodePredicate } from '../../core/src/VNodes/AbstractNode';

export class ShadowDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ShadowNode;

    async render(shadow: ShadowNode): Promise<DomObject> {
        const domObject: DomObject = {
            tag: 'JW-SHADOW',
            shadowRoot: true,
            children: shadow.childVNodes.filter(
                child => child.tangible || isNodePredicate(child, MetadataNode),
            ),
        };
        this.engine.renderAttributes(Attributes, shadow, domObject);
        return domObject;
    }
}
