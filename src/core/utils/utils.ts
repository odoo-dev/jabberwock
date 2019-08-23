import { DOMElement } from '../types/DOMElement';

export const utils = {
    /**
     * Take a collection of nodes and return a regular array
     * with the same contents.
     */
    _collectionToArray: (collection: NodeListOf<Node> | HTMLCollection): DOMElement[] => {
        return Array.prototype.slice.call(collection);
    },
};
