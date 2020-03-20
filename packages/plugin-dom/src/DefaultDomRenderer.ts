import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { VNode, isTangible } from '../../core/src/VNodes/VNode';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { DomRenderingEngine } from './DomRenderingEngine';

export class DefaultDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;

    async render(node: VNode): Promise<Node[]> {
        let domNode: Node;
        if (isTangible(node)) {
            if (node.test(FragmentNode)) {
                domNode = document.createDocumentFragment();
            } else {
                let nodeName: string;
                if (node.is(VElement)) {
                    nodeName = node.htmlTag;
                } else {
                    nodeName = node.constructor.name.toUpperCase() + '-' + node.id;
                }
                const element = document.createElement(nodeName);
                this.engine.renderAttributes(node.attributes, element);
                domNode = element;
            }

            const renderedChildren = await this.renderChildren(node);
            for (const renderedChild of renderedChildren) {
                for (const domChild of renderedChild) {
                    domNode.appendChild(domChild);
                }
            }
            return [domNode];
        } else {
            return [];
        }
    }
}
