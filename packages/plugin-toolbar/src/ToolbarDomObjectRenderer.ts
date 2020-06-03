import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { ToolbarNode } from './ToolbarNode';

export class ToolbarZoneDomObjectRenderer extends AbstractRenderer<DomObject> {
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
