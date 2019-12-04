import { VNode, VNodeType } from '../VNode';

export class SimpleElementNode extends VNode {
    constructor(type: VNodeType) {
        super(type);
    }
}
