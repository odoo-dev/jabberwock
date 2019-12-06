import { VNode, VNodeType } from './VNode';

export class RootNode extends VNode {
    constructor() {
        super(VNodeType.ROOT);
    }
}
