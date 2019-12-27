import { VNode, VNodeType } from './VNode';

export class RangeNode extends VNode {
    static readonly atomic = true;
    type = VNodeType.MARKER;
}
