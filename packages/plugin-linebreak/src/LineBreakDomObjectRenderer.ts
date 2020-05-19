import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { LineBreakNode } from './LineBreakNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class LineBreakDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = LineBreakNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: LineBreakNode): Promise<DomObject> {
        const br: DomObject = { tag: 'BR' };
        this.engine.renderAttributes(Attributes, node, br);
        const domObject = { nodes: [node], children: [br] };
        if (!node.nextSibling()) {
            // If a LineBreakNode has no next sibling, it must be rendered
            // as two BRs in order for it to be visible.
            domObject.children.push({ tag: 'BR' });
        }
        return domObject;
    }
}
