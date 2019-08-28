import { Component } from 'owl-framework';
import { VNode } from '../../../core/stores/VNode';

export class PathComponent extends Component<any, any, any> {
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
