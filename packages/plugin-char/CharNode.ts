import { VNode } from '../core/src/VNodes/VNode';
import { MarkerNode } from '../core/src/VNodes/MarkerNode';

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
    clone(): this {
        return new this.constructor<typeof CharNode>(this.char, this.format);
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
    /**
     * Return true if `a` has the same format properties as `b`.
     *
     * @param a
     * @param b
     */
    isSameTextNode(node: VNode): boolean {
        if (this.is(CharNode) && node.is(CharNode)) {
            // Char VNodes are the same text node if they have the same format.
            const formats = Object.keys({ ...this.format, ...node.format });
            return formats.every(k => !!this.format[k] === !!node.format[k]);
        } else if (this.is(MarkerNode) || node.is(MarkerNode)) {
            // A Marker node is always considered to be part of the same text
            // node as another node in the sense that the text node must not
            // be broken up just because it contains a marker.
            return true;
        } else {
            // Nodes that are not valid in a text node must end the text node.
            return false;
        }
    }
}
