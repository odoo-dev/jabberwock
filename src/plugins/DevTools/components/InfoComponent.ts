import { VNode } from '../../../core/stores/VNode';
import { Component } from 'owl-framework';
import { Env } from 'owl-framework/src/component/component';

export class InfoComponent extends Component<Env, {}, {}> {
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
