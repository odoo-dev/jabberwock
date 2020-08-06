import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class ZoneDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ZoneNode;

    async render(node: ZoneNode, worker: RenderingEngineWorker<DomObject>): Promise<DomObject> {
        const children = node.children();
        const domObject: DomObject = { children: [] };
        for (let index = 0, len = children.length; index < len; index++) {
            const child = children[index];
            if (!node.hidden?.[child.id]) {
                domObject.children.push(child);
            }
            worker.depends(child, node);
        }
        return domObject;
    }
}
