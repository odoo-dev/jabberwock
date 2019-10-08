import { VNode, VNodeType } from './VNode';
import { Parser } from '../utils/Parser';
import { Renderer } from '../utils/Renderer';

export type DomMap = Map<DOMElement | Node, VNode[]>;

export class VDocument {
    _root = new VNode(VNodeType.ROOT);
    domMap: DomMap = new Map();
    editable: HTMLElement;
    renderer: Renderer = new Renderer(this);

    constructor(editable: HTMLElement) {
        this.editable = editable;
        this.domMap.set(this.editable, [this._root]);
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
        this.renderer.render(this.editable);

        return this._root;
    }
}
