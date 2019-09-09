import { VNode } from '../../../core/stores/VNode';
import { Component } from 'owl-framework';

interface NodeState {
    folded: boolean;
}

export class TreeComponent extends Component<any, any, NodeState> {
    components = { TreeComponent };
    name = this._getNodeName(this.props.vNode);
    state = {
        folded: !this.props.isRoot,
    };

    onClickElement(event: MouseEvent): void {
        const didClickCaret: boolean = event.offsetX < 10;
        if (didClickCaret) {
            this.state.folded = !this.state.folded;
        } else {
            this.trigger('node-selected', {
                vNode: this.props.vNode,
            });
        }
    }
    _getNodeName(node: VNode): string {
        if (node.value) {
            return node.value;
        }
        if (node.type) {
            return node.type.toLowerCase();
        }
        return '?';
    }
}
