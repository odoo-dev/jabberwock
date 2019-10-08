import { VNode } from './VNode';

export class VDocument {
    root: VNode;
    constructor(root: VNode) {
        this.root = root;
    }
}
