import { VNode, Point, RelativePosition } from '../../core/src/VNodes/VNode';
import { nodeName, nodeLength, FlattenUnion, flat } from '../../utils/src/utils';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { DomPoint } from './DomLayoutEngine';
import {
    DomObject,
    DomObjectAttributes,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Modifier } from '../../core/src/Modifier';
import { isTextNode } from '../../utils/src/Dom';

//--------------------------------------------------------------------------
// Internal objects
//--------------------------------------------------------------------------

type GenericDomObject = Partial<FlattenUnion<DomObject>>;
type DomObjectID = number;
type DomObjectMapping = {
    id: DomObjectID;
    object: GenericDomObject;
    parent?: DomObjectID;
    children: DomObjectID[];
    parentDomNode?: Element | ShadowRoot;
    dom: Node[];
    domNodes: Node[];
    domNodesChildren?: [Node, RelativePosition, DomObjectID[]][];
};

//--------------------------------------------------------------------------
// Internal diff
//--------------------------------------------------------------------------

type DiffDomObject = {
    id: DomObjectID;
    removedChildren: DomObjectID[];
    attributes: DomObjectAttributes;
    style: Record<string, string | null>;
    classList: Record<string, boolean>;
    parentDomNode: Element | ShadowRoot;
    dom: Node[];
    askCompleteRedrawing?: boolean;
};

let diffObjectId = 0;

/**
 * Set the style of an element keeping the "!important" css modifier in the value
 */
function setStyle(element: HTMLElement, name: string, value: string): void {
    if (value.includes('!important')) {
        element.style.setProperty(name, value.replace('!important', ''), 'important');
    } else {
        element.style.setProperty(name, value);
    }
}

export class DomReconciliationEngine {
    private _objects: Record<DomObjectID, DomObjectMapping> = {};
    private readonly _objectIds = new Map<GenericDomObject, DomObjectID>();
    private readonly _fromItem = new Map<VNode | Modifier, DomObjectID>();
    private readonly _fromDom = new Map<Node, DomObjectID>();
    private readonly _renderedNodes = new Map<VNode | Modifier, Set<DomObjectID>>();
    private readonly _renderedIds = new Set<DomObjectID>();

    private readonly _locations = new Map<GenericDomObject, VNode[]>();
    private readonly _items = new Map<GenericDomObject, Array<VNode | Modifier>>();

    // The diff is filled in update when we compare the new domObject with the
    // old one, and the diff are consumed when we redraw the node.
    private readonly _diff: Record<DomObjectID, DiffDomObject> = {};
    private readonly _rendererTreated = new Set<GenericDomObject>();
    private _domUpdated = new Set<DomObjectID>();

