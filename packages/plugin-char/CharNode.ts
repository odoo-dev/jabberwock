import { VNode } from '../core/src/VNodes/VNode';

export interface FormatType {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}
export const FORMAT_TYPES = ['bold', 'italic', 'underline'];

export class CharNode extends VNode {
    static readonly atomic = true;
    readonly char: string;
    // Format
    bold = false;
    italic = false;
    underline = false;
    constructor(char: string, format: FormatType = {}) {
        super();
        if (char.length !== 1) {
            throw new Error(
                'Cannot make a CharNode out of anything else than a string of length 1.',
            );
        }
        this.char = char;
        this.bold = !!format.bold;
        this.italic = !!format.italic;
        this.underline = !!format.underline;
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
        return new CharNode(this.char, this.format);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    get format(): FormatType {
        return {
            bold: this.bold,
            italic: this.italic,
            underline: this.underline,
        };
    }
    set format(format: FormatType) {
        this.bold = !!format.bold;
        this.italic = !!format.italic;
        this.underline = !!format.underline;
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

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return a convenient string representation of this node and its
     * descendants.
     *
     * @param __repr
     * @param level
     */
    _repr(__repr = '', level = 0): string {
        if (!this.previousSibling()) {
            __repr += Array(level * 4 + 1).join(' ');
        }
        __repr += this.name;
        if (!this.nextSibling()) {
            __repr += '\n';
        }
        return __repr;
    }
}
