import { ProxyUniqID, VersionableParams } from './Versionable';
import {
    removedItem,
    memoryProxyPramsKey,
    NotVersionableErrorMessage,
    VersionableAllreadyVersionableErrorMessage,
} from './const';

type sliceKey = string;
export type AllowedMemory = MemoryTypeValues | AllowedObject;
export type AllowedObject = LoopObject | LoopArray | LoopSet | object | Function;
interface LoopObject {
    [x: string]: AllowedMemory;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface LoopArray extends Array<AllowedMemory> {}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface LoopSet extends Set<AllowedMemory> {}
export type MemoryTypeValues = string | number | boolean | ProxyUniqID | object | symbol; // object must to be ProxyUniqID

// MemoryType
// MemoryType for Object

// Type that the memory handles in practice. This is how it is stored in memory.
export class MemoryTypeObject {
    props: Record<string | number | symbol, MemoryTypeValues | Function> = {};
}
// Output of memory given to proxy to operate (not sure it is useful to rename
// the type. semantic value of "compiled")
export type MemoryCompiledObject = MemoryTypeObject;

// MemoryType for Array

type uniqIDMemoryTypeValues = Record<string, MemoryTypeValues>;
// Type that the memory handles in practice. This is how it is stored in memory.
export class MemoryTypeArray extends MemoryTypeObject {
    patch: uniqIDMemoryTypeValues = {};
}

// Output of memory given to proxy to operate
export class MemoryArrayCompiledWithPatch {
    // the proxy has to differentiate between what was already there and what is
    // being done in the current slice because deleting a key does not yield the
    // same result if the key was already there before this slice or not (it
    // would be marked as "removed" or ignored if wasn't already there.)
    compiled: uniqIDMemoryTypeValues; // array as it appears in the slice right before the current one "array as of t-1"
    props: uniqIDMemoryTypeValues; // new properties on the array at current time t
    patch: MemoryTypeArray; // very last patch at current time t
    constructor(
        compiled: uniqIDMemoryTypeValues,
        props: uniqIDMemoryTypeValues,
        patch: MemoryTypeArray,
    ) {
        this.compiled = compiled;
        this.props = props;
        this.patch = patch;
    }
}

// MemoryType for Set

// Type that the memory handles in practice. This is how it is stored in memory.
export class MemoryTypeSet {
    add: Set<MemoryTypeValues> = new Set();
    delete: Set<MemoryTypeValues> = new Set();
}
// Output of memory given to proxy to operate (not sure it is useful to rename
// the type. semantic value of "compiled")
export type MemoryCompiledSet = Set<MemoryTypeValues>;

export type MemoryType = MemoryTypeObject | MemoryTypeArray | MemoryTypeSet;

// MemoryType end

export type MemoryCompiled =
    | MemoryCompiledObject
    | MemoryArrayCompiledWithPatch
    | MemoryCompiledSet;

// List of memory accessors usable by versionable (we don't want to give them
// access to the true memory object !)
export interface MemoryVersionable {
    ID: number;
    getProxy: (ID: ProxyUniqID) => object;
    getSlice: () => object;
    getSliceValue: (ID: ProxyUniqID) => MemoryCompiled;
    isFrozen: () => boolean;
    markDirty: (ID: ProxyUniqID) => void;
    addSliceProxyParent: (ID: ProxyUniqID, parentID: ProxyUniqID, attributeName: string) => boolean;
    deleteSliceProxyParent: (
        ID: ProxyUniqID,
        parentID: ProxyUniqID,
        attributeName: string,
    ) => boolean;
    linkToMemory: (obj: AllowedMemory) => AllowedMemory;
}

export type patches = { sliceKey: sliceKey; value: MemoryType }[];
type proxyAttributePath = string[];

export const parentedPathSeparator = '•';

export function markAsDiffRoot(obj: AllowedObject): void {
    obj[memoryProxyPramsKey].willBeRootDiff = true;
}

function VersionableAllreadyLinkedErrorMessage(): void {
    throw new Error('This object is already linked to a other memory');
}
function CanNotRemoveSliceBeforeSwitch(): void {
    throw new Error('Please switch to a non-children slice before remove it');
}
function CanNotMergeSlices(): void {
    throw new Error('Can not merge the slices');
}
let memoryID = 0;

export class MemoryReference {
    name: sliceKey;
    parent: MemoryReference;
    children: MemoryReference[] = [];
    snapshotOrigin?: MemoryReference;
    snapshot?: MemoryReference;
    slice: Record<number, MemoryType> = {}; // registry of values
    linkedParentOfProxy: Record<number, proxyAttributePath> = {};
    invalideCache: Record<number, boolean> = {}; // paths that have been changed in given memory slice (when switching slice, this set is loaded in _invalidCache)
    constructor(name: sliceKey, parent?: MemoryReference) {
        this.name = name;
        this.parent = parent;
    }
    previous(): MemoryReference {
        return this.snapshotOrigin ? this.snapshotOrigin.parent : this.parent;
    }
}

export class Memory {
    _id: number;
    _sliceKey: sliceKey; // identifier or current memory slice
    _references: Record<sliceKey, MemoryReference> = {}; // Record<children, parent>
    _currentReference: MemoryReference; // Record<children, parent>
    _proxies: Record<number, object> = {};
    _rootProxies: Record<number, boolean> = {};
    _memoryVersionable: MemoryVersionable;
    _numberOfFlatSlices = 40;
    _numberOfSlicePerSnapshot = 8;