    update(
        updatedNodes: VNode[],
        renderings: Map<VNode, DomObject>,
        locations: Map<DomObject, VNode[]>,
        from: Map<DomObject, Set<VNode | Modifier>>,
        domNodesToRedraw = new Set<Node>(),
    ): void {
        const renderedSet = new Set<DomObject>();
        for (const node of updatedNodes) {
            const rendering = renderings.get(node);
            if (rendering) {
                renderedSet.add(rendering);
            }
        }
        const rendered = [...renderedSet];

        // Found the potential old values (they could become children of the current node).
        // In old values the renderer are may be merge some object, we want to found the
        // children object in old value to campare it with the newest.
        const mapOldIds = new Map<GenericDomObject, Set<DomObjectID>>();
        const domObjects: GenericDomObject[] = [];
        for (const domObject of rendered) {
            if (this._rendererTreated.has(domObject)) {
                continue;
            }
            domObjects.push(domObject);
            let oldObjects = mapOldIds.get(domObject);
            if (!oldObjects) {
                this._addLocations(domObject, locations, from);
                oldObjects = new Set();
                mapOldIds.set(domObject, oldObjects);
            }
            const nodes = this._items.get(domObject);
            for (const linkedNode of nodes) {
                const ids = this._renderedNodes.get(linkedNode);
                if (ids) {
                    for (const id of ids) {
                        if (!oldObjects.has(id)) {
                            const object = this._objects[id].object;
                            this._rendererTreated.delete(object);
                            this._objectIds.delete(object);
                            this._renderedIds.delete(id);
                            oldObjects.add(id);
                        }
                    }
                }
            }
            this._rendererTreated.delete(domObject);
            this._objectIds.delete(domObject);
        }

        // Make diff.
        for (const domObject of domObjects) {
            if (!this._objectIds.has(domObject)) {
                const items = this._items.get(domObject);
                const node = items.find(node => node instanceof AbstractNode) as VNode;
                const oldRefId = this._fromItem.get(node);
                const oldIds = mapOldIds.get(domObject);
                const id = this._diffObject(renderings, domObject, items, mapOldIds);
                this._renderedIds.add(id);
                const parentObject = this._objects[this._objects[id].parent]?.object;
                if (
                    oldRefId !== id ||
                    !parentObject ||
                    !this._rendererTreated.has(parentObject) ||
                    oldIds.size > 1
                ) {
                    // If the rendering change, we must check if we redraw the parent.
                    const ancestorWithRendering = node.ancestor(
                        ancestor => !!this._fromItem.get(ancestor),
                    );
                    if (!updatedNodes.includes(ancestorWithRendering)) {
                        const ancestorObjectId = this._fromItem.get(ancestorWithRendering);
                        if (ancestorObjectId && !this._diff[ancestorObjectId]) {
                            const parentObject = this._objects[ancestorObjectId];
                            const nodes = this._items.get(parentObject.object);
                            mapOldIds.set(parentObject.object, new Set([ancestorObjectId]));
                            this._rendererTreated.delete(parentObject.object);
                            this._diffObject(renderings, parentObject.object, nodes, mapOldIds);
                        }
                    }
                }
            }
        }

        const diffs = Object.values(this._diff);

        // Prepare path for fragment insertion in the dom.
        const objectsPath: Record<DomObjectID, [Element, number][]> = {};
        for (const diff of diffs) {
            const object = this._objects[diff.id];
            const nodes = diff.dom.length ? diff.dom : this._getchildrenDomNodes(diff.id);
            const path: [Element, number][] = [];
            let parent = this._objects[object.parent];
            while (parent && !parent.object.tag) {
                parent = this._objects[parent.parent];
            }
            if (!parent) {
                let domNode = nodes[0];
                while (domNode && domNode.parentElement && domNode !== document.body) {
                    path.push([
                        domNode.parentElement,
                        [].indexOf.call(domNode.parentElement.childNodes, domNode),
                    ]);
                    domNode = domNode.parentElement;
                }
            }
            objectsPath[diff.id] = path;
        }

        // Select removed objects.
        const removeObjects: DomObjectID[] = [];
        for (const diff of diffs) {
            for (const id of diff.removedChildren) {
                const object = this._objects[id];
                if (!object.parent) {
                    removeObjects.push(id);
                }
            }
        }
        for (const id of removeObjects) {
            const object = this._objects[id];
            if (!object.parent && removeObjects.includes(id)) {
                object.parent = null;
                for (const childId of object.children) {
                    const child = this._objects[childId];
                    if (
                        (!child.parent || child.parent === id) &&
                        !removeObjects.includes(childId)
                    ) {
                        removeObjects.push(childId);
                    }
                }
            }
        }

        // Remove referencies to removed objects.
        const allOldDomNodes: Node[] = [];
        for (const id of removeObjects) {
            const old = this._objects[id];
            if (typeof old.object.detach === 'function') {
                old.object.detach(...old.dom);
            }
            for (const node of this._locations.get(old.object) || []) {
                if (this._fromItem.get(node) === id) {
                    this._fromItem.delete(node);
                }
            }
            for (const node of this._items.get(old.object) || []) {
                const ids = this._renderedNodes.get(node);
                if (ids && ids.has(id)) {
                    this._renderedNodes.delete(node);
                }
            }
            if (old.dom) {
                for (const domNode of old.dom) {
                    if (this._fromDom.get(domNode) === id) {
                        this._fromDom.delete(domNode);
                        if (domNode instanceof Element) {
                            domNode.remove();
                        } else {
                            allOldDomNodes.push(domNode);
                        }
                    }
                }
            }
            delete this._diff[id];
            delete this._objects[id];
            this._renderedIds.delete(id);
            this._items.delete(old.object);
            this._locations.delete(old.object);
            this._rendererTreated.delete(old.object);
            const i = diffs.findIndex(diff => diff.id === id);
            if (i !== -1) {
                diffs.splice(i, 1);
            }
        }

        // Unvalidate object linked to domNodesToRedraw;
        for (const domNode of domNodesToRedraw) {
            const id = this._fromDom.get(domNode);
            if (id) {
                if (this._diff[id]) {
                    this._diff[id].askCompleteRedrawing = true;
                } else if (this._objects[id]) {
                    const object = this._objects[id];
                    const domObject = object.object;
                    if (typeof domObject.detach === 'function') {
                        domObject.detach(...object.dom);
                    }
                    this._diff[id] = {
                        id: id,
                        attributes: {},
                        style: {},
                        classList: {},
                        dom: object.dom,
                        parentDomNode: object.parentDomNode,
                        removedChildren: [],
                        askCompleteRedrawing: true,
                    };
                    diffs.push(this._diff[id]);
                }
            }
            allOldDomNodes.push(domNode);
            allOldDomNodes.push(...domNode.childNodes);
        }

        // Select all dom nodes.
        for (const diff of diffs) {
            allOldDomNodes.push(...diff.dom);
        }

        // Sort the diff by ancestors.
        diffs.sort((da, db) => {
            let aLen = 0;
            let a = this._objects[da.id];
            while (a?.parent) {
                aLen++;
                a = this._objects[a.parent];
            }
            let bLen = 0;
            let b = this._objects[db.id];
            while (b?.parent) {
                bLen++;
                b = this._objects[b.parent];
            }
            return aLen - bLen;
        });

        // Redraw all objects.
        const objectToInsert: DomObjectID[] = [];
        for (const diff of diffs) {
            if (this._updateDom(diff.id)) {
                objectToInsert.push(diff.id);
            }
        }

        // Insert object dom nodes which don't have direct object with nodeName
        // and not added by the updateDom because his parent have no diff.
        for (const id of objectToInsert) {
            const path = objectsPath[id] || [];
            const item = this._objects[id];
            let parent = this._objects[item.parent] || item;
            while (!parent.object.tag && parent.parent) {
                parent = this._objects[parent.parent];
            }
            const parentDomNode = parent.dom[0] as Element;
            const domNodes: Node[] = [];
            for (const childId of parent.children) {
                domNodes.push(...this._getDomChild(childId, parentDomNode));
            }

            if (domNodes.length) {
                if (parent !== item && parent.object.tag) {
                    this._insertDomChildren(domNodes, parentDomNode, parentDomNode.firstChild);
                } else {
                    let parentDomNode: Element;
                    let firstDomNode: Node;
                    while (!parentDomNode && path.length) {
                        const pathItem = path.shift();
                        const isAvailableParent =
                            pathItem[0].ownerDocument.contains(pathItem[0]) &&
                            !domNodes.find(
                                domNode => pathItem[0] === domNode || domNode.contains(pathItem[0]),
                            );
                        if (isAvailableParent) {
                            parentDomNode = pathItem[0];
                            firstDomNode = parentDomNode.childNodes[pathItem[1]];
                        }
                    }
                    if (parentDomNode) {
                        this._insertDomChildren(domNodes, parentDomNode, firstDomNode);
                    }
                }
            }
        }

        // Clean/remove unused dom nodes.
        for (const domNode of allOldDomNodes) {
            if (!this._fromDom.get(domNode) && domNode.parentNode) {
                domNode.parentNode.removeChild(domNode);
            }
        }

        // Call attach methods for the changed domNodes.
        for (const id of this._domUpdated) {
            const object = this._objects[id];
            if (typeof object?.object.attach === 'function') {
                object.object.attach(...object.dom);
            }
        }
        this._domUpdated.clear();
    }

    /**
     * Return the VNodes linked in renderng to the given VNode.
     *
     * @param node
     */
    getRenderedWith(node: VNode | Modifier): Array<VNode | Modifier> {
        const id = this._fromItem.get(node);
        if (id) {
            const object = this._objects[id];
            const locations = this._locations.get(object.object);
            return [...(locations.length ? locations : this._items.get(object.object))];
        }
        return [];
    }

    /**
     * Return the VNode(s) corresponding to the given DOM Node.
     *
     * @param domNode
     */
    fromDom(domNode: Node): VNode[] {
        let object: DomObjectMapping;
        const nodes: VNode[] = [];
        while (!object && domNode) {
            object = this._objects[this._fromDom.get(domNode)];
            const locations = object && this._locations.get(object.object);
            const items = object && (locations.length ? locations : this._items.get(object.object));
            if (items?.length) {
                for (const item of items) {
                    if (item instanceof AbstractNode) {
                        nodes.push(item);
                    }
                }
            } else {
                if (domNode.previousSibling) {
                    domNode = domNode.previousSibling;
                } else {
                    domNode = domNode.parentNode;
                }
            }
        }
        return nodes;
    }

    /**
     * Return the DOM Node corresponding to the given VNode.
     *
     * @param node
     */
    toDom(node: VNode | Modifier): Node[] {
        const id = this._fromItem.get(node);
        const object = this._objects[id];
        if (!object) {
            return [];
        } else if (object.dom.length) {
            return [...object.dom];
        } else {
            return this._getchildrenDomNodes(id);
        }
    }

