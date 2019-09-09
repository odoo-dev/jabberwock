import { Component } from '../../../../lib/owl/dist/owl.js';
import { VNode } from '../../../core/stores/VNode.js';

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
            this.toggleFolded();
        } else {
            this.trigger('node-selected', {
                vNode: this.props.vNode,
            });
        }
    }
    onKeydown(event: KeyboardEvent): void {
        if (event.code === 'Enter') {
            event.preventDefault();
            this.toggleFolded();
            event.stopImmediatePropagation();
        }
    }
    selectNode(event: CustomEvent): void {
        if (event.detail.vNode.id !== this.props.vNode.id) {
            this.state.folded = false;
        }
    }
    toggleFolded(): void {
        this.state.folded = !this.state.folded;
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
