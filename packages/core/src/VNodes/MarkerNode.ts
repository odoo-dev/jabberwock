import { VNodeType } from './VNode';
import { AtomicNode } from './AtomicNode';

export class MarkerNode extends AtomicNode {
    type = VNodeType.MARKER;
}
