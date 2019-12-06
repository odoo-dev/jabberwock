import { VNode, VNodeType, FormatType } from './VNode';

export class CharNode extends VNode {
    properties = {
        atomic: true,
    };
    constructor(char: string, format: FormatType) {
        super(VNodeType.CHAR, '#text', char, format);
    }
}
