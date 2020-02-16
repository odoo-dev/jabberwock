import { VNode, VNodeType } from './VNode';

export class FragmentNode extends VNode {
    type = VNodeType.FRAGMENT;

    set parent(parent: VNode) {
        this.mergeWith(parent);
    }
}
