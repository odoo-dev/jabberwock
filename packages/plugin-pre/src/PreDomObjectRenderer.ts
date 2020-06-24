import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { PreNode } from './PreNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class PreDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = PreNode;

    /**
     * Render the VNode to the given format.
     */
    async render(node: PreNode): Promise<DomObject> {
        const pre: DomObject = {
            tag: 'PRE',
            children: await this.engine.renderChildren(node),
        };
        this.engine.renderAttributes(Attributes, node, pre);
        return pre;
    }
}
