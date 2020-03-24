import { VNode, RelativePosition } from '../../core/src/VNodes/VNode';

export class DomMap {
    _fromDom = new Map<Node, VNode[]>();
    _toDom = new Map<VNode, [Node, number][]>();

    /**
     * Clear the map of all correspondances.
     */
    clear(): void {
        this._fromDom.clear();
        this._toDom.clear();
    }
    /**
     * Return the VNode(s) corresponding to the given DOM Node.
     *
     * @param Node
     */
    fromDom(domNode: Node): VNode[] {
        return this._fromDom.get(domNode);
    }
    /**
     * Return the DOM Node corresponding to the given VNode.
     *
     * @param node
     */
    toDom(node: VNode): [Node, number][] {
        return this._toDom.get(node);
    }
    /**
     * Return the DOM location corresponding to the given VNode as a tuple
     * containing a reference DOM Node and the offset of the DOM Node
     * corresponding to the given VNode within the reference DOM Node.
     * If the given position is "before", the reference DOM Node is the first
     * DOM node matching the given VNode.
     * If the given position is "after", the reference DOM Node is the last DOM
     * node matching the given VNode.
     *
     * @param node
     * @param position
     */
    toDomLocation(node: VNode, position: RelativePosition): [Node, number] {
        const locations = this._toDom.get(node);
        const locationIndex = position === RelativePosition.BEFORE ? 0 : locations.length - 1;
        let [domNode, offset] = locations[locationIndex];
        if (domNode.nodeType === Node.TEXT_NODE && offset === -1) {
            // This -1 is a hack to accomodate the VDocumentMap to the new
            // rendering process without altering it for the parser.
            return [domNode, this._fromDom.get(domNode).indexOf(node)];
        } else {
            // Char nodes have their offset in the corresponding text nodes
            // registered in the map via `set` but other nodes don't. Their
            // location need to be computed with respect to their parents.
            const container = domNode.parentNode;
            offset = Array.prototype.indexOf.call(container.childNodes, domNode);
            domNode = container;
        }
        return [domNode, offset];
    }
    /**
     * Map the given VNode to its corresponding DOM Node and its offset in it.
     *
     * @param domNode
     * @param node
     * @param [offset]
     */
    set(node: VNode, domNode: Node, offset = 0, method = 'push'): void {
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
    }
    /**
     * Log the content of the internal maps for debugging purposes.
     */
    _log(): void {
        console.log(this._toDom);
        console.log(this._fromDom);
    }
}
