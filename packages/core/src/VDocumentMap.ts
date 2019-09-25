import { Format } from '../../utils/src/Format';
import { VNode } from './VNode';

const fromDom = new Map<Node, VNode[]>();
const toDom = new Map<VNode, [Node, number]>();

export const VDocumentMap = {
    /**
     * Clear the map of all correspondances.
     */
    clear: (): void => {
        fromDom.clear();
        toDom.clear();
    },
    /**
     * Return the VNode(s) corresponding to the given DOM Node.
     *
     * @param Node
     */
    fromDom: (domNode: Node): VNode[] => fromDom.get(domNode),
    /**
     * Return the DOM Node corresponding to the given VNode.
     *
     * @param vNode
     */
    toDom: (vNode: VNode): Node => toDom.get(vNode)[0],
    /**
     * Return the DOM location corresponding to the given VNode as a tuple
     * containing a reference DOM Node and the offset of the DOM Node
     * corresponding to the given VNode within the reference DOM Node.
     *
     * @param vNode
     */
    toDomLocation: (vNode: VNode): [Node, number] => {
        let [node, offset] = toDom.get(vNode);
        if (node.nodeType !== Node.TEXT_NODE) {
            // Char nodes have their offset in the corresponding text nodes
            // registered in the map via `set` but other nodes don't. Their
            // location need to be computed with respect to their parents.
            const container = node.parentNode;
            offset = Array.prototype.indexOf.call(container.childNodes, node);
            node = container;
        }
        return [node, offset];
    },
    /**
     * Map the given VNode to its corresponding DOM Node and its offset in it.
     *
     * @param domNode
     * @param vNode
     * @param [offset]
     */
    set(vNode: VNode, domNode: Node, offset?: number): void {
        if (fromDom.has(domNode)) {
            const matches = fromDom.get(domNode);
            if (matches.indexOf(vNode) === -1) {
                matches.push(vNode);
            }
        } else {
            fromDom.set(domNode, [vNode]);
        }
        // Only if element is not a format and not already in the map to prevent
        // overriding a VNode if it is representing by multiple Nodes. Only the
        // first Node is mapped to the VNode.
        if (!Format.tags.includes(domNode.nodeName) && !toDom.has(vNode)) {
            toDom.set(vNode, [domNode, offset]);
        }
    },
    /**
     * Log the content of the internal maps for debugging purposes.
     */
    _log(): void {
        console.log(toDom);
        console.log(fromDom);
    },
};
