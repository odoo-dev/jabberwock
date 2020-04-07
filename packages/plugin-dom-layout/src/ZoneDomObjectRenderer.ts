import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';

export class ZoneDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ZoneNode;

    async render(node: ZoneNode): Promise<DomObject> {
        return {
            children: node.children().filter(child => !node.hidden[child.id]),
        };
    }
}
