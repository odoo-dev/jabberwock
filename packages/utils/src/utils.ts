import { VNode } from '../../core/src/VNodes/VNode';
import { VDocumentMap } from '../../core/src/VDocumentMap';
import { ParsingContext } from '../../core/src/Parser';

export const utils = {
    /**
     * Convert certain special characters to unicode.
     */
    toUnicode(string: string): string {
        if (string === ' ') {
            return '\u00A0';
        }
        if (string === '\n') {
            return '\u000d';
        }
        if (string === '\t') {
            return '\u0009';
        }
        return string;
    },
    /**
     * Return the length of a DOM Node.
     *
     * @param node
     */
    nodeLength(node: Node): number {
        const isTextNode = node.nodeType === Node.TEXT_NODE;
        const content = isTextNode ? node.nodeValue : node.childNodes;
        return content.length;
    },
    parse(
        context: ParsingContext,
        VNodeClass: typeof VNode,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...args: Array<any>
    ): ParsingContext {
        const node = context.node;
        const vNode = new VNodeClass(...args);
        VDocumentMap.set(vNode, node);
        context.parentVNode.append(vNode);

        // A <br/> with no siblings is there only to make its parent visible.
        // Consume it since it was just parsed as its parent element node.
        // TODO: do this less naively to account for formatting space.
        if (node.childNodes.length === 1 && node.childNodes[0].nodeName === 'BR') {
            context.node = node.childNodes[0];
            VDocumentMap.set(vNode, context.node);
        }
        // A trailing <br/> after another <br/> is there only to make its previous
        // sibling visible. Consume it since it was just parsed as a single BR
        // within our abstraction.
        // TODO: do this less naively to account for formatting space.
        if (
            node.nodeName === 'BR' &&
            node.nextSibling &&
            node.nextSibling.nodeName === 'BR' &&
            !node.nextSibling.nextSibling
        ) {
            context.node = node.nextSibling;
            VDocumentMap.set(vNode, context.node);
        }
        return context;
    },

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Take a collection of nodes and return a regular array
     * with the same contents.
     */
    _collectionToArray: (collection: NodeListOf<Node> | HTMLCollection): Node[] => {
        return Array.prototype.slice.call(collection);
    },
};
