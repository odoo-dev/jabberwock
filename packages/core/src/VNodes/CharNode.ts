import { VNode, VNodeType } from '../VNode';
import { utils } from '../../../utils/src/utils';
import { Format } from '../Format/Format';

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

export class CharNode extends VNode {
    char: Char;
    constructor(char: string, format: Set<Format> = new Set()) {
        super(VNodeType.CHAR);
        this.char = makeChar(char);
        this.name = char;
        Array.from(format).forEach(formatName => this._format.add(formatName));
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    static parse(node: Node): VNode | VNode[] | null {
        if (node.nodeType === Node.TEXT_NODE) {
            const vNodes: VNode[] = [];
            const text = utils.removeFormatSpace(node);
            for (let i = 0; i < text.length; i++) {
                const parsedVNode = new CharNode(text.charAt(i));
                vNodes.push(parsedVNode);
            }
            return vNodes;
        }
        return null;
    }
    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     * @override
     */
    shallowDuplicate(): VNode {
        return new CharNode(this.char, this._format);
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
        return this.char ? 1 : 0;
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
