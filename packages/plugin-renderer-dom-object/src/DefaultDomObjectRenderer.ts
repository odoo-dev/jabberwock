import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { DomObjectRenderingEngine, DomObject } from './DomObjectRenderingEngine';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';

export class DefaultDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = 'dom/object';
    engine: DomObjectRenderingEngine;

    async render(node: VNode): Promise<DomObject> {
        let domObject: DomObject;
        if (node.tangible) {
            if (node instanceof VElement && node.htmlTag[0] !== '#') {
                domObject = {
                    tag: node.htmlTag,
                    children: await this.engine.renderChildren(node),
                };
            } else if (node instanceof FragmentNode) {
                domObject = {
                    children: await this.engine.renderChildren(node),
                };
            } else if (node instanceof AtomicNode) {
                domObject = { children: [] };
            } else {
                domObject = {
                    tag: node.name,
                    attributes: {
                        id: node.id.toString(),
                    },
                    children: await this.engine.renderChildren(node),
                };
            }
        } else {
            domObject = { children: [] };
        }
        return domObject;
    }
}
