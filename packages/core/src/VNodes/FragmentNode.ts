import { ContainerNode } from './ContainerNode';

export class FragmentNode extends ContainerNode {
    readonly attributeEditable = true;
    readonly breakable = false;

    set parent(parent: ContainerNode) {
        this.mergeWith(parent);
        parent.removeChild(this);
    }
}
