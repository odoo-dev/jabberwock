import { VNode } from './VNode';
import { VRange } from './VRange';

export class VDocument {
    root: VNode;
    range = new VRange();
    constructor(root: VNode) {
        this.root = root;
        this.range.setAt(this.root);
    }
}
