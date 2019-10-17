import { VNode } from '../stores/VNode';
import { Format } from './Format';

const fromDom = new Map<DOMElement | Node, VNode[]>();
const toDom = new Map<VNode, DOMElement | Node>();

export const VDocumentMap = {
    clear: (): void => {
        fromDom.clear();
        toDom.clear();
    },
    fromDom: (element: DOMElement | Node): VNode[] => fromDom.get(element),
    toDom: (vNode): DOMElement | Node => toDom.get(vNode),
    /**
     * Map an DOM Element/Node to a VNode in `toDom` and vice versa in
     * `fromDom`.
     *
     * @param element
     * @param vNode
     */
    set(element: Element | Node, vNode: VNode): void {
        if (fromDom.has(element)) {
            const matches = fromDom.get(element);
            if (!matches.some((match: VNode) => match.id === vNode.id)) {
                matches.push(vNode);
            }
        } else {
            fromDom.set(element, [vNode]);
        }
        // Only if element is not a format
        if (!Format.tags.includes(element.nodeName)) {
            toDom.set(vNode, element);
        }
    },
    log(): void {
        console.log(toDom);
        console.log(fromDom);
    },
};
