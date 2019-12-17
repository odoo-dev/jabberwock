import { VNode, VNodeType } from '../../../core/src/VNodes/VNode';

export class RangeNode extends VNode {
    static readonly atomic = true;
    type = VNodeType.MARKER;
}
