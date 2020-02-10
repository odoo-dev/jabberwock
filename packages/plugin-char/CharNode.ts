import { MarkerNode } from '../core/src/VNodes/MarkerNode';
import { Format } from '../plugin-inline/Format';
import { InlineNode } from '../plugin-inline/InlineNode';
import { VNode } from '../core/src/VNodes/VNode';

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
    clone(): this {
        const clone = new this.constructor<typeof CharNode>(this.char, [...this.formats]);
        clone.attributes = { ...this.attributes };
        return clone;
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
    /**
     * Return true if `a` has the same format properties as `b`.
     *
     * @param a
     * @param b
     */
    isSameTextNode(node: VNode): boolean {
        if (this.is(CharNode) && node.is(CharNode)) {
            // Char VNodes are the same text node if they have the same format,
            // attributes and format attributes.
            const attributes = [...Object.keys(this.attributes), ...Object.keys(node.attributes)];
            return (
                this.formats.length === node.formats.length &&
                this.formats.every(aFormat => {
                    return !!node.formats.find(bFormat => bFormat.isSameAs(aFormat));
                }) &&
                attributes.every(k => this.attributes[k] === node.attributes[k])
            );
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
