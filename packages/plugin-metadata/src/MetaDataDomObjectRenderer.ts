import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { MetadataNode } from './MetadataNode';

export class MetadataDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = MetadataNode;

    async render(node: MetadataNode): Promise<DomObject> {
        const meta = {
            tag: node.htmlTag,
            children: [{ text: node.contents }],
        };
        return meta;
    }
}
