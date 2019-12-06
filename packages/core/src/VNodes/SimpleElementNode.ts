import { VNode, VNodeType } from './VNode';

export class SimpleElementNode extends VNode {
    constructor(type: VNodeType, originalTag?: string) {
        super(type, originalTag);
    }
}
