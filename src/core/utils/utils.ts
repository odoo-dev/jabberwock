const utils = {
    /**
     * Take a collection of nodes and return a regular array
     * with the same contents.
     */
    _collectionToArray: (collection: NodeListOf<any> | HTMLCollection): Element[] => {
        return Array.prototype.slice.call(collection);
    },
};

export default utils;
