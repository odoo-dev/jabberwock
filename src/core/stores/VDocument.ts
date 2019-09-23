import { VNode, VNodeType } from './VNode';
import { Parser } from '../utils/Parser';
import { Renderer } from '../utils/Renderer';

export class VDocument {
    _root = new VNode(VNodeType.ROOT);
    editable: HTMLElement;

    constructor(editable: HTMLElement) {
        this.editable = editable;
        this.setContents(this.editable);
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
     * Find a DOM Node in the `VDocument`, as a `VNode`.
     * If an ID is passed, find the `VNode` matching that ID.
     *
     * @param {DOMElement|number} elementOrID
     * @returns {VNode}
     */
    find(elementOrID: DOMElement | number): VNode {
        return this._root.find(elementOrID);
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

        // Render the contents of this.editable
        Renderer.render(this, this.editable);

        return this._root;
    }
}
