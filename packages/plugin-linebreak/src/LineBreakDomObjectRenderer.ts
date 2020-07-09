import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { LineBreakNode } from './LineBreakNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

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
        this.engine.renderAttributes(Attributes, node, br);
        const domObject = { children: [br] };
        if (!node.nextSibling()) {
            // If a LineBreakNode has no next sibling, it must be rendered
            // as two BRs in order for it to be visible.
            const br = { tag: 'BR' };
            domObject.children.push(br);
            this.engine.locate([node], br);
        }
        return domObject;
    }
}