    /**
     * Return a position in the VNodes as a tuple containing a reference
     * node and a relative position with respect to this node ('BEFORE' or
     * 'AFTER'). The position is always given on the leaf.
     *
     * @param container
     * @param offset
     */
    locate(domNode: Node, domOffset: number): Point {
        let forceAfter = false;
        let forcePrepend = false;
        let container = domNode;
        let offset = domOffset;

        // When targetting the end of a node, the DOM gives an offset that is
        // equal to the length of the container. In order to retrieve the last
        // descendent, we need to make sure we target an existing node, ie. an
        // existing index.
        if (!isTextNode(domNode) && offset >= nodeLength(container)) {
            forceAfter = true;
            offset = container.childNodes.length - 1;
            while (container.childNodes.length) {
                container = container.childNodes[offset];
                offset = container.childNodes.length - 1;
            }
        }

        // We targetting the deepest.
        while (container.childNodes[offset]) {
            if (forceAfter) {
                container = container.childNodes[nodeLength(container) - 1];
                offset = nodeLength(container) - 1;
            } else {
                container = container.childNodes[offset];
                offset = 0;
            }
        }

        // Search to domObject coresponding to the dom element.
        let object: DomObjectMapping;
        while (!object) {
            const id = this._fromDom.get(container);
            if (id) {
                object = this._objects[id];
            } else if (container.previousSibling) {
                forceAfter = true;
                container = container.previousSibling;
                offset = nodeLength(container) - 1;
            } else {
                forcePrepend = true;
                offset = [].indexOf.call(container.parentNode.childNodes, container);
                container = container.parentNode;
            }
        }

        while (object.children[offset]) {
            const childId = object.children[offset];
            object = this._objects[childId];
            if (forceAfter && this._locations.get(object.object).length) {
                offset = this._locations.get(object.object).length - 1;
            } else {
                offset = 0;
            }
        }

        // For domObjectText, add the previous text length as offset.
        if (object.object.text && isTextNode(domNode)) {
            const texts = object.dom as Text[];
            let index = texts.indexOf(domNode);
            while (index > 0) {
                index--;
                offset += texts[index].textContent.length;
            }
        }

        let objectChild = object;
        while (!this._locations.get(object.object).length) {
            const parent = this._objects[object.parent];
            const index = parent.children.indexOf(object.id);
            if (index > 0) {
                object = this._objects[parent.children[index - 1]];
                offset = object.children.length - 1;
                const locations = this._locations.get(object.object);
                if (locations.length) {
                    return [locations[locations.length - 1], RelativePosition.AFTER];
                }
            } else {
                offset = parent.children.indexOf(objectChild.id);
                object = parent;
                objectChild = object;
                forcePrepend = true;
                const locations = this._locations.get(parent.object);
                if (locations.length === 1) {
                    offset = 0;
                    if (offset > parent.children.length / 2) {
                        forceAfter = true;
                    }
                }
            }
        }

        const locations = this._locations.get(object.object);
        if (!locations[offset]) {
            return [locations[locations.length - 1], RelativePosition.AFTER];
        } else if (forcePrepend && locations[offset] instanceof ContainerNode) {
            return [locations[offset], RelativePosition.INSIDE];
        } else if (forceAfter) {
            return [locations[offset], RelativePosition.AFTER];
        } else {
            return [locations[offset], RelativePosition.BEFORE];
        }
    }

    /**
     * Clear the map of all correspondances.
     *
     */
    clear(): void {
        for (const objectMap of Object.values(this._objects)) {
            if (typeof objectMap.object.detach === 'function') {
                objectMap.object.detach(...objectMap.dom);
            }
        }
        for (const fromDom of this._fromDom) {
            const domNode = fromDom[0];
            if (domNode.parentNode) {
                domNode.parentNode.removeChild(domNode);
            }
        }
        this._objects = {};
        this._fromItem.clear();
        this._fromDom.clear();
        this._renderedNodes.clear();
        this._renderedIds.clear();
        this._objectIds.clear();
        this._locations.clear();
        this._items.clear();
        this._rendererTreated.clear();
        this._domUpdated.clear();
    }

