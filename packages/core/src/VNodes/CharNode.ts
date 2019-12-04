import { VNode, VNodeType } from './VNode';

/**
 * This "phantom type" is there to ensure that the type `Char` is only generated
 * through the use of the function `makeChar`, so as to force going through the
 * length check.
 */
type InternalChar<T> = { valid: true } & string;
export type Char = InternalChar<{}>;
/**
 * Return a Char type from a string of length 1 (validating the type).
 *
 * @param char
 */
export function makeChar(char: string): Char {
    if (char.length === 1) {
        return char as Char;
    } else {
        throw new Error('Cannot make a Char out of anything else than a string of length 1.');
    }
}
export interface FormatType {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
}
export const FORMAT_TYPES = ['bold', 'italic', 'underline'];

export class CharNode extends VNode {
    char: Char;
    format: FormatType = {
        bold: false,
        italic: false,
        underline: false,
    };
    constructor(char: string, format: FormatType = {}) {
        super(VNodeType.CHAR);
        this.char = makeChar(char);
        this.name = char;
        this.format.bold = !!format.bold;
        this.format.italic = !!format.italic;
        this.format.underline = !!format.underline;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

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

    /**
     * Return true if the VNode is atomic (ie. it may not have children).
     *
     * @override
     */
    get atomic(): boolean {
        return true;
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
}
