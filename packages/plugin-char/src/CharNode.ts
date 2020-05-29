import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { Modifiers } from '../../core/src/Modifiers';

export class CharNode extends InlineNode {
    static readonly atomic = true;
    readonly char: string;
    constructor(params: { char: string; modifiers?: Modifiers }) {
        super();
        if (params.char.length !== 1) {
            throw new Error(
                'Cannot make a CharNode out of anything else than a string of length 1.',
            );
        }
        this.char = params.char;
        if (params.modifiers) {
            this.modifiers = params.modifiers;
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
    clone(params?: {}): this {
        const defaults: ConstructorParameters<typeof CharNode>[0] = {
            char: this.char,
            modifiers: this.modifiers.clone(),
        };
        return super.clone({ ...defaults, ...params });
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
     * Return the text content of this node.
     *
     * @override
     */
    get textContent(): string {
        return this.char;
    }
    /**
     * Return true if `a` has the same format properties as `b`.
     *
     * @param a
     * @param b
     */
    isSameTextNode(node: VNode): node is CharNode {
        if (node instanceof CharNode) {
            // Char VNodes are the same text node if they have the same
            // modifiers.
            return this.modifiers.areSameAs(node.modifiers);
        } else {
            // Nodes that are not valid in a text node must end the text node.
            return false;
        }
    }
}