    /**
     * Return the location in the DOM corresponding to the location in the
     * VDocument of the given VNode. The location in the DOM is expressed as a
     * tuple containing a reference Node and a relative position with respect to
     * the reference Node.
     *
     * @param node
     */
    getLocations(node: VNode): DomPoint {
        let reference = node.previousSibling();
        let position = RelativePosition.AFTER;
        if (reference) {
            reference = reference.lastLeaf();
        } else {
            reference = node.nextSibling();
            position = RelativePosition.BEFORE;
            if (reference) {
                reference = reference.firstLeaf();
            }
        }
        if (!reference) {
            reference = node.parent;
            position = RelativePosition.INSIDE;
            if (!reference) {
                return;
            }
        }

        let object: DomObjectMapping;
        let locations: VNode[];

        // use the location
        let domNodes: Node[];
        const alreadyCheck = new Set<VNode>();
        while (!domNodes && reference) {
            alreadyCheck.add(reference);
            const ids = this._renderedNodes.get(reference);
            if (ids) {
                for (let id of ids) {
                    object = this._objects[id];
                    locations = this._locations.get(object.object);
                    if (!locations.includes(reference)) {
                        let hasLocate: number;
                        const ids = [id];
                        while (ids.length && (!hasLocate || position === RelativePosition.AFTER)) {
                            const id = ids.pop();
                            const child = this._objects[id];
                            if (this._locations.get(child.object).includes(reference)) {
                                hasLocate = id;
                            }
                            if (child.children) {
                                ids.push(...[...child.children].reverse());
                            }
                        }
                        id = hasLocate;
                        object = this._objects[id];
                        locations = this._locations.get(object.object);
                    }
                    if (object.dom.length) {
                        if (!domNodes) domNodes = [];

                        domNodes.push(...object.dom);
                    } else {
                        if (!domNodes) domNodes = [];

                        domNodes.push(...this._getchildrenDomNodes(id));
                    }
                }
            }

            if (!domNodes?.length || !domNodes[0].parentNode) {
                const next = reference.nextLeaf();
                if (next && !alreadyCheck.has(next)) {
                    position = RelativePosition.BEFORE;
                    reference = next;
                } else {
                    position = RelativePosition.INSIDE;
                    reference = reference.parent;
                }
                domNodes = null;
            }
        }

        let domNode: Node;
        let offset = locations.lastIndexOf(reference);

        if (domNodes[0].nodeType === Node.TEXT_NODE) {
            let index = 0;
            while (offset >= domNodes[index].textContent.length) {
                offset -= domNodes[index].textContent.length;
                index++;
            }
            domNode = domNodes[index];
        } else {
            domNode = domNodes[offset];
            if (position === RelativePosition.INSIDE) {
                offset = 0;
            } else {
                // Char nodes have their offset in the corresponding text nodes
                // registered in the map via `set` but void nodes don't. Their
                // location need to be computed with respect to their parents.
                const container = domNode.parentNode;
                offset = Array.prototype.indexOf.call(container.childNodes, domNode);
                domNode = container;
            }
        }
        if (position === RelativePosition.AFTER) {
            // Increment the offset to be positioned after the reference node.
            offset += 1;
        }

        return [domNode, offset];
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    // eslint-disable-next-line max-params
    private _diffObject(
        nodeToDomObject: Map<VNode | Modifier, GenericDomObject>,
        domObject: GenericDomObject,
        fromNodes: Array<VNode | Modifier>,
        mapOldIds?: Map<GenericDomObject, Set<DomObjectID>>,
        childrenMapping?: Map<GenericDomObject, DomObjectID>,
    ): DomObjectID {
        let oldIds = mapOldIds.get(domObject);

        const items = this._items.get(domObject);
        if (!oldIds) {
            oldIds = new Set();
            if (items) {
                for (const item of items) {
                    const ids = this._renderedNodes.get(item);
                    if (ids) {
                        for (const id of ids) {
                            if (!this._diff[id]) {
                                oldIds.add(id);
                            }
                        }
                    }
                }
            }
        }

        let hasChanged = false;
        if (oldIds.size) {
            for (const id of [...oldIds]) {
                const old = this._objects[id];
                if (!old || this._rendererTreated.has(old.object)) {
                    oldIds.delete(id);
                }
            }
            if (!childrenMapping) {
                childrenMapping = this._diffObjectAssociateChildrenMap(domObject, oldIds);
            }
            hasChanged = oldIds.size !== 1;
        }

        let id = childrenMapping?.get(domObject);

        if (id) {
            oldIds.add(id);
        }
        let old = this._objects[id];

        if (old && !this._rendererTreated.has(old.object)) {
            childrenMapping.delete(domObject);
            this._rendererTreated.add(old.object);
        } else {
            old = null;
            hasChanged = true;
            diffObjectId++;
            id = diffObjectId;
        }

        this._rendererTreated.add(domObject);
        this._objectIds.set(domObject, id);

        const removedChildren: DomObjectID[] = [];
        const diffAttributes: Record<string, string | null> = {};
        const diffStyle: Record<string, string | null> = {};
        const diffClassList: Record<string, boolean> = {};

        const nodes: VNode[] = this._locations.get(domObject) || [];
        const attributes: DomObjectAttributes = {};
        const children: DomObjectID[] = [];
        let domNodes: Node[] = [];
        let allDomNodes: Node[] = [];
        let domNodesChildren: [Node, RelativePosition, DomObjectID[]][];
        let domNodesChildrenProcess: [Node, RelativePosition, VNode[]][];

        const oldChildren = old?.children || [];
        const newChildren = domObject.children || [];

        if (domObject.dom) {
            hasChanged = true;
            domNodes = domObject.dom;
            domNodesChildrenProcess = [];

            const placeholders: Record<string, Element> = {};
            let havePlaceholder = false;

            for (const domNode of domNodes) {
                if (domNode instanceof Element) {
                    if (nodeName(domNode) === 'JW-DOMOBJECT-VNODE') {
                        havePlaceholder = true;
                        placeholders[domNode.id] = domNode;
                    } else {
                        const childNodes = domNode.shadowRoot
                            ? domNode.shadowRoot.querySelectorAll('jw-domobject-vnode')
                            : domNode.querySelectorAll('jw-domobject-vnode');
                        for (const dom of childNodes) {
                            havePlaceholder = true;
                            placeholders[dom.id] = dom;
                        }
                    }
                }
            }

            if (havePlaceholder) {
                const placeholderVNodes: [Element, VNode][] = [];
                const allNodes = fromNodes.filter(item => item instanceof AbstractNode) as VNode[];
                for (const node of allNodes) {
                    allNodes.push(...node.childVNodes);
                }
                for (const node of allNodes) {
                    const placeholder = placeholders[node.id];
                    if (placeholder) {
                        placeholderVNodes.push([placeholder, node]);
                    }
                }
                placeholderVNodes.reverse();
                for (const [placeholder, node] of placeholderVNodes) {
                    let child: [Node, RelativePosition, VNode[]];
                    let index = domNodes.indexOf(placeholder);
                    if (index !== -1) {
                        if (index !== domNodes.length - 1) {
                            // Eg: [PLACEHOLDER, PLACEHOLDER, <div></div>]
                            child = [domNodes[index + 1], RelativePosition.BEFORE, [node]];
                        } else {
                            // Eg: [<div></div>, PLACEHOLDER, PLACEHOLDER]
                            while (!child && index > 0) {
                                index--;
                                if (nodeName(domNodes[index]) !== 'JW-DOMOBJECT-VNODE') {
                                    child = [domNodes[index], RelativePosition.AFTER, [node]];
                                }
                            }
                        }
                        domNodes.splice(domNodes.indexOf(placeholder), 1);
                    } else if (placeholder.nextSibling) {
                        // Eg: [<div>PLACEHOLDER<i></i></div>]
                        child = [placeholder.nextSibling, RelativePosition.BEFORE, [node]];
                    } else if (placeholder.parentNode) {
                        // Eg: [<div><i></i>PLACEHOLDER</div>]
                        child = [placeholder.parentNode, RelativePosition.INSIDE, [node]];
                    }
                    if (child) {
                        const next = domNodesChildrenProcess.find(
                            next => next[0] === child[0] && next[1] === child[1],
                        );
                        if (next) {
                            next[2].unshift(node);
                        } else {
                            domNodesChildrenProcess.push(child);
                        }
                    }
                    newChildren.push(node);
                    placeholder.remove();
                }
                if (!domNodesChildrenProcess.length) {
                    // Every domNodes are placeholder. It's like children only.
                    domNodesChildrenProcess = null;
                }
            }

            // Add all nodes as mapping to avoid association by children.
            allDomNodes = [];
            const allNodes: Node[] = [...domNodes];
            while (allNodes.length) {
                const domNode = allNodes.pop();
                allDomNodes.push(domNode);
                if (domNode instanceof Element) {
                    allNodes.push(...domNode.childNodes);
                }
            }
        }

        for (const child of newChildren) {
            let childId: DomObjectID;
            if (child instanceof AbstractNode) {
                const domObject = nodeToDomObject.get(child);
                let oldChildId = this._objectIds.get(domObject) || this._fromItem.get(child);
                if (!oldChildId) {
                    const oldChildIds = this._renderedNodes.get(child);
                    if (oldChildIds?.size) {
                        oldChildId = [...oldChildIds][0];
                    }
                }
                const nodes = this._items.get(domObject);
                if (this._rendererTreated.has(domObject)) {
                    childId = oldChildId;
                } else if (!domObject) {
                    if (oldChildId) {
                        childId = oldChildId;
                    } else {
                        console.error('No rendering for the node(' + child.id + '): ' + child.name);
                    }
                } else {
                    childId = this._diffObject(nodeToDomObject, domObject, nodes, mapOldIds);
                    this._renderedIds.add(childId);
                }
            } else if (this._rendererTreated.has(child)) {
                childId = this._objectIds.get(child);
            } else {
                childId = this._diffObject(
                    nodeToDomObject,
                    child,
                    nodes,
                    mapOldIds,
                    childrenMapping,
                );
            }

            if (childId) {
                this._objects[childId].parent = id;
                if (!children.includes(childId)) {
                    children.push(childId);
                }
            }
        }

        if (children.join() !== oldChildren.join()) {
            hasChanged = true;
            for (const childId of oldChildren) {
                if (!children.includes(childId)) {
                    if (this._objects[childId].parent === id) {
                        this._objects[childId].parent = null;
                    }
                    removedChildren.push(childId);
                }
            }
        }

        if (domNodesChildrenProcess) {
            domNodesChildren = [];
            for (const [ref, position, nodes] of domNodesChildrenProcess) {
                const nodeIds: DomObjectID[] = nodes
                    .map(node => this._fromItem.get(node))
                    .filter(id => id);
                domNodesChildren.push([ref, position, nodeIds]);
            }
        }

        if (!domNodes.length && domObject.tag) {
            if (!old || domObject.tag !== old.object.tag) {
                hasChanged = true;
            }
            // Update attributes.
            const newAttributes: DomObjectAttributes = domObject.attributes || {};
            const oldAttributes: DomObjectAttributes = old?.object.attributes || {};

            for (const name in oldAttributes) {
                if (!newAttributes[name]) {
                    hasChanged = true;
                    if (name === 'style') {
                        for (const key in oldAttributes[name]) {
                            diffStyle[key] = null;
                        }
                    } else if (name === 'class') {
                        for (const className of oldAttributes[name]) {
                            diffClassList[className] = false;
                        }
                    } else {
                        diffAttributes[name] = null;
                    }
                }
            }
            for (const name in newAttributes) {
                if (name === 'style') {
                    const newStyle = newAttributes[name];
                    const oldStyle = oldAttributes[name];
                    if (oldStyle) {
                        for (const key in oldStyle) {
                            if (!newStyle[key]) {
                                hasChanged = true;
                                diffStyle[key] = null;
                            }
                        }
                    }
                    for (const key in newStyle) {
                        if (newStyle[key] !== oldStyle?.[key]) {
                            hasChanged = true;
                            diffStyle[key] = newStyle[key];
                        }
                    }
                } else if (name === 'class') {
                    const newClassNames = newAttributes[name];
                    const oldClassNames = oldAttributes[name];
                    if (oldClassNames) {
                        for (const className of oldClassNames) {
                            if (className && !newClassNames.has(className)) {
                                hasChanged = true;
                                diffClassList[className] = false;
                            }
                        }
                    }
                    for (const className of newClassNames) {
                        if (className && !oldClassNames?.has(className)) {
                            hasChanged = true;
                            diffClassList[className] = true;
                        }
                    }
                } else {
                    const value = newAttributes[name] as string;
                    if (value !== oldAttributes[name]) {
                        hasChanged = true;
                        diffAttributes[name] = value;
                    }
                }
                attributes[name] = newAttributes[name];
            }
        } else if (!domNodes.length && domObject.text) {
            if (!old || domObject.text !== old.object.text) {
                hasChanged = true;
            }
        } else if (!domNodes.length && old?.dom.length) {
            hasChanged = true;
        }

        // remove old referencies
        const oldIdsToRelease: DomObjectID[] = [];
        if (items && oldIds.size) {
            oldIdsToRelease.push(...oldIds);
        }
        if (old) {
            oldIdsToRelease.push(old.id);
            if (typeof old.object.detach === 'function') {
                old.object.detach(...old.dom);
            }
        }
        for (const id of oldIdsToRelease) {
            const old = this._objects[id];
            for (const item of this._items.get(old.object)) {
                const ids = this._renderedNodes.get(item);
                if (ids && ids.has(id)) {
                    this._renderedNodes.delete(item);
                }
            }
        }

        // Add new referencies.
        for (const node of nodes) {
            this._fromItem.set(node, id);
        }
        if (items) {
            for (const item of [...items, ...this._items.get(domObject)]) {
                let ids = this._renderedNodes.get(item);
                if (!ids) {
                    ids = new Set();
                    this._renderedNodes.set(item, ids);
                }
                ids.add(id);
            }
        }
        if (!this._locations.get(domObject)) {
            this._locations.set(domObject, []);
        }
        this._objects[id] = {
            id: id,
            object: domObject,
            parent: old?.parent,
            children: children,
            dom: domNodes,
            domNodes: allDomNodes,
            domNodesChildren: domNodesChildren,
            parentDomNode: old?.parentDomNode,
        };

        if (hasChanged) {
            const oldDomNodes = old?.dom ? [...old.dom] : [];
            if (oldIds) {
                for (const id of oldIds) {
                    for (const domNode of this._objects[id].dom) {
                        if (!oldDomNodes.includes(domNode)) {
                            oldDomNodes.push(domNode);
                        }
                    }
                }
            }
            this._diff[id] = {
                id: id,
                attributes: diffAttributes,
                style: diffStyle,
                classList: diffClassList,
                dom: oldDomNodes,
                parentDomNode: old?.parentDomNode,
                removedChildren: removedChildren,
            };
        } else {
            this._objects[id].dom = old.dom;
            if (typeof domObject.attach === 'function') {
                domObject.attach(...old.dom);
            }
        }
        return id;
    }
    private _diffObjectAssociateChildrenMap(
        objectA: GenericDomObject,
        objectIdsB: Set<DomObjectID>,
    ): Map<GenericDomObject, DomObjectID> {
        const map = new Map<GenericDomObject, DomObjectID>();
        if (!objectIdsB.size) {
            return map;
        }
        const allChildrenA: GenericDomObject[] = [objectA];
        for (const domObject of allChildrenA) {
            if (domObject.children) {
                for (const child of domObject.children) {
                    if (!(child instanceof AbstractNode)) {
                        allChildrenA.push(child);
                    }
                }
            }
        }
        const allChildrenB: DomObjectID[] = [...objectIdsB];
        for (const id of allChildrenB) {
            const objB = this._objects[id];
            this._rendererTreated.delete(objB.object);
            if (objB?.children) {
                for (const id of objB.children) {
                    if (this._objects[id] && !this._renderedIds.has(id)) {
                        allChildrenB.push(id);
                    }
                }
            }
        }

        const mapRatios = this._diffObjectAssociateChildren(allChildrenA, allChildrenB);
        mapRatios.sort((a, b) => b[0] - a[0]);

        const used = new Set<DomObjectID>();
        for (const [, childRef, id] of mapRatios) {
            if (!map.get(childRef) && !used.has(id)) {
                map.set(childRef, id);
                used.add(id);
            }
        }
        return map;
    }
    private _diffObjectAssociateChildren(
        arrayA: GenericDomObject[],
        arrayB: DomObjectID[],
    ): [number, GenericDomObject, DomObjectID][] {
        const mapRatios: [number, GenericDomObject, DomObjectID][] = [];
        for (const objectA of arrayA) {
            for (const idB of arrayB) {
                const itemB = this._objects[idB];
                const objectB = itemB.object;
                let currentRatio = 0;
                if (objectA.tag) {
                    if (objectA.tag === objectB.tag) {
                        const attrA: DomObjectAttributes = objectA.attributes || {};
                        const attrB: DomObjectAttributes = objectB.attributes;

                        // add some points for attributes matching
                        let max = 0;
                        let same = 0;
                        for (const name in attrA) {
                            if (name === 'style') {
                                const styleA = attrA[name];
                                const styleB = attrB?.[name];
                                if (styleA) {
                                    for (const key in styleA) {
                                        max++;
                                        if (styleA[key] === styleB?.[key]) {
                                            same++;
                                        }
                                    }
                                }
                            } else if (name === 'class') {
                                const classA = attrA[name];
                                const classB = attrB?.[name];
                                if (classA) {
                                    for (const c of classA) {
                                        max++;
                                        if (classB?.has(c)) {
                                            same++;
                                        }
                                    }
                                }
                            } else {
                                max++;
                                if (attrA[name] === attrB?.[name]) {
                                    same++;
                                }
                            }
                        }
                        for (const name in attrB) {
                            if (name === 'style') {
                                const styleA = attrA?.[name];
                                const styleB = attrB[name];
                                if (styleB) {
                                    for (const key in styleB) {
                                        if (!styleA || !(key in styleA)) {
                                            max++;
                                        }
                                    }
                                }
                            } else if (name === 'class') {
                                const classA = attrA?.[name];
                                const classB = attrB[name];
                                if (classB) {
                                    for (const c of classB) {
                                        if (!classA?.has(c)) {
                                            max++;
                                        }
                                    }
                                }
                            } else if (!attrA || !(name in attrA)) {
                                max++;
                            }
                        }

                        currentRatio = 1 + same / (max || 1);
                    }
                } else if (objectA.text) {
                    if (objectB.text) {
                        currentRatio = 1;
                    }
                } else if (objectA.dom) {
                    if (itemB.dom.length && !objectB.tag && !objectB.text) {
                        currentRatio = 1;
                    }
                } else if (objectA.children) {
                    if (itemB.children && !objectB.text && !objectB.tag) {
                        currentRatio = 1;
                    }
                }
                if (currentRatio >= 1) {
                    // The best have at leat on node in common or the twice does not have node.
                    const itemsA = this._items.get(objectA);
                    const itemsB = this._items.get(objectB);
                    // Some points for children nodes.
                    let matchNode = 0;
                    let maxNode = 0;
                    for (const node of itemsA) {
                        if (node instanceof AbstractNode) {
                            maxNode++;
                            if (itemsB.includes(node)) {
                                matchNode++;
                            }
                        }
                    }
                    for (const node of itemsB) {
                        if (node instanceof AbstractNode) {
                            if (!itemsB.includes(node)) {
                                maxNode++;
                            }
                        }
                    }
                    const nodeRatio = maxNode ? matchNode / maxNode : 1;

                    if (nodeRatio > 0) {
                        currentRatio += nodeRatio;

                        // The best candidate must have the most common located nodes.
                        const locA = this._locations.get(objectA);
                        const locB = this._locations.get(objectB);
                        let match = 0;
                        let max = 0;
                        for (const node of locA) {
                            max++;
                            if (locB.includes(node)) {
                                match++;
                            }
                        }
                        for (const node of locB) {
                            if (!locA.includes(node)) {
                                max++;
                            }
                        }
                        currentRatio += max ? match / max : 0;

                        // The best candidate must have the most common modifiers.
                        let matchModifier = 0;
                        let maxModifier = 0;
                        for (const node of itemsA) {
                            if (!(node instanceof AbstractNode)) {
                                maxModifier++;
                                if (itemsB.includes(node)) {
                                    matchModifier++;
                                }
                            }
                        }
                        for (const node of itemsB) {
                            if (!(node instanceof AbstractNode)) {
                                if (!itemsB.includes(node)) {
                                    maxModifier++;
                                }
                            }
                        }
                        currentRatio += (maxModifier ? matchModifier / maxModifier : 0) / 10;

                        mapRatios.push([currentRatio, objectA, idB]);
                    }
                }
            }
        }
        return mapRatios;
    }
    private _addLocations(
        domObject: GenericDomObject,
        locations: Map<GenericDomObject, VNode[]>,
        from: Map<GenericDomObject, Set<VNode | Modifier>>,
    ): Array<VNode | Modifier> {
        const allItems: Array<VNode | Modifier> = [];
        const items = from.get(domObject);
        if (items) {
            for (const item of items) {
                if (!allItems.includes(item)) {
                    allItems.push(item);
                }
            }
        }

        const nodes = locations.get(domObject);
        if (nodes) {
            this._locations.set(domObject, nodes ? Array.from(nodes) : []);
            for (const node of nodes) {
                if (!allItems.includes(node)) {
                    allItems.push(node);
                }
            }
        } else {
            this._locations.set(domObject, []);
        }

        if (domObject.children) {
            for (const index in domObject.children) {
                const child = domObject.children[index];
                if (!(child instanceof AbstractNode)) {
                    for (const node of this._addLocations(child, locations, from)) {
                        allItems.push(node);
                    }
                }
            }
        }
        this._items.set(domObject, allItems);
        return allItems;
    }
    private _updateDom(id: DomObjectID): boolean {
        const diff = this._diff[id];
        if (!diff) {
            return;
        }
        const object = this._objects[id];
        const domObject = object.object;
        let newNode = false;

        if (domObject.tag) {
            let domNode = this._getAvailableElement(id);

            if (domNode && !domObject.shadowRoot !== !domNode.shadowRoot) {
                domNode = null;
            }
            let attributes: DomObjectAttributes;
            if (domNode) {
                if (diff.askCompleteRedrawing) {
                    for (const attr of domNode.attributes) {
                        const value = domObject.attributes[attr.name];
                        if (typeof value === 'undefined') {
                            domNode.removeAttribute(attr.name);
                        }
                    }
                    attributes = domObject.attributes;
                } else {
                    attributes = diff.attributes;
                }
                if (!diff.askCompleteRedrawing) {
                    for (const name in diff.style) {
                        setStyle(domNode, name, diff.style[name] || '');
                    }
                    for (const name in diff.classList) {
                        if (diff.classList[name]) {
                            domNode.classList.add(name);
                        } else {
                            domNode.classList.remove(name);
                        }
                    }
                }
            } else {
                domNode = document.createElement(domObject.tag);
                attributes = domObject.attributes;
                if (domObject.shadowRoot) {
                    domNode.attachShadow({ mode: 'open' });
                }
            }

            for (const name in attributes) {
                if (name === 'style') {
                    const style = attributes[name];
                    for (const name in style) {
                        setStyle(domNode, name, style[name]);
                    }
                    // Now we set the attribute again to keep order.
                    const styleInline = domNode.getAttribute('style');
                    if (styleInline) {
                        domNode.setAttribute('style', styleInline);
                    }
                } else if (name === 'class') {
                    const classList = attributes[name];
                    for (const className of classList) {
                        domNode.classList.add(className);
                    }
                    // Now we set the attribute again to keep order.
                    const classInline = domNode.getAttribute('class');
                    if (classInline) {
                        domNode.setAttribute('class', classInline);
                    }
                } else {
                    const value = attributes[name];
                    if (typeof value === 'string') {
                        domNode.setAttribute(name, value);
                    } else if (!value) {
                        domNode.removeAttribute(name);
                    }
                }
            }

            if (domNode.getAttribute('class') === '') {
                domNode.removeAttribute('class');
            }
            if (domNode.getAttribute('style') === '') {
                domNode.removeAttribute('style');
            }
            object.dom = [domNode];
        } else if (domObject.text) {
            object.dom = this._redrawAndAssociateText(id);
        } else if (object.domNodesChildren && object.dom.length) {
            for (const domNode of object.dom) {
                if (this._fromDom.get(domNode) !== id) {
                    this._fromDom.set(domNode, id);
                    newNode = true;
                }
            }
            // Add all nodes as mapping to avoid association by children.
            for (const domNode of object.domNodes) {
                this._fromDom.set(domNode, id);
            }

            // Insert children in the dom which locate with the placeholder.
            for (const [ref, position, childIds] of object.domNodesChildren) {
                if (position === RelativePosition.INSIDE) {
                    const childDomNodes = flat(
                        childIds.map(childId =>
                            this._getDomChild(childId, ref as Element | ShadowRoot),
                        ),
                    );
                    for (const domNode of childDomNodes) {
                        ref.appendChild(domNode);
                    }
                } else {
                    const childDomNodes = flat(
                        childIds.map(childId => this._getDomChild(childId, ref.parentElement)),
                    );
                    if (position === RelativePosition.BEFORE) {
                        for (const domNode of childDomNodes) {
                            ref.parentElement.insertBefore(domNode, ref);
                        }
                    } else if (ref.nextSibling) {
                        const next = ref.nextSibling;
                        for (const domNode of childDomNodes) {
                            ref.parentElement.insertBefore(domNode, next);
                        }
                    } else {
                        ref.parentElement.append(...childDomNodes);
                    }
                }
            }

            // Remove protected mapping.
            for (const domNode of object.domNodes) {
                this._fromDom.delete(domNode);
            }
            for (const domNode of object.dom) {
                this._fromDom.set(domNode, id);
            }

            // TODO remove ?
            let item = diff.dom?.[0];
            const parent = item?.parentNode;
            if (parent) {
                for (const domNode of object.dom) {
                    if (!item) {
                        parent.appendChild(domNode);
                    } else if (domNode !== item) {
                        parent.insertBefore(domNode, item);
                    } else {
                        item = domNode.nextSibling;
                    }
                }
            }
        }

        for (const domNode of diff.dom) {
            if (this._fromDom.get(domNode) === id && !object.dom.includes(domNode)) {
                this._fromDom.delete(domNode);
            }
        }
        for (const domNode of object.dom) {
            if (this._fromDom.get(domNode) !== id || !domNode.parentNode) {
                this._fromDom.set(domNode, id);
                newNode = true;
            }
        }

        if (!object.domNodesChildren && object.children.length) {
            let parentDomNode = object.parentDomNode;
            if (domObject.tag) {
                parentDomNode = object.dom[0] as Element;
                if (domObject.shadowRoot) {
                    parentDomNode = parentDomNode.shadowRoot;
                }
            }
            const domNodes: Node[] = [];
            for (const childId of object.children) {
                domNodes.push(...this._getDomChild(childId, parentDomNode));
            }
            if (domNodes.length) {
                if (domObject.tag) {
                    this._insertDomChildren(domNodes, parentDomNode, parentDomNode.firstChild);
                } else {
                    newNode = true;
                }
            }
        }

        delete this._diff[id];
        this._domUpdated.add(id);

        return newNode;
    }
    private _getDomChild(id: DomObjectID, parentDomNode: Element | ShadowRoot): Node[] {
        // Apply diff for descendents if needed.
        const descendents = [id];
        for (const id of descendents) {
            const descendent = this._objects[id];
            descendent.parentDomNode = parentDomNode;
            if (this._diff[id]) {
                this._updateDom(id);
            } else if (!('tag' in descendent.object) && descendent.children) {
                // Get children if it's a fragment.
                descendents.push(...descendent.children);
            }
        }
        // Get the dom representing this child.
        let domNodes: Node[] = [];
        const child = this._objects[id];
        if (child.dom.length) {
            domNodes = child.dom;
        } else {
            domNodes = this._getchildrenDomNodes(id);
        }
        return domNodes;
    }
    private _redrawAndAssociateText(id: DomObjectID): Text[] {
        const domObject = this._objects[id].object;
        const textContent = domObject.text;
        let textNodes = this._getAvailableTextNodes(id) as Text[];
        if (textNodes) {
            const chars: [string, Text, number][] = [];
            for (const textNode of textNodes) {
                const split = textNode.textContent.split('');
                if (split.length) {
                    for (let i = 0; i < split.length; i++) {
                        chars.push([split[i], textNode, i]);
                    }
                } else {
                    chars.push(['', textNode, 0]);
                }
            }

            const len = textContent.length;
            const charLen = chars.length;
            const maxLen = Math.max(len, charLen);

            let index = 0;
            let indexFirstChange: number = null; // index from begin
            let indexLastChange: number = null; // index from end
            while ((indexFirstChange === null || indexLastChange === null) && index < maxLen) {
                if (indexFirstChange === null) {
                    const char = textContent[index];
                    const old = chars[index];
                    if (!old || char !== old[0]) {
                        indexFirstChange = index;
                    }
                }
                if (indexLastChange === null) {
                    const char = textContent[len - 1 - index];
                    const old = chars[charLen - 1 - index];
                    if (!old || char !== old[0]) {
                        indexLastChange = index;
                    }
                }
                index++;
            }

            if (indexFirstChange !== null) {
                let textBegin: Text;
                let textEnd: Text;
                let first: string;
                let center: string;
                let last: string;
                const charBegin = chars[indexFirstChange];

                if (charBegin) {
                    textBegin = textEnd = charBegin[1];
                    first = textBegin.textContent.slice(0, charBegin[2]);
                    const charEnd = chars[charLen - indexLastChange];
                    if (indexFirstChange >= len - indexLastChange || !charEnd) {
                        // The indexes of the destination text cross, it is that
                        // the end and the beginning are just. Certain
                        // characters should be removed and replce by the and
                        // of the needed textContent. If there is no ending
                        // change, every ending chars are false and will be
                        // removed and replace by the new ending text.
                        // Please note that you must keep the existing text
                        // nodes. And therefore remove the character in the
                        // text nodes present in the dom.
                        const charEnd = chars[charLen - indexLastChange + 1] || chars[charLen - 1];
                        indexLastChange = charLen;
                        textEnd = charEnd[1];
                        center = '';
                        last = textContent.slice(indexFirstChange);
                    } else {
                        // The indexes, do not cross, so we will add the
                        // missing piece and remove the erroneous characters.
                        textEnd = charEnd[1];
                        last = textEnd.textContent.slice(charEnd[2]);
                        center = textContent.slice(indexFirstChange, len - indexLastChange);
                    }
                } else {
                    // If there is no start of change, this implies that only
                    // characters must be added.
                    const char = chars[indexFirstChange - 1];
                    textBegin = textEnd = char[1];
                    first = textBegin.textContent;
                    center = textContent.slice(indexFirstChange);
                    last = '';
                }

                // Search every text nodes between the begin and end of the
                // changes. This text nodes will be removed.
                const textsBetweenStartEnd: Text[] = [];
                for (let index = indexFirstChange; index < indexLastChange; index++) {
                    const text = chars[index]?.[1];
                    if (
                        text &&
                        text !== textBegin &&
                        text !== textEnd &&
                        !textsBetweenStartEnd.includes(text)
                    ) {
                        textsBetweenStartEnd.push(text);
                    }
                }

                // Update the dom with the minimum of mutations.
                if (textBegin === textEnd) {
                    if (first === '' && center === '' && last === '') {
                        textsBetweenStartEnd.push(textBegin);
                    } else if (textBegin.textContent !== first + center + last) {
                        textBegin.textContent = first + center + last;
                    }
                } else {
                    if (first === '' && center === '') {
                        textsBetweenStartEnd.push(textBegin);
                    } else if (textBegin.textContent !== first + center) {
                        textBegin.textContent = first + center;
                    }
                    if (last === '') {
                        textsBetweenStartEnd.push(textEnd);
                    } else if (textEnd.textContent !== last) {
                        textEnd.textContent = last;
                    }
                }

                // Removes text nodes between the begin and end, and may be
                // remove an other text node, if it's replace by an empty string.
                for (const domNode of textsBetweenStartEnd) {
                    textNodes.splice(textNodes.indexOf(domNode), 1);
                    domNode.parentNode.removeChild(domNode);
                }
            }
        } else {
            textNodes = [document.createTextNode(textContent)];
        }
        return textNodes;
    }
    /**
     * Insert missing domNodes in this element.
     */
    private _insertDomChildren(domNodes: Node[], parentNode: Node, insertBefore: Node): void {
        for (const domNode of domNodes) {
            if (insertBefore) {
                if (insertBefore === domNode) {
                    insertBefore = insertBefore.nextSibling;
                } else {
                    parentNode.insertBefore(domNode, insertBefore);
                }
            } else {
                parentNode.appendChild(domNode);
            }
        }
    }
    private _getAvailableElement(id: DomObjectID): void | HTMLElement {
        const object = this._objects[id];
        const domObject = object.object;
        const tagName = domObject.tag.toUpperCase();
        const diff = this._diff[id];
        if (object.parentDomNode) {
            for (const domNode of object.parentDomNode.childNodes) {
                if (tagName === nodeName(domNode) && this.isAvailableNode(id, domNode)) {
                    return domNode as HTMLElement;
                }
            }
        }
        if (diff) {
            for (const domNode of diff.dom) {
                if (tagName === nodeName(domNode) && this.isAvailableNode(id, domNode)) {
                    return domNode as HTMLElement;
                }
            }
        }
    }
    private _getAvailableTextNodes(id: DomObjectID): void | Text[] {
        const object = this._objects[id];
        const diff = this._diff[id];
        let textNode: Text;
        if (object.parentDomNode) {
            for (const domNode of object.parentDomNode.childNodes) {
                if (isTextNode(domNode) && this.isAvailableNode(id, domNode)) {
                    textNode = domNode;
                }
            }
        }
        if (!textNode && diff) {
            for (const domNode of diff.dom) {
                if (isTextNode(domNode) && this.isAvailableNode(id, domNode)) {
                    textNode = domNode;
                }
            }
        }
        if (textNode) {
            // Get all free text nodes.
            const textNodes = [textNode];
            let text = textNode;
            while (
                text.previousSibling &&
                isTextNode(text.previousSibling) &&
                this.isAvailableNode(id, text.previousSibling)
            ) {
                text = text.previousSibling;
                textNodes.unshift(text);
            }
            text = textNode;
            while (
                text.nextSibling &&
                isTextNode(text.nextSibling) &&
                this.isAvailableNode(id, text.nextSibling)
            ) {
                text = text.nextSibling;
                textNodes.push(text);
            }
            return textNodes;
        }
    }
    /**
     * Check if the domNode are already associate to an other domObject and
     * this object don't need to be redrawed. The additional checking for the
     * diff is't use to associate the domNodecreate by a split from the browser.
     * The browser can add the new domNode after or before the split.
     */
    private isAvailableNode(id: DomObjectID, domNode: Node): boolean {
        const linkedId = this._fromDom.get(domNode);
        if (!linkedId || linkedId === id) {
            return true;
        }
        if (this._diff[linkedId]?.askCompleteRedrawing) {
            // The browser can add the new domNode after or before the split.
            // In this case, there is a change in both elements. In the case of
            // text it is important to keep the dom intact in order to guarantee
            // the operation of the spell checkers. It is also important to keep
            // order for the parents of these texts, but by doing this, we are
            // forced to reset the content, animations may be lost.
            this._diff[id].askCompleteRedrawing = true;
            return true;
        }
    }
    private _getchildrenDomNodes(id: DomObjectID): Node[] {
        const object = this._objects[id];
        const domNodes: Node[] = [];
        const treatedObject: DomObjectID[] = [];
        if (object.children) {
            for (const childId of object.children) {
                const child = this._objects[childId];
                if (child && !treatedObject.includes(childId)) {
                    treatedObject.push(childId);
                    let childDomNodes: Node[];
                    if (child.dom.length) {
                        childDomNodes = child.dom;
                    } else {
                        childDomNodes = this._getchildrenDomNodes(childId);
                    }
                    for (const node of childDomNodes) {
                        if (!domNodes.includes(node)) {
                            domNodes.push(node);
                        }
                    }
                }
            }
        }
        return domNodes;
    }
}
