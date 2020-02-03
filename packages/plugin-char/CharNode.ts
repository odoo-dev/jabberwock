import { Format } from '../plugin-inline/Format';
import { InlineNode } from '../plugin-inline/InlineNode';

export class CharNode extends InlineNode {
    static readonly atomic = true;
    readonly char: string;
    constructor(char: string, format?: Format[]) {
        super();
        if (char.length !== 1) {
            throw new Error(
                'Cannot make a CharNode out of anything else than a string of length 1.',
            );
        }
        this.char = char;
        if (format) {
            this.formats = format;
        }
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    get name(): string {
        return this.char;
    }
    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     * @override
     */
    shallowDuplicate(): CharNode {
        const charNode = new CharNode(this.char);
        charNode.formats = [...this.formats];
        return charNode;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

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
}