    constructor() {
        this._id = ++memoryID;
        this.create('');
        this.switchTo('');
        this._memoryVersionable = {
            ID: this._id,
            getProxy: (ID: ProxyUniqID): object => this._proxies[ID as number],
            getSlice: (): Record<number, MemoryType> => this._currentReference.slice,
            getSliceValue: (ID: ProxyUniqID): MemoryCompiled => this._getValue(this._sliceKey, ID),
            isFrozen: this.isFrozen.bind(this),
            // Mark as "modified" in this slice
            markDirty: (ID: ProxyUniqID): boolean =>
                (this._currentReference.invalideCache[ID as number] = true),
            // I am the proxy, I tell you I synchornized the value
            deleteSliceProxyParent: this._deleteSliceProxyParent.bind(this),
            addSliceProxyParent: this._addSliceProxyParent.bind(this),
            linkToMemory: this._linkToMemory.bind(this),
        };
        Object.freeze(this._memoryVersionable);
    }

    autoSnapshot(): void {
        const refs = [];
        let ref = this._currentReference;
        while (ref && ref.name) {
            refs.push(ref);
            ref = ref.parent;
        }
        if (refs.length > this._numberOfFlatSlices + this._numberOfSlicePerSnapshot) {
            const fromSliceKey = refs[refs.length - 1].name;
            const unitSliceKey = refs[refs.length - 1 - this._numberOfSlicePerSnapshot].name;
            const newSliceKey = unitSliceKey + '[snapshot from ' + fromSliceKey + ']';
            this.snapshot(fromSliceKey, unitSliceKey, newSliceKey);
        }
    }
    compress(fromSliceKey: sliceKey, unitSliceKey: sliceKey): boolean {
        const refs = this._references;
        const fromRref = refs[fromSliceKey];
        const untilRref = refs[unitSliceKey];
        const toRemove = fromRref.children.slice().map(ref => ref.name);
        fromRref.children = untilRref.children.splice(0);
        this.squashInto(fromSliceKey, unitSliceKey, fromSliceKey);
        let key: sliceKey;
        while ((key = toRemove.pop())) {
            this._remove(key);
        }
        return true;
    }
    create(sliceKey: sliceKey): this {
        this._create(sliceKey, this._sliceKey);
        return this;
    }
    getRootVersionables(proxy: LoopObject | LoopArray | LoopSet): Set<AllowedObject> {
        const roots: Set<AllowedObject> = new Set();
        const pathToRoot = this._getRootVersionables(this._sliceKey, proxy);
        for (const path of pathToRoot) {
            roots.add(path.proxy);
        }
        return roots;
    }
    getChangedVersionables(sliceKey: sliceKey = this._sliceKey): Map<AllowedObject, string[][]> {
        const pathChanges = new Map<AllowedObject, string[][]>();
        const slice = this._references[sliceKey].slice;
        for (const id in slice) {
            const item = slice[id];
            const proxy = this._proxies[id] as LoopObject | LoopArray | LoopSet;
            this._getRootVersionables(this._sliceKey, proxy).forEach(pathToRoot => {
                let paths: string[][];
                if (
                    (item instanceof MemoryTypeObject || item instanceof MemoryTypeArray) &&
                    Object.keys(item.props).length
                ) {
                    paths = [];
                    for (const key in item.props) {
                        paths.push(pathToRoot.path.concat([key]));
                    }
                } else {
                    paths = [pathToRoot.path];
                }
                if (pathChanges.get(pathToRoot.proxy)) {
                    pathChanges.get(pathToRoot.proxy).push(...paths);
                } else {
                    pathChanges.set(pathToRoot.proxy, paths);
                }
            });
        }
        return pathChanges;
    }
    isFrozen(): boolean {
        return this._currentReference.children.length > 0;
    }
    linkToMemory(proxy: AllowedObject): void {
        const params = proxy[memoryProxyPramsKey] as VersionableParams;
        if (!params) {
            return NotVersionableErrorMessage();
        }
        if (params.object === proxy) {
            return VersionableAllreadyVersionableErrorMessage();
        }
        if (!params.itsme(proxy)) {
            return NotVersionableErrorMessage();
        }
        if (!params.memory || params.memory !== this._memoryVersionable) {
            params.willBeRootDiff = true;
            this._linkToMemory(proxy);
        }
        this._rootProxies[params.ID as number] = true;
    }
    remove(sliceKey: sliceKey): this {
        if (!(sliceKey in this._references)) {
            return this;
        }
        if (sliceKey === '') {
            throw new Error('You should not remove the original memory slice');
        }

        let ref = this._references[this._sliceKey];
        while (ref) {
            if (ref.name === sliceKey) {
                CanNotRemoveSliceBeforeSwitch();
            }
            ref = ref.parent;
        }

        const IDs = this._remove(sliceKey);
        // check if the IDs are linked evrywere
        Object.values(this._references).forEach(reference => {
            const linkedParentOfProxy = reference.linkedParentOfProxy;
            IDs.forEach(ID => {
                if (ID in linkedParentOfProxy) {
                    IDs.delete(ID);
                }
            });
        });
        // remove unlinked items
        IDs.forEach(ID => {
            delete this._proxies[ID];
            delete this._rootProxies[ID];
        });
        return this;
    }
    path(sliceKey: sliceKey, withoutSnapshot?: boolean): string[] {
        const sliceKeys = [];
        let ref = this._references[sliceKey];
        while (ref && ref.name) {
            sliceKeys.push(ref.name);
            ref = withoutSnapshot ? ref.previous() : ref.parent;
        }
        return sliceKeys;
    }
    switchTo(sliceKey: sliceKey): this {
        if (!(sliceKey in this._references)) {
            throw new Error('You must create the "' + sliceKey + '" slice before switch on it');
        }
        if (sliceKey === this._sliceKey) {
            return;
        }
        const ancestorKey = this._getCommonAncestor(this._sliceKey, sliceKey);
        const refs = this._getChangesPath(this._sliceKey, sliceKey, ancestorKey);

        if (this._sliceKey === ancestorKey) {
            refs.shift();
        }

        const invalideCache = new Set<number>();
        while (refs.length) {
            const ref = refs.pop();
            Object.keys(ref.invalideCache).forEach(key => {
                // It was invalid before, it is still invalid now since it wasn't yet read
                invalideCache.add(+key);
            });
        }

        this._currentReference = this._references[sliceKey];
        this._sliceKey = sliceKey;

        for (const key of invalideCache) {
            const proxy = this._proxies[key];
            const params = proxy[memoryProxyPramsKey] as VersionableParams;
            params.sync();
        }

        return this;
    }
    snapshot(fromSliceKey: sliceKey, unitSliceKey: sliceKey, newSliceKey: sliceKey): void {
        const refs = this._references;
        const fromRref = refs[fromSliceKey];
        const untilRref = refs[unitSliceKey];

        const newRef = this._create(newSliceKey, fromRref.parent && fromRref.parent.name);
        this.squashInto(fromSliceKey, unitSliceKey, newRef.name);

        untilRref.children.forEach(child => {
            child.parent = newRef;
        });
        newRef.children = untilRref.children;
        untilRref.children = [];
        untilRref.snapshot = newRef;
        newRef.snapshotOrigin = untilRref;
    }
    squashInto(fromSliceKey: sliceKey, unitSliceKey: sliceKey, intoSliceKey: sliceKey): void {
        const refs = this._references;
        const fromRref = refs[fromSliceKey];
        const untilRref = refs[unitSliceKey];
        const intoRef = refs[intoSliceKey];

        const references = [];
        let ref = untilRref;
        while (ref) {
            references.push(ref);
            if (ref === fromRref) {
                break;
            }
            ref = ref.parent;
        }
        if (!ref) {
            CanNotMergeSlices();
        }

        const intoLinkedParentOfProxy = refs[intoSliceKey].linkedParentOfProxy;
        const intoInvalideCache = refs[intoSliceKey].invalideCache;
        const intoSlices = intoRef.slice;

        while ((ref = references.pop())) {
            const LinkedParentOfProxy = ref.linkedParentOfProxy;
            Object.keys(LinkedParentOfProxy).forEach(ID => {
                intoLinkedParentOfProxy[ID] = LinkedParentOfProxy[ID].slice();
            });

            Object.keys(ref.invalideCache).forEach(link => {
                intoInvalideCache[link] = true;
            });

            const slice = ref.slice;
            Object.keys(slice).forEach(ID => {
                const memoryItem = slice[ID];
                if (!intoSlices[ID]) {
                    intoSlices[ID] = memoryItem;
                    return;
                }
                const intoItem = intoSlices[ID];
                if (memoryItem instanceof MemoryTypeArray) {
                    Object.assign(intoItem.patch, memoryItem.patch);
                    Object.assign(intoItem.props, memoryItem.props);
                } else if (memoryItem instanceof MemoryTypeSet) {
                    memoryItem.add.forEach(item => {
                        if (!intoItem.delete.has(item)) {
                            intoItem.add.add(item);
                        } else {
                            intoItem.delete.delete(item);
                        }
                    });
                    memoryItem.delete.forEach(item => {
                        if (!intoItem.add.has(item)) {
                            intoItem.delete.add(item);
                        } else {
                            intoItem.add.delete(item);
                        }
                    });
                } else {
                    Object.assign(intoItem.props, memoryItem.props);
                }
            });
        }
    }

