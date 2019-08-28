import { VNode } from '../../../core/stores/VNode';
import { Component } from 'owl-framework';

export class InfoComponent extends Component<any, any, any> {
    /**
     * Trigger a 'node-selected' custom event
     * with the given `vNode` to select it
     *
     * @param {VNode} vNode
     */
    selectNode(vNode: VNode): void {
        this.trigger('node-selected', {
            vNode: vNode,
        });
    }
}
