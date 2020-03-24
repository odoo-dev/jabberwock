import { ContainerNode } from './ContainerNode';

export class FragmentNode extends ContainerNode {
    readonly breakable = false;
    set parent(parent: ContainerNode) {
        this.mergeWith(parent);
    }
}
