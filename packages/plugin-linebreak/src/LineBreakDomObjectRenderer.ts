import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { LineBreakNode } from './LineBreakNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class LineBreakDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = LineBreakNode;

    /**
     * Render the VNode to the given format.
     */
    async render(
        node: LineBreakNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObject> {
        const br: DomObject = { tag: 'BR' };
        worker.locate([node], br);
        if (!node.nextSibling()) {
            // If a LineBreakNode has no next sibling, it must be rendered
            // as a BR and a placeholder invisible char in order for it to be
            // visible.
            const invisible: DomObject = { text: '\u200B' };
            const domObject = { children: [br, invisible] };
            worker.locate([node], invisible);
            return domObject;
        }
        return br;
    }
}
