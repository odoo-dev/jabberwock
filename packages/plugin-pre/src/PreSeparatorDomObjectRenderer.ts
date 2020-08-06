import { PreNode } from './PreNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectFragment,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class PreSeparatorDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;

    predicate = (item: VNode): boolean => {
        const DefaultSeparator = this.engine.editor.configuration.defaults.Separator;
        return item instanceof DefaultSeparator && !!item.ancestor(PreNode);
    };

    /**
     * Render the VNode.
     */
    async render(node: VNode, worker: RenderingEngineWorker<DomObject>): Promise<DomObject> {
        const separator = (await this.super.render(node, worker)) as
            | DomObjectElement
            | DomObjectFragment;
        let rendering: DomObject;
        if ('tag' in separator) {
            rendering = { text: '\n' };
        } else {
            rendering = { text: '\n\n' };
            worker.locate([node, node], rendering);
        }
        return rendering;
    }
}
