import { VNode, Point, RelativePosition } from '../../../core/src/VNodes/VNode';
import { nodeName, nodeLength, FlattenUnion } from '../../../utils/src/utils';
import { styleToObject } from '../../../utils/src/Dom';
import { AbstractNode } from '../../../core/src/VNodes/AbstractNode';
import { ContainerNode } from '../../../core/src/VNodes/ContainerNode';
import { DomPoint } from '../../../plugin-dom-layout/src/ui/DomLayoutEngine';
import { DomObject } from '../../../plugin-html/src/DomObjectRenderingEngine';

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
    attributes: Record<string, string | null>;
    style: Record<string, string | null>;
    classList: Record<string, boolean>;
    parentDomNode: Element | ShadowRoot;
    dom: Node[];
    askCompleteRedrawing?: boolean;
};

let diffObjectId = 0;

export class DomReconciliationEngine {
    private _objects: Record<DomObjectID, DomObjectMapping> = {};
    private readonly _fromNode = new Map<VNode, DomObjectID>();
    private readonly _fromDom = new Map<Node, DomObjectID>();
    private readonly _renderedNodes = new Map<VNode, DomObjectID>();
    private readonly _renderedIds = new Set<DomObjectID>();

    private readonly _locations = new Map<GenericDomObject, VNode[]>();
    private readonly _nodes = new Map<GenericDomObject, VNode[]>();

    // The diff is filled in update when we compare the new domObject with the
    // old one, and the diff are consumed when we redraw the node.
    private readonly _diff: Record<DomObjectID, DiffDomObject> = {};
    private _rendererTreated = new Set<GenericDomObject | DomObjectID>();
    private _domUpdated = new Set<DomObjectID>();

