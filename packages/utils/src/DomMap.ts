import { VNode } from '../../core/src/VNodes/VNode';
import { LayoutContainer } from '../../plugin-dom-layout/src/LayoutContainerNode';
import { DomPoint } from '../../plugin-dom-layout/src/DomLayoutEngine';

export class DomMap {
    private readonly _fromDom = new Map<Node, VNode[]>();
    private readonly _toDom = new Map<VNode, DomPoint[]>();
    /**
     * Map the given VNode to its corresponding DOM Node and its offset in it.
     *
     * @param node
     * @param domNode
     * @param offset
     * @param method
     */
    set(node: VNode, domNode: Node, offset = 0, method = 'push'): void {
        if (node instanceof LayoutContainer) {
            return;
        }
        if (this._fromDom.has(domNode)) {
            const matches = this._fromDom.get(domNode);
            if (!matches.some((match: VNode) => match.id === node.id)) {
                matches[method](node);
            }
        } else {
            this._fromDom.set(domNode, [node]);
        }
        const locations = this._toDom.get(node) || [];
        locations.push([domNode, offset]);
        this._toDom.set(node, locations);

        // Set children.
        for (const renderedChild of domNode.childNodes) {
            const mapping = this.toDomPoint(node);
            if (!mapping) {
                this.set(node, renderedChild, -1, 'unshift');
            }
        }
    }
    /**
     * Return the VNode(s) corresponding to the given DOM Node.
     *
     * @param domNode
     */
    fromDom(domNode: Node): VNode[] {
        return this._fromDom.get(domNode);
    }
    /**
     * Return the array of tuple (node, number) corresponding to the given VNode.
     *
     * @param node
     */
    toDomPoint(node: VNode): DomPoint[] {
        return this._toDom.get(node) || [];
    }
    /**
     * Return the DOM Node corresponding to the given VNode.
     *
     * @param node
     */
    toDom(node: VNode): Node[] {
        const domNodes: Node[] = [];
        for (const point of this._toDom.get(node) || []) {
            domNodes.push(point[0]);
        }
        return domNodes;
    }
    /**
     * Clear the map of all correspondances.
     *
     * @param [node]
     */
    clear(node?: VNode): void {
        if (node) {
            for (const point of this._toDom.get(node) || []) {
                const nodes = this._fromDom.get(point[0]);
                const index = nodes.indexOf(node);
                if (index !== -1) {
                    nodes.splice(index, 0);
                }
                if (nodes.length === 0) {
                    this._fromDom.delete(point[0]);
                }
            }
            this._toDom.delete(node);
        } else {
            this._fromDom.clear();
            this._toDom.clear();
        }
    }
}
