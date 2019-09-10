import { VNode, VNodeType } from './VNode';
import parser from '../utils/parser';

export class VDocument {
    _root: VNode;

    constructor(startValue?: DocumentFragment) {
        this._root = new VNode(VNodeType.ROOT);
        if (startValue) {
            this.setContents(startValue);
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Get the contents of the VDocument (its root VNode).
     */
    get contents(): VNode {
        return this._root;
    }
    /**
     * Set the contents of the VDocument.
     */
    setContents(fragment: DocumentFragment): VNode {
        const parsedNodes: VNode[] = parser.parse(fragment);
        while (this._root.children.length) {
            this._root.removeChild(0);
        }
        parsedNodes.forEach(parsedNode => {
            this._root.append(parsedNode);
        });
        return this._root;
    }
}