    update(
        rendered: Map<VNode, DomObject>,
        locations: Map<DomObject, VNode[]>,
        domNodesToRedraw = new Set<Node>(),
    ): void {
        // Found the potential old values (they could become children of the current node).
        // In old values the renderer are may be merge some object, we want to found the
        // children object in old value to campare it with the newest.
        const unfilterdOldObjectMap = new Map<GenericDomObject, DomObjectID[]>();
        for (const [node, domObject] of rendered) {
            let oldObjects = unfilterdOldObjectMap.get(domObject);
            if (!oldObjects) {
                this._addLocations(domObject, locations, node);
                oldObjects = [];
                unfilterdOldObjectMap.set(domObject, oldObjects);
            }
            const nodes = this._nodes.get(domObject);
            for (const linkedNode of nodes) {
                const id = this._renderedNodes.get(linkedNode);
                if (id && !oldObjects.includes(id)) {
                    oldObjects.push(id);
                }
            }
        }

        // prepare mapping for diff
        const nodeToDomObject = new Map<VNode, GenericDomObject>();
        for (const [node, domObject] of rendered) {
            for (const node of this._nodes.get(domObject)) {
                nodeToDomObject.set(node, domObject);
            }
            // re-instert just after if available but the id can change
            this._renderedIds.delete(this._renderedNodes.get(node));
        }

        // Make diff.
        this._rendererTreated.clear();
        for (const [node, domObject] of rendered) {
            if (!this._rendererTreated.has(domObject)) {
                const oldObjects = unfilterdOldObjectMap.get(domObject);
                const oldRefId = this._fromNode.get(node);
                const parent = this._objects[this._objects[oldRefId]?.parent];
                const id = this._diffObject(nodeToDomObject, domObject, true, oldObjects);
                if (id) {
                    this._renderedIds.add(id);
                    if (oldRefId && parent && id !== oldRefId) {
                        const index = parent.children.indexOf(oldRefId);
                        if (index !== -1) {
                            parent.children.splice(index, 1, id);
                            this._diff[parent.id] = this._diff[parent.id] || {
                                id: parent.id,
                                removedChildren: [],
                                attributes: {},
                                style: {},
                                classList: {},
                                parentDomNode: parent.parentDomNode,
                                dom: parent.object.dom || [],
                            };
                            this._diff[parent.id].removedChildren.push(oldRefId);
                            this._objects[id].parent = parent.id;
                        }
                    }
                }
            }
        }

        const diffs = Object.values(this._diff);

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
            object.parent = null;
            for (const childId of object.children) {
                const child = this._objects[childId];
                if ((!child.parent || child.parent === id) && !removeObjects.includes(childId)) {
                    removeObjects.push(childId);
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
            for (const node of this._locations.get(old.object)) {
                if (this._fromNode.get(node) === id) {
                    this._fromNode.delete(node);
                }
            }
            for (const node of this._nodes.get(old.object)) {
                if (this._renderedNodes.get(node) === id) {
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
        }

        // Unvalidate object linked to domNodesToRedraw;
        for (const domNode of domNodesToRedraw) {
            const id = this._fromDom.get(domNode);
            if (id && !this._diff[id]) {
                const domObject = this._objects[id].object;
                this._diff[id] = {
                    id: id,
                    attributes: {},
                    style: {},
                    classList: {},
                    dom: domObject.dom || [],
                    parentDomNode: this._objects[id].parentDomNode,
                    removedChildren: [],
                    askCompleteRedrawing: true,
                };
                diffs.push(this._diff[id]);
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
            while (a.parent) {
                aLen++;
                a = this._objects[a.parent];
            }
            let bLen = 0;
            let b = this._objects[db.id];
            while (b.parent) {
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

        // Insert object dom nodes who don't have direct object with nodeName
        // and not added by the updateDom because his parent have no diff.
        for (const id of objectToInsert) {
            const item = this._objects[id];
            let parent = this._objects[item.parent];
            while (parent && !parent.object.tag) {
                parent = this._objects[parent.parent];
            }
            if (parent) {
                const parentDomNode = parent.dom[0] as Element;
                const domNodes: Node[] = [];
                for (const childId of parent.children) {
                    domNodes.push(...this._getDomChild(childId, parentDomNode));
                }
                if (domNodes.length) {
                    this._insertDomChildren(domNodes, parentDomNode);
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
    }

    /**
     * Return the VNodes linked in renderng to the given VNode.
     *
     * @param node
     */
    getRenderedWith(node: VNode): VNode[] {
        const id = this._fromNode.get(node);
        if (id) {
            const object = this._objects[id];
            const locations = this._locations.get(object.object);
            return [...(locations.length ? locations : this._nodes.get(object.object))];
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
        let nodes: VNode[];
        while (!object && domNode) {
            object = this._objects[this._fromDom.get(domNode)];
            const locations = object && this._locations.get(object.object);
            nodes = object && (locations.length ? locations : this._nodes.get(object.object));
            if (!nodes?.length) {
                if (domNode.previousSibling) {
                    domNode = domNode.previousSibling;
                } else {
                    domNode = domNode.parentNode;
                }
            }
        }
        return nodes ? [...nodes] : [];
    }

    /**
     * Return the DOM Node corresponding to the given VNode.
     *
     * @param node
     */
    toDom(node: VNode): Node[] {
        const id = this._fromNode.get(node);
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
        if (offset >= nodeLength(container)) {
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
        } else if (forcePrepend && locations[offset].is(ContainerNode)) {
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
        this._fromNode.clear();
        this._renderedNodes.clear();
        this._fromDom.clear();
        this._renderedIds.clear();
        this._rendererTreated.clear();
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
        }

        let object: DomObjectMapping;
        let locations: VNode[];

        // use the location
        let domNodes: Node[];
        while (!domNodes && reference) {
            let id = this._renderedNodes.get(reference);
            if (id) {
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
                    domNodes = object.dom;
                } else {
                    domNodes = this._getchildrenDomNodes(id);
                }
            }

            if (!domNodes?.length || !domNodes[0].parentNode) {
                position = RelativePosition.BEFORE;
                reference = reference.nextLeaf();
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

    private _diffObject(
        nodeToDomObject: Map<VNode, GenericDomObject>,
        domObject: GenericDomObject,
        fromRenderedNode: boolean,
        oldIds: DomObjectID[],
        childrenMapping?: Map<GenericDomObject, DomObjectID>,
    ): DomObjectID {
        this._rendererTreated.add(domObject);

        oldIds = oldIds.filter(id => this._objects[id] && !this._rendererTreated.has(id));
        if (!childrenMapping) {
            childrenMapping = this._diffObjectAssociateChildrenMap(domObject, oldIds);
        }

        let hasChanged = oldIds.length !== 1;
        let id = childrenMapping.get(domObject);
        if (id) {
            childrenMapping.delete(domObject);
            this._rendererTreated.add(id);
        } else {
            hasChanged = true;
            diffObjectId++;
            id = diffObjectId;
        }

        const old = this._objects[id];

        const removedChildren: DomObjectID[] = [];
        const diffAttributes: Record<string, string | null> = {};
        const diffStyle: Record<string, string | null> = {};
        const diffClassList: Record<string, boolean> = {};

        const nodes: VNode[] = this._locations.get(domObject) || [];
        const allNodes: VNode[] = this._nodes.get(domObject) || [];
        let textContent: string;
        let nodename: string;
        const attributes: Record<string, string> = {};
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
                const allNodes = [...this._locations.get(domObject)];
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
                const oldChildId = this._renderedNodes.get(child);
                const domObject = nodeToDomObject.get(child);
                if (this._rendererTreated.has(domObject)) {
                    childId = oldChildId;
                } else if (!domObject) {
                    throw new Error('No rendering for the node(' + child.id + '): ' + child.name);
                } else {
                    childId = this._diffObject(
                        nodeToDomObject,
                        domObject,
                        true,
                        oldChildId ? [oldChildId] : [],
                    );
                }
            } else {
                const oldChildId = childrenMapping.get(child);
                childId = this._diffObject(
                    nodeToDomObject,
                    child,
                    false,
                    oldChildId ? [oldChildId] : [],
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
                const nodeIds: DomObjectID[] = nodes.map(node => this._fromNode.get(node));
                domNodesChildren.push([ref, position, nodeIds]);
            }
        }

        if (!domNodes.length && domObject.tag) {
            if (!old || domObject.tag !== old.object.tag) {
                hasChanged = true;
            }
            nodename = domObject.tag;
            // Update attributes.
            const newAttributes: Record<string, string> = domObject.attributes || {};
            const oldAttributes: Record<string, string> = old?.object.attributes || {};

            for (const name in oldAttributes) {
                const value = oldAttributes[name] || '';
                if (!newAttributes[name]) {
                    hasChanged = true;
                    if (name === 'style') {
                        const oldStyle = styleToObject(value);
                        for (const key in oldStyle) {
                            diffStyle[key] = null;
                        }
                    } else if (name === 'class') {
                        const oldClassNames = value.split(' ');
                        for (const className of oldClassNames) {
                            diffClassList[className] = false;
                        }
                    } else {
                        diffAttributes[name] = null;
                    }
                }
            }
            for (const name in newAttributes) {
                const value = newAttributes[name];
                const oldValue = oldAttributes?.[name] || '';
                if (name === 'style') {
                    const oldStyle = styleToObject(oldValue);
                    const newStyle = styleToObject(value);

                    for (const key in oldStyle) {
                        if (!newStyle[key]) {
                            hasChanged = true;
                            diffStyle[key] = null;
                        }
                    }
                    for (const key in newStyle) {
                        if (newStyle[key] !== oldStyle[key]) {
                            hasChanged = true;
                            diffStyle[key] = newStyle[key];
                        }
                    }
                } else if (name === 'class') {
                    const oldClassNames = oldValue.split(' ');
                    const newClassNames = value.split(' ');
                    for (const className of oldClassNames) {
                        if (className && !newClassNames.includes(className)) {
                            hasChanged = true;
                            diffClassList[className] = false;
                        }
                    }
                    for (const className of newClassNames) {
                        if (className && !oldClassNames.includes(className)) {
                            hasChanged = true;
                            diffClassList[className] = true;
                        }
                    }
                } else if (value !== oldValue) {
                    hasChanged = true;
                    diffAttributes[name] = value;
                }
                attributes[name] = value;
            }
        } else if (!domNodes.length && domObject.text) {
            if (!old || domObject.text !== old.object.text) {
                hasChanged = true;
            }
            textContent = domObject.text;
        } else if (!domNodes.length && old?.dom.length) {
            hasChanged = true;
        }

        // remove old referencies
        if (old) {
            for (const node of this._nodes.get(old.object)) {
                if (this._fromNode.get(node) === old.id) {
                    this._fromNode.delete(node);
                }
                if (this._renderedNodes.get(node) === old.id) {
                    this._renderedNodes.delete(node);
                }
            }
            if (typeof old.object.detach === 'function') {
                old.object.detach(...old.dom);
            }
        }
        if (fromRenderedNode) {
            for (const id of oldIds) {
                const old = this._objects[id];
                for (const node of this._nodes.get(old.object)) {
                    if (this._renderedNodes.get(node) === id) {
                        this._renderedNodes.delete(node);
                    }
                }
            }
        }

        if (
            nodename ||
            textContent ||
            allDomNodes.length ||
            children.length ||
            old?.dom.length ||
            old?.children.length
        ) {
            // Add new referencies.
            for (const node of nodes) {
                this._fromNode.set(node, id);
            }
            if (fromRenderedNode) {
                for (const node of allNodes) {
                    this._renderedNodes.set(node, id);
                }
            }

            if (old) {
                this._nodes.delete(old.object);
                this._locations.delete(old.object);
            }
            if (!this._nodes.get(domObject)) {
                this._nodes.set(domObject, []);
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
                domNodes = old?.dom ? [...old.dom] : [];
                for (const id of oldIds) {
                    for (const domNode of this._objects[id].dom) {
                        if (!domNodes.includes(domNode)) {
                            domNodes.push(domNode);
                        }
                    }
                }
                this._diff[id] = {
                    id: id,
                    attributes: diffAttributes,
                    style: diffStyle,
                    classList: diffClassList,
                    dom: old?.dom || [],
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
        } else if (old?.parent) {
            const children = this._objects[old.parent].children;
            if (children.includes(id)) {
                children.splice(id, 1);
            }
        }
    }
    private _diffObjectAssociateChildrenMap(
        objectA: GenericDomObject,
        objectIdsB: DomObjectID[],
    ): Map<GenericDomObject, DomObjectID> {
        const map = new Map<GenericDomObject, DomObjectID>();
        if (!objectIdsB.length) {
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
            const domObject = this._objects[id];
            if (domObject?.children) {
                for (const id of domObject.children) {
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
            const nodes = this._nodes.get(objectA) || [];
            for (const idB of arrayB) {
                const itemB = this._objects[idB];
                const objectB = itemB.object;
                let currentRatio = 0;
                if (objectA.tag) {
                    if (objectA.tag === objectB.tag) {
                        const attrA: Record<string, string> = objectA.attributes || {};
                        const attrB: Record<string, string> = objectB.attributes;

                        // add some points for attributes matching
                        let max = 1;
                        let same = 1;
                        for (const name in attrA) {
                            if (name === 'style') {
                                const styleA = attrA[name] ? styleToObject(attrA[name]) : {};
                                const styleB = attrB[name] ? styleToObject(attrB[name]) : {};
                                for (const key in styleA) {
                                    max++;
                                    if (styleA[key] === styleB[key]) {
                                        same++;
                                    }
                                }
                                for (const key in styleB) {
                                    if (!(key in styleB)) {
                                        max++;
                                    }
                                }
                            } else if (name === 'class') {
                                const classA = attrA[name]?.split(' ') || [];
                                const classB = attrB[name]?.split(' ') || [];
                                for (const c of classA) {
                                    max++;
                                    if (classB.includes(c)) {
                                        same++;
                                    }
                                }
                                for (const c of classB) {
                                    if (!classA.includes(c)) {
                                        max++;
                                    }
                                }
                            } else {
                                max++;
                                if (attrA[name] === attrB[name]) {
                                    same++;
                                }
                            }
                        }

                        currentRatio = 1 + same / max;
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
                    if (itemB.children && !objectB.text) {
                        currentRatio = 1;
                    }
                }
                if (currentRatio >= 1) {
                    // the best candidate must have the most common nodes
                    if (this._locations.get(objectA) && this._locations.get(objectB)) {
                        // More points for direct nodes.
                        const match: VNode[] = [];
                        for (const node of this._locations.get(objectA)) {
                            if (this._locations.get(objectB).includes(node)) {
                                match.push(node);
                            }
                        }
                        currentRatio =
                            match.length /
                            Math.max(
                                this._locations.get(objectA).length,
                                this._locations.get(objectB).length,
                            );
                    }
                    if (nodes.length && this._nodes.get(objectB).length) {
                        // Some points for children nodes.
                        const match: VNode[] = [];
                        for (const node of nodes) {
                            if (this._nodes.get(objectB).includes(node)) {
                                match.push(node);
                            }
                        }
                        currentRatio +=
                            match.length /
                            Math.max(nodes.length, this._nodes.get(objectB).length) /
                            10;
                    } else if (!nodes.length && !this._nodes.get(objectB).length) {
                        currentRatio += 1;
                    }
                    mapRatios.push([currentRatio, objectA, idB]);
                }
            }
        }
        return mapRatios;
    }
    private _addLocations(
        domObject: GenericDomObject,
        locations: Map<GenericDomObject, VNode[]>,
        node?: VNode,
    ): VNode[] {
        const nodes = locations.get(domObject);
        if (nodes) {
            this._locations.set(domObject, [...nodes]);
        }
        const allNodes: VNode[] = this._locations.get(domObject)
            ? [...this._locations.get(domObject)]
            : [];
        if (domObject.children) {
            for (const index in domObject.children) {
                const child = domObject.children[index];
                if (!(child instanceof AbstractNode)) {
                    for (const node of this._addLocations(child, locations)) {
                        allNodes.push(node);
                    }
                }
            }
        }
        if (node) {
            if (node && !allNodes.includes(node)) {
                allNodes.push(node);
                this._locations.set(domObject, [node]);
            }
            this._nodes.set(domObject, allNodes);
        }
        return allNodes;
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
            if (domNode) {
                if (diff.askCompleteRedrawing) {
                    for (const attr of domNode.attributes) {
                        const value = domObject.attributes[attr.name];
                        if (typeof value === 'undefined') {
                            domNode.removeAttribute(attr.name);
                        }
                    }
                    if (domObject.attributes) {
                        for (const name in domObject.attributes) {
                            domNode.setAttribute(name, domObject.attributes[name]);
                        }
                    }
                } else {
                    for (const name in diff.attributes) {
                        const value = diff.attributes[name];
                        if (value === null) {
                            domNode.removeAttribute(name);
                        } else {
                            domNode.setAttribute(name, value);
                        }
                    }
                    for (const name in diff.style) {
                        domNode.style[name] = diff.style[name] || '';
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
                if (domObject.attributes) {
                    for (const name in domObject.attributes) {
                        const value = domObject.attributes[name];
                        if (value !== null) {
                            domNode.setAttribute(name, value);
                        }
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

            // Insert children in the dom who locate with the placeholder.
            for (const [ref, position, childIds] of object.domNodesChildren) {
                if (position === RelativePosition.INSIDE) {
                    const childDomNodes = childIds
                        .map(childId => this._getDomChild(childId, ref as Element | ShadowRoot))
                        .flat();
                    for (const domNode of childDomNodes) {
                        ref.appendChild(domNode);
                    }
                } else {
                    const childDomNodes = childIds
                        .map(childId => this._getDomChild(childId, ref.parentElement))
                        .flat();
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
            if (this._fromDom.get(domNode) !== id) {
                this._fromDom.set(domNode, id);
                newNode = true;
            }
        }

        if (!object.domNodesChildren && object.children.length) {
            let parentDomNode = object.parentDomNode;
            if (domObject.tag) {
                parentDomNode = object.dom[0] as Element;
            }
            const domNodes: Node[] = [];
            for (const childId of object.children) {
                if (!domObject.tag && this._diff[childId]) {
                    newNode = true;
                }
                domNodes.push(...this._getDomChild(childId, parentDomNode));
            }
            if (domObject.tag && domNodes.length) {
                this._insertDomChildren(domNodes, parentDomNode);
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
        if (parentDomNode) {
            const child = this._objects[id];
            if (child.dom.length) {
                domNodes = child.dom;
            } else {
                domNodes = this._getchildrenDomNodes(id);
            }
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
                for (let i = 0; i < split.length; i++) {
                    chars.push([split[i], textNode, i]);
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
    private _insertDomChildren(domNodes: Node[], parentNode: Node): void {
        let childDomNode: Node = parentNode.firstChild;
        for (const domNode of domNodes) {
            if (childDomNode) {
                if (childDomNode === domNode) {
                    childDomNode = childDomNode.nextSibling;
                } else {
                    parentNode.insertBefore(domNode, childDomNode);
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
                if (domNode instanceof Text && this.isAvailableNode(id, domNode)) {
                    textNode = domNode;
                }
            }
        }
        if (!textNode && diff) {
            for (const domNode of diff.dom) {
                if (domNode instanceof Text && this.isAvailableNode(id, domNode)) {
                    textNode = domNode;
                }
            }
        }
        if (textNode) {
            // Get all free text nodes.
            const textNodes = [textNode];
            let text = textNode;
            while (
                text.previousSibling instanceof Text &&
                this.isAvailableNode(id, text.previousSibling)
            ) {
                text = text.previousSibling;
                textNodes.unshift(text);
            }
            text = textNode;
            while (text.nextSibling instanceof Text && this.isAvailableNode(id, text.nextSibling)) {
                text = text.nextSibling;
                textNodes.push(text);
            }
            return textNodes;
        }
    }
    /**
     * Check if the domNode are already associate to an other domObject and
     * this object don't need to be redrawed. The additionalchecking for the
     * diff is't use to associate the domNodecreate by a split from the browser.
     * The browser can add the new domNode after or before the split.
     */
    private isAvailableNode(id: DomObjectID, domNode: Node): boolean {
        const linkedId = this._fromDom.get(domNode);
        return !linkedId || linkedId === id || !!this._diff[linkedId];
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
