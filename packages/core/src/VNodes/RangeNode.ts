import { VNode, VNodeType } from '../VNode';

export class RangeNode extends VNode {
    properties = {
        atomic: true,
    };
    constructor(tailOrHead: 'tail' | 'head') {
        super(tailOrHead === 'tail' ? VNodeType.RANGE_TAIL : VNodeType.RANGE_HEAD);
    }
}
