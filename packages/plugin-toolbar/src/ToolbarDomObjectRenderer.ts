import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ToolbarNode } from './ToolbarNode';

export class ToolbarZoneDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ToolbarNode;

    async render(toolbar: ToolbarNode): Promise<DomObject> {
        const objectToolbar: DomObject = {
            tag: 'JW-TOOLBAR',
            children: toolbar.children(),
        };
        return objectToolbar;
    }
}
