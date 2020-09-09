import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { DomObjectRenderingEngine, DomObject } from './DomObjectRenderingEngine';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

export class DefaultDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = 'object/html';
    engine: DomObjectRenderingEngine;

    async render(node: VNode): Promise<DomObject> {
        let domObject: DomObject;
        if (node.tangible) {
            if (node instanceof ContainerNode) {
                domObject = {
                    children: await this.engine.renderChildren(node),
                };
            } else if (node instanceof AtomicNode) {
                domObject = { children: [] };
            }
        } else {
            domObject = { children: [] };
        }
        return domObject;
    }
}
