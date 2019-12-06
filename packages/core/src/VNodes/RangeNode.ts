import { VNode, VNodeType } from './VNode';

export class RangeNode extends VNode {
    constructor(tailOrHead: 'tail' | 'head') {
        super(tailOrHead === 'tail' ? VNodeType.RANGE_TAIL : VNodeType.RANGE_HEAD);
    }
    /**
     * Return true if the VNode is atomic (ie. it may not have children).
     *
     * @override
     */
    get atomic(): boolean {
        return true;
    }
}
