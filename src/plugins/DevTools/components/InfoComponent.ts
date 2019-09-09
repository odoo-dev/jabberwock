import { VNode } from '../../../core/stores/VNode';
import { Component } from 'owl-framework';

export class InfoComponent extends Component<any, any, any> {
    clickParent(vNode: VNode): void {
        if (vNode.parent) {
            this.trigger('node-selected', {
                vNode: vNode.parent,
            });
        }
    }
}
