import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ListNode, ListType } from './ListNode';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';

import '../assets/checklist.css';

export class ListDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ListNode;

    async render(node: ListNode): Promise<DomObject> {
        const domObject: DomObject = {
            tag: node.listType === ListType.ORDERED ? 'OL' : 'UL',
            children: [],
            attributes: {},
        };
        this.engine.renderAttributes(Attributes, node, domObject);
        if (ListNode.CHECKLIST(node)) {
            if (!domObject.attributes.class) {
                domObject.attributes.class = 'checklist';
            } else if (!domObject.attributes.class.includes('checklist')) {
                domObject.attributes.class += ' checklist';
            }
        }
        const renderedChildren = await this.engine.renderChildren(node);
        domObject.children.push(...renderedChildren.flat());
        return domObject;
    }
}
