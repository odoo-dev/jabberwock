import { Component } from 'owl-framework';
import { VNode } from '../../../core/stores/VNode';

export class PathComponent extends Component<any, any, any> {
    onClickPathNode(vNode: VNode): void {
        this.trigger('node-selected', {
            vNode: vNode,
        });
    }
}
