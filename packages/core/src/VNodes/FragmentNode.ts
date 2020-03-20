import { VNode } from './VNode';

export class FragmentNode extends VNode {
    set parent(parent: VNode) {
        this.mergeWith(parent);
    }
}
