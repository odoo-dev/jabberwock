import { VNode } from './VNode';

export class FragmentNode extends VNode {
    breakable = false;
    set parent(parent: VNode) {
        this.mergeWith(parent);
    }
}
