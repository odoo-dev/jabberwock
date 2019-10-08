import { VNode } from './VNode';
import { VRange, RelativePosition } from './VRange';

export class VDocument {
    root: VNode;
    range = new VRange();
    constructor(root: VNode) {
        this.root = root;
        this.range.setStart(RelativePosition.BEFORE, this.root.firstLeaf).collapse();
    }
}
