import { VNode } from '../core/src/VNodes/VNode';
import { FormatName, Format } from '../core/src/Format';

export class CharNode extends VNode {
    static readonly atomic = true;
    readonly char: string;
    constructor(char: string, format?: Record<FormatName, Format>) {
        super();
        if (char.length !== 1) {
            throw new Error(
                'Cannot make a CharNode out of anything else than a string of length 1.',
            );
        }
        this.char = char;
        if (format) {
            this.format = format;
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
        if (this.format) {
            charNode.format = { ...this.format };
        }
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
