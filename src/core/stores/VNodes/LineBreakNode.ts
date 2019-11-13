import { VNode, VNodeType } from '../VNode';

export class LineBreakNode extends VNode {
    properties = {
        atomic: true,
    };
    constructor() {
        super(VNodeType.LINE_BREAK, 'BR');
    }
}
