import { VNode } from '../../../core/stores/VNode';
import { Component } from 'owl-framework';

export class InfoComponent extends Component<any, any, any> {
    selectNode(vNode: VNode): void {
        this.trigger('node-selected', {
            vNode: vNode,
        });
    }
}
