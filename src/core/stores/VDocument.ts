import { VNode, VNodeType } from './VNode';
import { Parser } from '../utils/Parser';
import { Renderer } from '../utils/Renderer';

export type DomMap = Map<DOMElement | Node, VNode[]>;

export class VDocument {
    _root = new VNode(VNodeType.ROOT);
    domMap: DomMap = new Map();
    editable: HTMLElement;
    renderer: Renderer = new Renderer(this);
    rangeNodes = {
        start: new VNode(VNodeType.RANGE_START),
        end: new VNode(VNodeType.RANGE_END),
    };

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
        const rangeNodes: VNode[] = [this.rangeNodes.start, this.rangeNodes.end];
        rangeNodes.concat(parsedNodes).forEach(vNode => {
            this._root.append(vNode);
        });

        // Render the contents of this.editable
        this.renderer.render(this.editable);

        return this._root;
    }
}
