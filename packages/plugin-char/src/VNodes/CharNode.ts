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
     * Render the VNode to the given format.
     *
     * @param [to] the name of the format to which we want to render (default:
     * html)
     */
    render<T>(to = 'html'): T {
        if (to === 'html') {
            // Consecutive compatible char nodes are rendered as a single text node.
            let text = '' + this.char;
            let next = this.nextSibling();
            const charNodes: CharNode[] = [this];
            while (next && this._isSameAs(next)) {
                if (next instanceof CharNode) {
                    charNodes.push(next);
                    if (next.char === ' ' && text[text.length - 1] === ' ') {
                        // Browsers don't render consecutive space chars otherwise.
                        text += '\u00A0';
                    } else {
                        text += next.char;
                    }
                }
                next = next.nextSibling();
            }
            // Browsers don't render leading/trailing space chars otherwise.
            text = text.replace(/^ | $/g, '\u00A0');

            // Create and append the text node, update the VDocumentMap.
            let renderedNodes = [document.createTextNode(text)] as Node[];
            if (this.attributes.size) {
                this.attributes.forEach(attribute => {
                    renderedNodes = attribute.render(renderedNodes);
                });
            }
            const fragment = document.createDocumentFragment();
            renderedNodes.forEach(node => fragment.appendChild(node));
            return ({ fragment: fragment, vNodes: charNodes } as unknown) as T;
        } else {
            return this.renderingEngines[to].render(this) as T;
        }
    }
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
