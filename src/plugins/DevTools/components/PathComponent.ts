import { Component } from '../../../../lib/owl/dist/owl.js';

export class PathComponent extends Component<any, any, any> {
    onClickPathNode(vNode: VNode): void {
        this.trigger('node-selected', {
            vNode: vNode,
        });
    }
}
