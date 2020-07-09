import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { LineBreakNode } from './LineBreakNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class LineBreakDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = LineBreakNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: LineBreakNode): Promise<DomObject> {
        const br: DomObject = { tag: 'BR' };
        this.engine.locate([node], br);
        if (!node.nextSibling()) {
            // If a LineBreakNode has no next sibling, it must be rendered
            // as two BRs in order for it to be visible.
            const br2 = { tag: 'BR' };
            const domObject = { children: [br, br2] };
            this.engine.locate([node], br2);
            return domObject;
        }
        return br;
    }
}
