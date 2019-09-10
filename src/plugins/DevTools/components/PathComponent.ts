import { Component } from 'owl-framework';
import { VNode } from '../../../core/stores/VNode';
import { Env } from 'owl-framework/src/component/component';

export class PathComponent extends Component<Env, {}, {}> {
    getNodeRepr(vNode: VNode): string {
        const name: string = (vNode.type && vNode.type.toLowerCase()) || '?';
        let format = '';
        if (vNode.format.bold) {
            format += '.b';
        }
        if (vNode.format.italic) {
            format += '.i';
        }
        if (vNode.format.underlined) {
            format += '.u';
        }
        return name + format;
    }
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
