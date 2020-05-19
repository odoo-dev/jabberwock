import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../../plugin-renderer/src/AbstractRenderer';
import { ZoneNode } from '../../../plugin-layout/src/ZoneNode';

export class ZoneDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ZoneNode;

    async render(node: ZoneNode): Promise<DomObject> {
        return {
            children: node.children().filter(child => !node.hidden.get(child)),
        };
    }
}
