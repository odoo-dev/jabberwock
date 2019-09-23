import { VNode, VNodeType } from './VNode';
import { Parser } from '../utils/Parser';

export class VDocument {
    _root = new VNode(VNodeType.ROOT);

    constructor(startValue?: HTMLElement) {
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
    setContents(element: HTMLElement): VNode {
        const parsedNodes: VNode[] = Parser.parse(element);
        while (this._root.children.length) {
            this._root.removeChild(0);
        }
        parsedNodes.forEach(parsedNode => {
            this._root.append(parsedNode);
        });
        return this._root;
    }
}
