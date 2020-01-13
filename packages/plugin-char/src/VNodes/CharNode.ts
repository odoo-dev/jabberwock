import { VNode, isMarker } from '../../../core/src/VNodes/VNode';

export class CharNode extends VNode {
    static readonly atomic = true;
    readonly char: string;
    constructor(char: string) {
        super();
        if (char.length !== 1) {
            throw new Error(
                'Cannot make a CharNode out of anything else than a string of length 1.',
            );
        }
        this.char = char;
        this.name = char;
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
        return new CharNode(this.char);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    toString(): string {
        let string = '<' + this.constructor.name + ':' + this.name;
        if (this.hasChildren()) {
            string += '>';
            this.children.forEach(child => {
                string += child.toString();
            });
            string += '</' + this.constructor.name + ':' + this.name + '>';
        } else {
            string += '/>';
        }
        return string;
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
     * Return true if this VNode has the same format properties as `b`.
     *
     * @param b
     */
    _isSameAs(b: VNode): boolean {
        if (isMarker(this) || isMarker(b)) {
            // A Marker node is always considered to be part of the same text
            // node as another node in the sense that the text node must not
            // be broken up just because it contains a marker.
            return true;
        } else if (!isChar(this) || !isChar(b)) {
            // Nodes that are not valid in a text node must end the text node.
            return false;
        } else {
            // Char VNodes are the same text node if they have the same format.
            const formats = Object.keys({
                ...this.attributes,
                ...b.attributes,
            });
            return formats.every(k => !!this.attributes.get(k) === !!b.attributes.get(k));
        }
    }
}

/**
 * Return true if the given node is a character node.
 *
 * @param node node to check
 */
export function isChar(node: VNode): boolean {
    return node instanceof CharNode;
}
