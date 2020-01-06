import { VNode, VNodeType } from './VNode';
import { VRange } from '../VRange';

export class MarkerNode extends VNode {
    static readonly atomic = true;
    type = VNodeType.MARKER;
}
