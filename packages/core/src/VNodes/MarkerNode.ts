import { VNode, VNodeType } from './VNode';

export class MarkerNode extends VNode {
    static readonly atomic = true;
    type = VNodeType.MARKER;
}
