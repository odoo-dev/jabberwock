import { VNode } from './VNode';

export class AtomicNode extends VNode {
    static readonly atomic = true;

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return a convenient string representation of this node and its
     * descendants.
     *
     * @param __repr
     * @param __level
     */
    _repr(__repr = '', __level = 0): string {
        if (!this.previousSibling()) {
            __repr += Array(__level * 4 + 1).join(' ');
        }
        __repr += this.name;
        if (!this.nextSibling()) {
            __repr += '\n';
        }
        return __repr;
    }
}
