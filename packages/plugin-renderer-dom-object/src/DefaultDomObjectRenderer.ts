import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { DomObjectRenderingEngine, DomObject } from './DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { isNodePredicate, testNodePredicate } from '../../core/src/VNodes/AbstractNode';

export class DefaultDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = 'dom/object';
    engine: DomObjectRenderingEngine;

    async render(node: VNode): Promise<DomObject> {
        let domObject: DomObject;
        if (node.tangible) {
            if (isNodePredicate(node, VElement) && node.htmlTag[0] !== '#') {
                domObject = {
                    tag: node.htmlTag,
                    children: await this.engine.renderChildren(node),
                };
                this.engine.renderAttributes(Attributes, node, domObject);
            } else if (testNodePredicate(node, FragmentNode)) {
                domObject = {
                    children: await this.engine.renderChildren(node),
                };
            } else if (isNodePredicate(node, AtomicNode)) {
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
