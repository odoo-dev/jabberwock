import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
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
        this.engine.renderAttributes(Attributes, toolbar, objectToolbar);

        return objectToolbar;
    }
}
