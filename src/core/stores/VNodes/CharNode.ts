import { VNode, VNodeType, FormatType } from '../VNode';

export class CharNode extends VNode {
    properties = {
        atomic: true,
    };
    char: string;
    constructor(char: string, format?: FormatType) {
        super(VNodeType.CHAR, '#text', format);
        this.char = char;
        this.name = this.char;
    }
    /**
     * Return the length of this VNode.
     */
    get length(): number {
        return 1;
    }
    /**
     * Return this VNode's inner text (concatenation of all descendent
     * char nodes values).
     *
     * @param __current
     */
    text(__current = ''): string {
        __current += this.char;
        return __current;
    }
    /**
     * Return true if this VNode is a char node.
     */
    isChar(): boolean {
        return true;
    }
}
