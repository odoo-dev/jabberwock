import { AbstractNode } from './VNodes/AbstractNode';
import { ContainerNode } from './VNodes/ContainerNode';
import { Predicate, VNode } from './VNodes/VNode';

type WalkerFilter = {
    ignoreIntangibles?: boolean;
};

export class Walker {
    constructor(private readonly _configuration: WalkerFilter = {}) {}

    /**
     * Test the given node against this walker configured filter.
     *
     * @param node The node to test
     */
    isValid(node: VNode): boolean {
        if (!node || (this._configuration.ignoreIntangibles && !node.tangible)) {
            return false;
        }
        return true;
    }
    /**
     * Test the given node against the given predicate.
     *
     * If the predicate is falsy, return true. If the predicate is a
     * constructor of a VNode class, return whether the given node is an
     * instance of that class.
     * If the predicate is a standard function, return the result of this
     * function when called with the node as parameter.
     *
     * @param node The node to test
     * @param predicate The predicate to test the given node against.
     */
    test(node: VNode, predicate?: Predicate): boolean {
        if (!predicate) {
            return true;
        } else if (AbstractNode.isConstructor(predicate)) {
            return node instanceof predicate;
        } else {
            return predicate(node);
        }
    }
    /**
     * Return true if the given node is a leaf in the VDocument, that is a node
     * that has no children.
     *
     * @param node node to check
     */
    isLeaf(node: VNode): boolean {
        return !this.hasChildren(node);
    }
    /**
     * Return the valid children of the given VNode which satisfy the given
     * predicate.
     *
     * @param thisNode
     * @param [predicate]
     */
    children<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T[];
    children(thisNode: VNode, predicate?: Predicate): VNode[];
    children(thisNode: VNode, predicate?: Predicate): VNode[] {
        const children: VNode[] = [];
        const stack = [...thisNode.childVNodes];
        while (stack.length) {
            const node = stack.shift();
            if (this._configuration.ignoreIntangibles && !node.tangible) {
                stack.unshift(...node.childVNodes);
            } else if (this.isValid(node) && this.test(node, predicate)) {
                children.push(node);
            }
        }
        return children;
    }
    /**
     * Return true if the given VNode has children.
     *
     * @param thisNode
     */
    hasChildren(thisNode: VNode): boolean {
        if (this._configuration.ignoreIntangibles) {
            const stack = [...thisNode.childVNodes];
            for (const child of stack) {
                if (child.tangible) {
                    return true;
                } else {
                    stack.push(...child.childVNodes);
                }
            }
        } else {
            return !!thisNode.childVNodes.length;
        }
        return false;
    }
    /**
     * Return true if the given VNode comes before the given VNode in the pre-order
     * traversal.
     *
     * @param thisNode
     * @param node
     */
    isBefore(thisNode: VNode, node: VNode): boolean {
        const thisPath = [thisNode];
        let parent = thisNode.parentVNode;
        while (parent) {
            thisPath.push(parent);
            parent = parent.parentVNode;
        }
        const nodePath = [node];
        parent = node.parentVNode;
        while (parent) {
            nodePath.push(parent);
            parent = parent.parentVNode;
        }
        // Find the last distinct ancestors in the path to the root.
        let thisAncestor: VNode;
        let nodeAncestor: VNode;
        do {
            thisAncestor = thisPath.pop();
            nodeAncestor = nodePath.pop();
        } while (thisAncestor && nodeAncestor && thisAncestor === nodeAncestor);

        if (thisAncestor && nodeAncestor) {
            const thisParent = thisAncestor.parentVNode;
            const nodeParent = nodeAncestor.parentVNode;
            if (thisParent && thisParent === nodeParent) {
                // Compare the indices of both ancestors in their shared parent.
                const thisIndex = thisParent.childVNodes.indexOf(thisAncestor);
                const nodeIndex = nodeParent.childVNodes.indexOf(nodeAncestor);
                return thisIndex < nodeIndex;
            } else {
                // The very first ancestor of both nodes are different so
                // they actually come from two different trees altogether.
                return false;
            }
        } else {
            // One of the nodes was in the ancestors path of the other.
            return !thisAncestor && !!nodeAncestor;
        }
    }
    /**
     * Return true if the given VNode comes after the given VNode in the pre-order
     * traversal.
     *
     * @param thisNode
     * @param node
     */
    isAfter(thisNode: VNode, node: VNode): boolean {
        return this.isBefore(node, thisNode);
    }
    /**
     * Return the closest node from thisNode node that matches the given predicate.
     * Start with thisNode node then go up the ancestors tree until finding a match.
     *
     * @param thisNode
     * @param predicate
     */
    closest<T extends VNode>(thisNode: VNode, predicate: Predicate<T>): T;
    closest(thisNode: VNode, predicate: Predicate): VNode;
    closest(thisNode: VNode, predicate: Predicate): VNode {
        if (this.isValid(thisNode) && this.test(thisNode, predicate)) {
            return thisNode;
        } else {
            return this.ancestor(thisNode, predicate);
        }
    }
    /**
     * Return the first valid parent of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    parent<T extends VNode>(thisNode: VNode): T;
    parent(thisNode: VNode): ContainerNode;
    parent(thisNode: VNode): ContainerNode {
        let ancestor = thisNode.parentVNode;
        while (ancestor && this._configuration.ignoreIntangibles && !ancestor.tangible) {
            ancestor = ancestor.parentVNode;
        }
        return ancestor;
    }
    /**
     * Return the first valid ancestor of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    ancestor<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    ancestor(thisNode: VNode, predicate?: Predicate): ContainerNode;
    ancestor(thisNode: VNode, predicate?: Predicate): ContainerNode {
        let ancestor = thisNode.parentVNode;
        while (ancestor && !(this.isValid(ancestor) && this.test(ancestor, predicate))) {
            ancestor = ancestor.parentVNode;
        }
        return ancestor;
    }
    /**
     * Return all valid ancestors of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    ancestors<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T[];
    ancestors(thisNode: VNode, predicate?: Predicate): ContainerNode[];
    ancestors(thisNode: VNode, predicate?: Predicate): ContainerNode[] {
        const ancestors: ContainerNode[] = [];
        let ancestor = thisNode.parentVNode;
        while (ancestor) {
            if (this.isValid(ancestor) && this.test(ancestor, predicate)) {
                ancestors.push(ancestor);
            }
            ancestor = ancestor.parentVNode;
        }
        return ancestors;
    }
    /**
     * Return the lowest valid common ancestor between the given VNode and the
     * given one.
     *
     * @param thisNode
     * @param node
     * @param [predicate]
     */
    commonAncestor<T extends VNode>(thisNode: VNode, node: VNode, predicate?: Predicate<T>): T;
    commonAncestor(thisNode: VNode, node: VNode, predicate?: Predicate): ContainerNode;
    commonAncestor(thisNode: VNode, node: VNode, predicate?: Predicate): ContainerNode {
        const thisNodePath = this.ancestors(thisNode, predicate);
        if (
            thisNode !== node &&
            thisNode.childVNodes.length &&
            this.isValid(thisNode) &&
            this.test(thisNode, predicate)
        ) {
            thisNodePath.unshift(thisNode as ContainerNode);
        }
        let commonAncestor = node as ContainerNode;
        while (commonAncestor && !thisNodePath.includes(commonAncestor)) {
            commonAncestor = commonAncestor.parentVNode;
        }
        return commonAncestor;
    }
    /**
     * Return the valid siblings of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    siblings<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T[];
    siblings(thisNode: VNode, predicate?: Predicate): VNode[];
    siblings(thisNode: VNode, predicate?: Predicate): VNode[] {
        const parent = this.parent(thisNode);
        if (!parent) return [];
        const siblings = this.children(parent, predicate);
        const index = siblings.indexOf(thisNode);
        if (index !== -1) {
            siblings.splice(index, 1);
        }
        return siblings;
    }
    /**
     * Return the valid adjacents of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    adjacents<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T[];
    adjacents(thisNode: VNode, predicate?: Predicate): VNode[];
    adjacents(thisNode: VNode, predicate?: Predicate): VNode[] {
        const adjacents: VNode[] = [];
        const previousSiblings = this.previousSiblings(thisNode);
        let sibling: VNode;
        while ((sibling = previousSiblings.shift()) && this.test(sibling, predicate)) {
            // Skip ignored siblings and those failing the predicate test.
            adjacents.unshift(sibling);
        }
        if (this.isValid(thisNode) && this.test(thisNode, predicate)) {
            // Skip ignored siblings and those failing the predicate test.
            adjacents.push(thisNode);
        }
        const nextSiblings = this.nextSiblings(thisNode);
        while ((sibling = nextSiblings.shift()) && this.test(sibling, predicate)) {
            // Skip ignored siblings and those failing the predicate test.
            adjacents.push(sibling);
        }
        return adjacents;
    }
    /**
     * Return the valid previous sibling of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    previousSibling<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    previousSibling(thisNode: VNode, predicate?: Predicate): VNode;
    previousSibling(thisNode: VNode, predicate?: Predicate): VNode {
        do {
            const parentVNode = thisNode.parentVNode;
            if (!parentVNode) return;
            const childVNodes = parentVNode.childVNodes;
            const index = childVNodes.indexOf(thisNode);
            if (index === 0) {
                if (this._configuration.ignoreIntangibles && !parentVNode.tangible) {
                    // If it has no siblings either then climb up to the closest
                    // parent which has a previous sibiling.
                    thisNode = parentVNode;
                    continue;
                }
                return;
            }
            thisNode = childVNodes[index - 1];
            if (this._configuration.ignoreIntangibles && !thisNode.tangible) {
                thisNode = this.lastChild(thisNode) || thisNode;
            }
            // Skip ignored siblings and those failing the predicate test.
        } while (!this.isValid(thisNode) || !this.test(thisNode, predicate));

        return thisNode;
    }
    /**
     * Return the valid next sibling of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    nextSibling<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    nextSibling(thisNode: VNode, predicate?: Predicate): VNode;
    nextSibling(thisNode: VNode, predicate?: Predicate): VNode {
        do {
            const parentVNode = thisNode.parentVNode;
            if (!parentVNode) return;
            const childVNodes = parentVNode.childVNodes;
            const len = childVNodes.length;
            const index = childVNodes.indexOf(thisNode);
            if (index >= len - 1) {
                if (this._configuration.ignoreIntangibles && !parentVNode.tangible) {
                    // If it has no siblings either then climb up to the closest
                    // parent which has a next sibiling.
                    thisNode = parentVNode;
                    continue;
                }
                return;
            }
            thisNode = childVNodes[index + 1];
            if (this._configuration.ignoreIntangibles && !thisNode.tangible) {
                thisNode = this.firstChild(thisNode) || thisNode;
            }
            // Skip ignored siblings and those failing the predicate test.
        } while (!this.isValid(thisNode) || !this.test(thisNode, predicate));

        return thisNode;
    }
    /**
     * Return the valid previous node in a depth-first pre-order traversal of
     * the tree that satisfies the given predicate.
     *
     * @param thisNode
     * @param [predicate]
     */
    previous<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    previous(thisNode: VNode, predicate?: Predicate): VNode;
    previous(thisNode: VNode, predicate?: Predicate): VNode {
        let previous: VNode;
        do {
            const node = previous || thisNode;
            previous = this.previousSibling(node);
            if (previous) {
                // The previous node is the last leaf of the previous sibling.
                previous = this.lastLeaf(previous);
            } else {
                // If it has no siblings either then climb up to the closest parent
                // which has a next sibiling.
                previous = this.parent(node);
            }
        } while (previous && !(this.isValid(previous) && this.test(previous, predicate)));
        return previous;
    }
    /**
     * Return the valid next node in a depth-first pre-order traversal of
     * the tree that satisfies the given predicate.
     *
     * @param thisNode
     * @param [predicate]
     */
    next<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    next(thisNode: VNode, predicate?: Predicate): VNode;
    next(thisNode: VNode, predicate?: Predicate): VNode {
        let next: VNode;
        do {
            const node = next || thisNode;
            // The node after node is its first child.
            next = this.firstChild(node);
            if (!next) {
                // If it has no children then it is its next sibling.
                next = this.nextSibling(node);
            }
            if (!next) {
                // If it has no siblings either then climb up to the closest parent
                // which has a next sibiling.
                let ancestor = this.parent(node);
                while (ancestor && !(next = this.nextSibling(ancestor))) {
                    ancestor = this.parent(ancestor);
                }
                if (!ancestor) next = undefined;
            }
        } while (next && !(this.isValid(next) && this.test(next, predicate)));
        return next;
    }
    /**
     * Return the valid previous leaf in a depth-first pre-order traversal of
     * the tree that satisfies the given predicate.
     *
     * @param thisNode
     * @param [predicate]
     */
    previousLeaf<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    previousLeaf(thisNode: VNode, predicate?: Predicate): VNode;
    previousLeaf(thisNode: VNode, predicate?: Predicate): VNode {
        return this.previous(
            thisNode,
            (node: VNode): boolean => this.isLeaf(node) && this.test(node, predicate),
        );
    }
    /**
     * Return the valid next leaf in a depth-first pre-order traversal of the
     * tree that satisfies the given predicate.
     *
     * @param thisNode
     * @param [predicate]
     */
    nextLeaf<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    nextLeaf(thisNode: VNode, predicate?: Predicate): VNode;
    nextLeaf(thisNode: VNode, predicate?: Predicate): VNode {
        return this.next(
            thisNode,
            (node: VNode): boolean => this.isLeaf(node) && this.test(node, predicate),
        );
    }
    /**
     * Return all valid previous siblings of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    previousSiblings<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T[];
    previousSiblings(thisNode: VNode, predicate?: Predicate): VNode[];
    previousSiblings(thisNode: VNode, predicate?: Predicate): VNode[] {
        const siblings: VNode[] = [];
        let current = thisNode;
        do {
            const parentVNode = current.parentVNode;
            if (!parentVNode) return siblings;
            const children = parentVNode.childVNodes;
            for (let index = children.indexOf(current) - 1; index >= 0; index--) {
                const sibling = children[index];
                if (this._configuration.ignoreIntangibles && !sibling.tangible) {
                    // If it is an intangible container take all valid children.
                    siblings.push(...this.children(sibling, predicate).reverse());
                } else if (this.isValid(sibling) && this.test(sibling, predicate)) {
                    siblings.push(sibling);
                }
            }
            // If the parent is an intangible container climb up and looking the
            // other previous sibiling.
            current = this._configuration.ignoreIntangibles && !parentVNode.tangible && parentVNode;
        } while (current);
        return siblings;
    }
    /**
     * Return all valid next siblings of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    nextSiblings<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T[];
    nextSiblings(thisNode: VNode, predicate?: Predicate): VNode[];
    nextSiblings(thisNode: VNode, predicate?: Predicate): VNode[] {
        const siblings: VNode[] = [];
        let current = thisNode;
        do {
            const parentVNode = current.parentVNode;
            if (!parentVNode) return siblings;
            const children = parentVNode.childVNodes;
            const len = children.length;
            for (let index = children.indexOf(current) + 1; index < len; index++) {
                const sibling = children[index];
                if (this._configuration.ignoreIntangibles && !sibling.tangible) {
                    // If it is an intangible container take all valid children.
                    siblings.push(...this.children(sibling, predicate));
                } else if (this.isValid(sibling) && this.test(sibling, predicate)) {
                    siblings.push(sibling);
                }
            }
            // If the parent is an intangible container climb up and looking the
            // other previous sibiling.
            current = this._configuration.ignoreIntangibles && !parentVNode.tangible && parentVNode;
        } while (current);
        return siblings;
    }
    /**
     * Return the nth child of the given node. The given `n` argument is the 1-based
     * index of the position of the child inside the given node, excluding markers.
     *
     * Examples:
     * nthChild(1) returns the first (1st) child.
     * nthChild(2) returns the second (2nd) child.
     * nthChild(3) returns the second (3rd) child.
     * nthChild(4) returns the second (4th) child.
     * ...
     *
     * @param thisNode
     * @param n
     */
    nthChild(thisNode: VNode, n: number): VNode {
        return this.children(thisNode)[n - 1];
    }
    /**
     * Return the first valid child of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    firstChild<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    firstChild(thisNode: VNode, predicate?: Predicate): VNode;
    firstChild(thisNode: VNode, predicate?: Predicate): VNode {
        thisNode = thisNode.childVNodes[0];
        while (
            thisNode &&
            this._configuration.ignoreIntangibles &&
            !thisNode.tangible &&
            thisNode.childVNodes.length
        ) {
            thisNode = thisNode.childVNodes[0];
        }
        if (thisNode) {
            if (this.isValid(thisNode) && this.test(thisNode, predicate)) {
                return thisNode;
            }
            return this.nextSibling(thisNode, predicate);
        }
    }
    /**
     * Return the last valid child of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    lastChild<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    lastChild(thisNode: VNode, predicate?: Predicate): VNode;
    lastChild(thisNode: VNode, predicate?: Predicate): VNode {
        thisNode = thisNode.childVNodes[thisNode.childVNodes.length - 1];
        while (
            thisNode &&
            this._configuration.ignoreIntangibles &&
            !thisNode.tangible &&
            thisNode.childVNodes.length
        ) {
            thisNode = thisNode.childVNodes[thisNode.childVNodes.length - 1];
        }
        if (thisNode) {
            if (this.isValid(thisNode) && this.test(thisNode, predicate)) {
                return thisNode;
            }
            return this.previousSibling(thisNode, predicate);
        }
    }
    /**
     * Return the first valid leaf of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    firstLeaf<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    firstLeaf(thisNode: VNode, predicate?: Predicate): VNode;
    firstLeaf(thisNode: VNode, predicate?: Predicate): VNode {
        const isValidLeaf = (node: VNode): boolean => {
            return this.isLeaf(node) && this.test(node, predicate);
        };
        if (isValidLeaf(thisNode)) {
            return thisNode;
        } else {
            return this.firstDescendant(thisNode, isValidLeaf);
        }
    }
    /**
     * Return the last valid leaf of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    lastLeaf<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    lastLeaf(thisNode: VNode, predicate?: Predicate): VNode;
    lastLeaf(thisNode: VNode, predicate?: Predicate): VNode {
        const isValidLeaf = (node: VNode): boolean => {
            return this.isLeaf(node) && this.test(node, predicate);
        };
        if (isValidLeaf(thisNode)) {
            return thisNode;
        } else {
            return this.lastDescendant(thisNode, isValidLeaf);
        }
    }
    /**
     * Return all valid descendants of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    descendants<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T[];
    descendants(thisNode: VNode, predicate?: Predicate): VNode[];
    descendants(thisNode: VNode, predicate?: Predicate): VNode[] {
        const descendants = [];
        const stack = [...thisNode.childVNodes];
        while (stack.length) {
            const node = stack.shift();
            if (this.isValid(node) && this.test(node, predicate)) {
                descendants.push(node);
            }
            stack.unshift(...node.childVNodes);
        }
        return descendants;
    }
    /**
     * Return the first valid descendant of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    firstDescendant<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    firstDescendant(thisNode: VNode, predicate?: Predicate): VNode;
    firstDescendant(thisNode: VNode, predicate?: Predicate): VNode {
        const stack = [...thisNode.childVNodes];
        while (stack.length) {
            const node = stack.shift();
            if (this.isValid(node) && this.test(node, predicate)) {
                return node;
            }
            stack.unshift(...node.childVNodes);
        }
    }
    /**
     * Return the last valid descendant of the given node.
     *
     * @param thisNode
     * @param [predicate]
     */
    lastDescendant<T extends VNode>(thisNode: VNode, predicate?: Predicate<T>): T;
    lastDescendant(thisNode: VNode, predicate?: Predicate): VNode;
    lastDescendant(thisNode: VNode, predicate?: Predicate): VNode {
        const childrenFetched = new Set<VNode>();
        const stack = [...thisNode.childVNodes];
        while (stack.length) {
            const node = stack.pop();
            if (!childrenFetched.has(node) && node.childVNodes.length) {
                childrenFetched.add(node);
                stack.push(node, ...node.childVNodes);
            } else if (this.isValid(node) && this.test(node, predicate)) {
                return node;
            }
        }
    }
}

export const withoutIntangibles = new Walker({ ignoreIntangibles: true });
export const withIntangibles = new Walker();
