import { VNode, VNodeType } from './VNode';

export class MarkerNode extends VNode {
    static readonly atomic = true;
    type = VNodeType.MARKER;

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
        __repr += '|';
        if (!this.nextSibling()) {
            __repr += '\n';
        }
        return __repr;
    }
}
