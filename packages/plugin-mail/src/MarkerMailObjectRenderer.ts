import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { MarkerNode } from '../../core/src/VNodes/MarkerNode';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { MailObjectRenderingEngine } from './MailObjectRenderingEngine';

export class MarkerMailObjectRenderer extends NodeRenderer<DomObject> {
    static id = MailObjectRenderingEngine.id;
    engine: MailObjectRenderingEngine;
    predicate = MarkerNode;

    /**
     * Don't render the makerNode in mail
     *
     * @override
     */
    async render(): Promise<DomObject> {
        return { children: [] };
    }
}
