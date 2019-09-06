import { Component } from '../../../../lib/owl/dist/owl.js';
import { VNode } from '../../../core/stores/VNode.js';

export class InfoComponent extends Component<any, any, any> {
    clickParent(vNode: VNode): void {
        if (vNode.parent) {
            this.trigger('node-selected', {
                vNode: vNode.parent,
            });
        }
    }
}