    /////////////////////////////////////////////////////
    // private
    /////////////////////////////////////////////////////

    private _getRootVersionables(
        sliceKey: sliceKey,
        proxy: LoopObject | LoopArray | LoopSet,
    ): { proxy: AllowedObject; path: string[] }[] {
        const roots: { proxy: AllowedObject; path: string[] }[] = [];
        const nodeID = proxy[memoryProxyPramsKey].ID;
        const pathList: [ProxyUniqID, string[]][] = [[nodeID, []]];
        while (pathList.length) {
            const path = pathList.pop();
            const [nodeID, pathToNode] = path;
            if (this._rootProxies[nodeID as number]) {
                roots.push({ proxy: this._proxies[nodeID as number], path: path[1] });
                continue;
            }
            this._getProxyParentedPath(sliceKey, nodeID).forEach(path => {
                const parentNodeID = path.split(parentedPathSeparator, 1)[0];
                const partPath = path.slice(parentNodeID.length + 1);
                pathList.push([+parentNodeID, [partPath].concat(pathToNode)]);
            });
        }
        return roots;
    }
    private _addSliceProxyParent(
        ID: ProxyUniqID,
        parentID: ProxyUniqID,
        attributeName: string,
    ): void {
        const sliceKey = this._sliceKey;
        const sliceLinkedParentOfProxy = this._references[sliceKey].linkedParentOfProxy;
        const path =
            parentID + (attributeName === undefined ? '' : parentedPathSeparator + attributeName);
        let parents = sliceLinkedParentOfProxy[ID as number];
        if (!parents) {
            const parented = this._getProxyParentedPath(sliceKey, ID);
            parents = sliceLinkedParentOfProxy[ID as number] = parented ? parented.slice() : [];
        }
        parents.push(path);
    }
    private _deleteSliceProxyParent(
        ID: ProxyUniqID,
        parentID: ProxyUniqID,
        attributeName: string,
    ): void {
        const sliceKey = this._sliceKey;
        const sliceLinkedParentOfProxy = this._references[sliceKey].linkedParentOfProxy;
        const path =
            parentID + (attributeName === undefined ? '' : parentedPathSeparator + attributeName);
        let parents = this._getProxyParentedPath(sliceKey, ID);
        const index = parents.indexOf(path);
        if (!sliceLinkedParentOfProxy[ID as number]) {
            parents = sliceLinkedParentOfProxy[ID as number] = parents.slice();
        }
        parents.splice(index, 1);
    }
    private _compiledArrayPatches(patches: patches): MemoryTypeArray {
        const props = {};
        const valueBySeq = {};
        while (patches.length) {
            const patch = patches.pop();
            const step = patch.value as MemoryTypeArray;
            Object.assign(props, step.props);
            Object.assign(valueBySeq, step.patch);
        }
        return {
            patch: valueBySeq,
            props: props,
        };
    }
    private _compiledSetPatches(patches: patches): MemoryCompiledSet {
        const obj = new Set() as MemoryCompiledSet;
        while (patches.length) {
            const patch = patches.pop();
            const step = patch.value as MemoryTypeSet;
            step.add.forEach((item: MemoryTypeValues) => (obj as MemoryCompiledSet).add(item));
            step.delete.forEach((item: MemoryTypeValues) =>
                (obj as MemoryCompiledSet).delete(item),
            );
        }
        return obj;
    }
    private _compiledObjectPatches(patches: patches): MemoryCompiledObject {
        const obj = new MemoryTypeObject();
        const props = obj.props;
        while (patches.length) {
            const patch = patches.pop();
            const step = patch.value as MemoryTypeObject;
            Object.assign(props, step.props);
        }
        Object.keys(props).forEach(key => {
            if (props[key] === removedItem) {
                delete props[key];
            }
        });
        return obj;
    }
    private _create(sliceKey: sliceKey, fromSliceKey: sliceKey): MemoryReference {
        const refs = this._references;
        if (refs[sliceKey]) {
            throw new Error('The memory slice "' + sliceKey + '" already exists');
        }
        const parent = refs[fromSliceKey];
        const ref = (refs[sliceKey] = new MemoryReference(sliceKey, parent));
        if (parent) {
            parent.children.push(ref);
        }
        return ref;
    }
    private _getChangesPath(
        fromSliceKey: sliceKey,
        toSliceKey: sliceKey,
        ancestorKey: sliceKey,
    ): MemoryReference[] {
        const fromPath = [];
        let ref = this._references[fromSliceKey];
        while (ref) {
            fromPath.push(ref);
            if (ref.name === ancestorKey) {
                break;
            }
            ref = ref.previous();
        }

        const toPath = [];
        ref = this._references[toSliceKey];
        while (ref) {
            if (ref.name === ancestorKey) {
                break;
            }
            toPath.push(ref);
            ref = ref.previous();
        }
        toPath.reverse();
        return fromPath.concat(toPath);
    }
    private _getCommonAncestor(sliceKeyA: sliceKey, sliceKeyB: sliceKey): sliceKey {
        const rootB = this._references[sliceKeyB];
        let refA = this._references[sliceKeyA];
        while (refA) {
            let refB = rootB;
            while (refB) {
                if (refA.name === refB.name) {
                    return refA.name;
                }
                refB = refB.previous();
            }
            refA = refA.previous();
        }
    }
    private _getProxyParentedPath(sliceKey: sliceKey, ID: ProxyUniqID): proxyAttributePath {
        // bubbling up magic for proxyParents
        let ref = this._references[sliceKey];
        while (ref) {
            const slice = ref.linkedParentOfProxy;
            const path = slice && slice[ID as number];
            if (path) {
                return path;
            }
            ref = ref.parent;
        }
    }
    private _getValue(sliceKey: string, ID: ProxyUniqID): MemoryCompiled {
        const patch = this._getPatches(undefined, sliceKey, ID);
        if (!patch) {
            return;
        }
        if (patch.type === 'set') {
            return this._compiledSetPatches(patch.patches);
        } else if (patch.type === 'array') {
            return this._getValueArray(sliceKey, ID, patch.patches);
        } else {
            return this._compiledObjectPatches(patch.patches);
        }
    }
    private _getValueArray(sliceKey: string, ID: ProxyUniqID, patches: patches): MemoryCompiled {
        const ref = this._references[sliceKey];
        let owner: MemoryTypeArray;
        if (ref.slice[ID as number]) {
            owner = patches.shift().value as MemoryTypeArray;
        }
        const value = this._compiledArrayPatches(patches);
        return new MemoryArrayCompiledWithPatch(
            value.patch,
            value.props,
            owner || new MemoryTypeArray(),
        );
    }
    private _getPatches(
        fromSliceKey: sliceKey,
        toSliceKey: string,
        ID: ProxyUniqID,
    ): { patches: patches; type: string } {
        let ref = this._references[toSliceKey];
        let type: string;
        const patches = [];
        while (ref && ref.name !== fromSliceKey) {
            const slice = ref.slice;
            const value = slice && slice[ID as number];
            if (!value) {
                ref = ref.parent;
                continue;
            }
            if (!type) {
                if (value instanceof MemoryTypeArray) {
                    type = 'array';
                } else if (value instanceof MemoryTypeSet) {
                    type = 'set';
                } else {
                    type = 'object';
                }
            }
            patches.push({
                sliceKey: ref.name,
                value: value,
            });
            ref = ref.parent;
        }
        if (!type) {
            return;
        }
        return {
            patches: patches,
            type: type,
        };
    }
    private _linkToMemory(proxy: AllowedObject): void {
        const params = proxy[memoryProxyPramsKey];
        if (params.memory) {
            if (params.memory !== this._memoryVersionable) {
                VersionableAllreadyLinkedErrorMessage();
            }
            return;
        }

        const ID = params.ID as number;
        params.memory = this._memoryVersionable;
        params.linkCallback(this._memoryVersionable);
        this._proxies[ID] = proxy;

        if (params.willBeRootDiff) {
            this._rootProxies[ID] = true;
        }
    }
    private _remove(sliceKey: sliceKey): Set<number> {
        const IDs = [];
        let ref = this._references[sliceKey];
        const index = ref.parent.children.indexOf(ref);
        ref.parent.children.splice(index, 1);

        const refs = [ref];
        while ((ref = refs.pop())) {
            const sliceKey = ref.name;
            ref.children.forEach(ref => refs.push(ref));
            Object.keys(ref.linkedParentOfProxy).forEach(ID => IDs.push(+ID));
            delete this._references[sliceKey];
        }
        return new Set(IDs);
    }
}
