import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { MetadataNode } from './MetadataNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class MetadataDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = MetadataNode;

    async render(node: MetadataNode): Promise<DomObject> {
        const meta = {
            tag: node.htmlTag,
            children: [{ text: node.contents }],
        };
        this.engine.renderAttributes(Attributes, node, meta);
        return meta;
    }
}
