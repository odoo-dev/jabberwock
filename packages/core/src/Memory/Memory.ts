import { VersionableID, VersionableParams } from './Versionable';
import { ArrayParams } from './VersionableArray';
import {
    removedItem,
    memoryProxyPramsKey,
    NotVersionableError,
    VersionableAllreadyVersionableError,
    MemoryError,
    FrozenError,
} from './const';

type SliceKey = string;
type VersionableMemoryID = number;
export type MemoryAllowedType = MemoryAllowedPrimitiveTypes | MemoryAllowedObjectType;
export type MemoryAllowedObjectType = LoopObject | LoopArray | LoopSet | object;
interface LoopObject {
    [x: string]: MemoryAllowedType;
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
type LoopArray = MemoryAllowedType[];
// eslint-disable-next-line @typescript-eslint/no-empty-interface
type LoopSet = Set<MemoryAllowedType>;
export type MemoryAllowedPrimitiveTypes =
    | string
    | number
    | boolean
    | VersionableID
    | object
    | Function
    | symbol; // object must to be ProxyUniqID

// MemoryType
// MemoryType for Object

// Type that the memory handles in practice. This is how it is stored in memory.
export class MemoryTypeObject {
    props: Record<string | number | symbol, MemoryAllowedPrimitiveTypes | Function> = {};
}

// MemoryType for Array

// Type that the memory handles in practice. This is how it is stored in memory.
export class MemoryTypeArray extends MemoryTypeObject {
    patch: Record<string, MemoryAllowedPrimitiveTypes> = {};
}

// Output of memory given to proxy to operate
export class MemoryArrayCompiledWithPatch {
    // the proxy has to differentiate between what was already there and what is
    // being done in the current slice because deleting a key does not yield the
    // same result if the key was already there before this slice or not (it
    // would be marked as "removed" or ignored if wasn't already there.)
    constructor(
        // array as it appears in the slice right before the current one "array as of t-1"
        public compiledValues: Record<string, MemoryAllowedPrimitiveTypes>,
        // very last patch at current time t
        public newValues: MemoryTypeArray,
        // new properties on the array at current time t
        public props: Record<string, MemoryAllowedPrimitiveTypes>,
    ) {}
}

// MemoryType for Set

// Type that the memory handles in practice. This is how it is stored in memory.
export class MemoryTypeSet {
    add: Set<MemoryAllowedPrimitiveTypes> = new Set();
    delete: Set<MemoryAllowedPrimitiveTypes> = new Set();
}
// Output of memory given to proxy to operate (not sure it is useful to rename
// the type. semantic value of "compiled")
export type MemoryCompiledSet = Set<MemoryAllowedPrimitiveTypes>;

export type MemoryType = MemoryTypeObject | MemoryTypeArray | MemoryTypeSet;

// MemoryType end

export type MemoryCompiled = MemoryTypeObject | MemoryArrayCompiledWithPatch | MemoryCompiledSet;

// List of memory accessors usable by versionable (we don't want to give them
// access to the true memory object !)
export interface MemoryWorker {
    ID: number;
    getProxy: (ID: VersionableID) => object;
    getSlice: () => Record<number, MemoryType>;
    getSliceValue: (ID: VersionableID) => MemoryCompiled;
    isFrozen: () => boolean;
    markDirty: (ID: VersionableID) => void;
    addSliceProxyParent: (
        ID: VersionableID,
        parentID: VersionableID,
        attributeName: string,
    ) => boolean;
    deleteSliceProxyParent: (
        ID: VersionableID,
        parentID: VersionableID,
        attributeName: string,
    ) => boolean;
    linkToMemory: (obj: MemoryAllowedType) => MemoryAllowedType;
}

export type patches = { sliceKey: SliceKey; value: MemoryType }[];
type proxyAttributePath = string[];

export interface ChangesLocations {
    add: object[]; // The added versionables
    move: object[]; // The versionables that changed parents
    remove: object[]; // Versionables that had one or more parents and no longer have any.
    update: [
        object, // The versionables that changed
        (
            | string[] // The updated object keys
            | number[] // the updated indexes for versionable array
            | void
        ), // Nothing for the versionable set
    ][];
}

export const parentedPathSeparator = '•';

export function markAsDiffRoot(obj: MemoryAllowedObjectType): void {
    obj[memoryProxyPramsKey].isDiffRoot = true;
}

let memoryID = 0;
const memoryRootSliceName = '';
const regExpoSnapshotOrigin = /^.*\[snapshot from (.*)\]$/;

export class MemorySlice {
    name: SliceKey;
    parent: MemorySlice;
    children: MemorySlice[] = [];
    snapshotOrigin?: MemorySlice;
    snapshot?: MemorySlice;
    data: Record<number, MemoryType> = {}; // registry of values
    linkedParentOfProxy: Record<number, proxyAttributePath> = {};
    invalidCache: Record<number, boolean> = {}; // paths that have been changed in given memory slice (when switching slice, this set is loaded in _invalidateCache)
    ids: Set<number> = new Set();
    constructor(name: SliceKey, parent?: MemorySlice) {
        this.name = name;
        this.parent = parent;
    }
    getPrevious(): MemorySlice {
        return this.snapshotOrigin ? this.snapshotOrigin.parent : this.parent;
    }
}

export class Memory {
    _id: number;
    _sliceKey: SliceKey; // identifier or current memory slice
    _slices: Record<SliceKey, MemorySlice> = {}; // Record<children, parent>
    _currentSlice: MemorySlice; // Record<children, parent>
    _proxies: Record<VersionableMemoryID, object> = {};
    _rootProxies: Record<VersionableMemoryID, boolean> = {};
    _memoryWorker: MemoryWorker;
    _numberOfFlatSlices = 40;
    _numberOfSlicePerSnapshot = 8;
    _autoSnapshotCheck = 0;

    constructor() {
        this._id = ++memoryID;
        this.create(memoryRootSliceName);
        this.switchTo(memoryRootSliceName);
        this._memoryWorker = {
            ID: this._id,
            getProxy: (ID: VersionableID): object => this._proxies[ID as VersionableMemoryID],
            getSlice: (): Record<number, MemoryType> => this._currentSlice.data,
            getSliceValue: (ID: VersionableID): MemoryCompiled =>
                this._getValue(this._sliceKey, ID),
            isFrozen: this.isFrozen.bind(this),
            // Mark as "modified" in this slice
            markDirty: (ID: VersionableID): boolean =>
                (this._currentSlice.invalidCache[ID as VersionableMemoryID] = true),
            // I am the proxy, I tell you I synchornized the value
            deleteSliceProxyParent: this._deleteSliceProxyParent.bind(this),
            addSliceProxyParent: this._addSliceProxyParent.bind(this),
            linkToMemory: this._linkToMemory.bind(this),
        };
        Object.freeze(this._memoryWorker);
    }

    get sliceKey(): SliceKey {
        return this._sliceKey;
    }

    /**
     * Create a memory slice.
     * Modifications and changes (of objects bound to memory) are all recorded
     * in these slices. The new slice created will be noted as being the
     * continuation (or the child) of the current one.
     *
     * A slice with "children" is immutable. The modifications are therefore
     * blocked and an error will be triggered if a code tries to modify one of
     * these objects. To be able to edit again, you must destroy the "child"
     * slices or change the memory slice.
     *
     * @param sliceKey
     */
    create(sliceKey: SliceKey): this {
        this._create(sliceKey, this._sliceKey);
        return this;
    }
    /**
     * Change the working memory slice (this must be created beforehand).
     *
     * @param sliceKey
     */
    switchTo(sliceKey: SliceKey): this {
        if (!(sliceKey in this._slices)) {
            throw new MemoryError(
                'You must create the "' + sliceKey + '" slice before switch on it',
            );
        }
        if (sliceKey === this._sliceKey) {
            return;
        }
        const invalidCache = this._aggregateInvalidCaches(this._sliceKey, sliceKey);
        this._currentSlice = this._slices[sliceKey];
        this._sliceKey = sliceKey;
        for (const key of invalidCache) {
            const proxy = this._proxies[key];
            const params = proxy[memoryProxyPramsKey] as VersionableParams;
            params.synchronize();
        }
        this._autoSnapshotCheck++;
        if (!(this._autoSnapshotCheck % this._numberOfSlicePerSnapshot)) {
            this._autoSnapshot();
        }
        return this;
    }
    /**
     * Attach a versionable to memory.
     * The versionable will then be versioned and its modifications will be
     * recorded in the corresponding memory slots.
     * All other versionables linked to given versionable attached to memory
     * are automatically linked to memory.
     *
     * (Items bound to memory by this function will be noted as part of the
     * root of changes @see getRoots )
     *
     * @param versionable
     */
    attach(versionable: MemoryAllowedObjectType): void {
        const params = versionable[memoryProxyPramsKey] as VersionableParams;
        if (!params) {
            throw new NotVersionableError();
        }
        if (params.object === versionable) {
            throw new VersionableAllreadyVersionableError();
        }
        if (!params.verify(versionable)) {
            throw new NotVersionableError();
        }
        if (this.isFrozen()) {
            throw new FrozenError();
        }
        if (!params.memory || params.memory !== this._memoryWorker) {
            params.isDiffRoot = true;
            this._linkToMemory(versionable);
        }
        this._rootProxies[params.ID as VersionableMemoryID] = true;
    }
    /**
     * Returns the parents of the object.
     *
     * Example: p = {}; v = {point: p} axis = {origin: p}
     * The parents of p are [[v, ['point']], [axis, ['origin']]]
     *
     * @param versionable
     */
    getParents(versionable: MemoryAllowedObjectType): Map<MemoryAllowedObjectType, string[][]> {
        const pathChanges = new Map<MemoryAllowedObjectType, string[][]>();
        const nodeID = versionable[memoryProxyPramsKey].ID;
        const pathList: [VersionableID, string[]][] = [[nodeID, []]];
        while (pathList.length) {
            const path = pathList.pop();
            const [nodeID, pathToNode] = path;

            const parentProxy: MemoryAllowedObjectType = this._proxies[
                nodeID as VersionableMemoryID
            ];
            let paths: string[][] = pathChanges.get(parentProxy);
            if (!paths) {
                paths = [];
                pathChanges.set(parentProxy, paths);
            }
            paths.push(path[1]);

            if (this._rootProxies[nodeID as VersionableMemoryID]) {
                continue;
            }
            this._getProxyParentedPath(this._sliceKey, nodeID).forEach(path => {
                const parentNodeID = path.split(parentedPathSeparator, 1)[0];
                const partPath = path.slice(parentNodeID.length + 1);
                pathList.push([+parentNodeID, [partPath].concat(pathToNode)]);
            });
        }
        return pathChanges;
    }
    /**
     * Return the location of the changes.
     *
     * @param from
     * @param to
     */
    getChangesLocations(from: SliceKey, to: SliceKey): ChangesLocations {
        const diff: ChangesLocations = {
            add: [],
            move: [],
            remove: [],
            update: [],
        };

        const ancestorKey = this._getCommonAncestor(from, to);
        const refs = this._getChangesPath(from, to, ancestorKey);
        if (from === ancestorKey && from !== to) {
            refs.shift();
        }

        const removeFromUpdate = new Set<MemoryAllowedObjectType>();

        let previous: MemorySlice;
        let ref: MemorySlice;
        while ((ref = refs.pop())) {
            const linkedParentOfProxy = ref.linkedParentOfProxy;
            for (const ID in linkedParentOfProxy) {
                const proxy = this._proxies[ID];
                if (linkedParentOfProxy[ID].length) {
                    if (ref.ids.has(+ID)) {
                        if (ref.parent === previous) {
                            diff.remove.push(proxy);
                        } else {
                            diff.add.push(proxy);
                        }
                        removeFromUpdate.add(proxy);
                    } else {
                        diff.move.push(proxy);
                    }
                } else {
                    if (ref.parent === previous) {
                        diff.add.push(proxy);
                    } else {
                        diff.remove.push(proxy);
                    }
                    removeFromUpdate.add(proxy);
                }
            }

            if (ref.parent === previous) {
                for (const ID of previous.ids) {
                    const proxy = this._proxies[ID];
                    diff.remove.push(proxy);
                    removeFromUpdate.add(proxy);
                }
            }

            const slice = ref.data;
            Object.keys(slice).forEach(ID => {
                const id = +ID;
                const memoryItem = slice[id];
                const proxy = this._proxies[ID];
                if (removeFromUpdate.has(proxy)) {
                    return;
                } else if (memoryItem instanceof MemoryTypeArray) {
                    const keys = Object.keys(memoryItem.props);
                    if (keys.length) {
                        diff.update.push([proxy, keys]);
                    }
                    const params = proxy[memoryProxyPramsKey] as ArrayParams;
                    const uniqIDs = params.uniqIDs;
                    const len = uniqIDs.length;
                    const half = Math.ceil(len / 2);
                    const indexes: number[] = [];
                    for (const i in memoryItem.patch) {
                        let index = half;
                        let step = half;
                        while (step) {
                            const value = uniqIDs[index];
                            if (value === i) {
                                break;
                            } else if (value > i) {
                                index -= step;
                                if (index < 0) {
                                    index = 0;
                                }
                            } else {
                                index += step;
                                if (index >= len) {
                                    index = len - 1;
                                }
                            }
                            if (step > 1) {
                                step = Math.ceil(step / 2);
                            } else {
                                const value = uniqIDs[index];
                                step = 0;
                                if (value < i && uniqIDs[index + 1] > i) {
                                    index++;
                                }
                            }
                        }
                        if (!indexes.includes(index)) {
                            indexes.push(index);
                        }
                    }
                    if (indexes.length) {
                        diff.update.push([proxy, indexes]);
                    }
                } else if (memoryItem instanceof MemoryTypeSet) {
                    diff.update.push([proxy, null]);
                } else {
                    const keys = Object.keys(memoryItem.props);
                    if (keys.length) {
                        diff.update.push([proxy, keys]);
                    }
                }
            });

            previous = ref;
        }
        return diff;
    }
    /**
     * Get if the current memory slice are imutable or not.
     *
     */
    isFrozen(): boolean {
        return this._currentSlice.children.length > 0;
    }
    /**
     * Remove a memory slice.
     * The current slice cannot be the one being deleted or one of its children.
     *
     * @param sliceKey
     */
    remove(sliceKey: SliceKey): this {
        if (!(sliceKey in this._slices)) {
            return this;
        }
        if (sliceKey === memoryRootSliceName) {
            throw new MemoryError('You should not remove the original memory slice');
        }

        let ref = this._slices[this._sliceKey];
        while (ref) {
            if (ref.name === sliceKey) {
                throw new MemoryError('Please switch to a non-children slice before remove it');
            }
            ref = ref.parent;
        }

        const IDs = this._remove(sliceKey);
        // check if the IDs are linked evrywere
        Object.values(this._slices).forEach(reference => {
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
    /**
     * Return ancestor versionables noted as roots.
     *
     * There are two ways for a versionable to be root, either via the
     * 'linkToMemory' method, or with the 'markAsDiffRoot' utility function.
     *
     * @param proxy
     */
    getRoots(proxy: MemoryAllowedObjectType): Set<MemoryAllowedObjectType> {
        const roots: Set<MemoryAllowedObjectType> = new Set();

        const nodeID = proxy[memoryProxyPramsKey].ID;
        const pathList: [VersionableID, string[]][] = [[nodeID, []]];
        while (pathList.length) {
            const path = pathList.pop();
            const [nodeID, pathToNode] = path;
            if (this._rootProxies[nodeID as VersionableMemoryID]) {
                roots.add(this._proxies[nodeID as VersionableMemoryID]);
                continue;
            }
            this._getProxyParentedPath(this._sliceKey, nodeID).forEach(path => {
                const parentNodeID = path.split(parentedPathSeparator, 1)[0];
                const partPath = path.slice(parentNodeID.length + 1);
                pathList.push([+parentNodeID, [partPath].concat(pathToNode)]);
            });
        }
        return roots;
    }
    /**
     * Return the list of names of all previous memory slice of the given
     * memory slice.
     *
     * @param sliceKey
     * @param withoutSnapshot
     */
    getPath(sliceKey: SliceKey, withoutSnapshot?: boolean): SliceKey[] {
        const sliceKeys = [];
        let ref = this._slices[sliceKey];
        while (ref && ref.name) {
            sliceKeys.push(ref.name);
            ref = withoutSnapshot ? ref.getPrevious() : ref.parent;
        }
        return sliceKeys;
    }
    /**
     * Create the snapshot of different memory slices (use the path between the
     * memory slice to get all changes) and merge the changes into a new
     * destination slice.
     *
     * @param fromSliceKey
     * @param unitSliceKey
     * @param newSliceKey
     */
    snapshot(fromSliceKey: SliceKey, unitSliceKey: SliceKey, newSliceKey: SliceKey): void {
        const refs = this._slices;
        const fromRref = refs[fromSliceKey];
        const untilRref = refs[unitSliceKey];

        const newRef = this._create(newSliceKey, fromRref.parent && fromRref.parent.name);
        this._squashInto(fromSliceKey, unitSliceKey, newRef.name);

        untilRref.children.forEach(child => {
            child.parent = newRef;
        });
        newRef.children = untilRref.children;
        untilRref.children = [];
        untilRref.snapshot = newRef;
        newRef.snapshotOrigin = untilRref;
    }
    /**
     * Compress all changes between two parented memory slices and remove all
     * children memory slice.
     *
     * @param fromSliceKey
     * @param unitSliceKey
     */
    compress(fromSliceKey: SliceKey, unitSliceKey: SliceKey): boolean {
        const refs = this._slices;
        const fromRref = refs[fromSliceKey];
        const untilRref = refs[unitSliceKey];
        const toRemove = fromRref.children.slice().map(ref => ref.name);
        fromRref.children = untilRref.children.splice(0);
        this._squashInto(fromSliceKey, unitSliceKey, fromSliceKey);
        let key: SliceKey;
        while ((key = toRemove.pop())) {
            this._remove(key);
        }
        return true;
    }
    /**
     * Debug tools to get the list of memory slice and changes from a
     * versionable in order to be able to trace his evolution.
     *
     * @param versionable
     */
    getSliceAndChanges(
        versionable: object | number | VersionableID,
    ): { sliceKey: string; versionableId: number; changes: MemoryType }[] {
        let id: number;
        if (typeof versionable === 'number' || versionable instanceof VersionableID) {
            id = +versionable;
            versionable = this._proxies[id];
        } else {
            for (const key in this._proxies) {
                if (this._proxies[key] === versionable) {
                    id = +key;
                    break;
                }
            }
        }
        const res: { sliceKey: string; versionableId: number; changes: MemoryType }[] = [];
        const slices = Object.values(this._slices).filter(slice => slice.data[id]);
        for (const slice of slices) {
            let changes: MemoryType;
            if (versionable instanceof Set) {
                const data = slice.data[id] as MemoryTypeSet;
                changes = {
                    add: new Set(data.add),
                    delete: new Set(data.delete),
                };
            } else if (versionable instanceof Array) {
                const data = slice.data[id] as MemoryTypeArray;
                changes = {
                    props: Object.assign({}, data.props),
                    patch: Object.assign({}, data.patch),
                };
            } else {
                const data = slice.data[id] as MemoryTypeObject;
                changes = {
                    props: Object.assign({}, data.props),
                };
            }
            res.push({ sliceKey: slice.name, versionableId: id, changes: changes });
        }
        return res;
    }

    /////////////////////////////////////////////////////
    // private
    /////////////////////////////////////////////////////

    private _addSliceProxyParent(
        ID: VersionableID,
        parentID: VersionableID,
        attributeName: string,
    ): void {
        const sliceKey = this._sliceKey;
        const sliceLinkedParentOfProxy = this._slices[sliceKey].linkedParentOfProxy;
        const path =
            parentID +
            (attributeName === undefined
                ? memoryRootSliceName
                : parentedPathSeparator + attributeName);
        let parents = sliceLinkedParentOfProxy[ID as VersionableMemoryID];
        if (!parents) {
            const parented = this._getProxyParentedPath(sliceKey, ID);
            parents = sliceLinkedParentOfProxy[ID as VersionableMemoryID] = parented
                ? parented.slice()
                : [];
        }
        parents.push(path);
    }
    private _deleteSliceProxyParent(
        ID: VersionableID,
        parentID: VersionableID,
        attributeName: string,
    ): void {
        const sliceKey = this._sliceKey;
        const sliceLinkedParentOfProxy = this._slices[sliceKey].linkedParentOfProxy;
        const path =
            parentID +
            (attributeName === undefined
                ? memoryRootSliceName
                : parentedPathSeparator + attributeName);
        let parents = this._getProxyParentedPath(sliceKey, ID);
        const index = parents.indexOf(path);
        if (!sliceLinkedParentOfProxy[ID as VersionableMemoryID]) {
            parents = sliceLinkedParentOfProxy[ID as VersionableMemoryID] = parents.slice();
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
            step.add.forEach((item: MemoryAllowedPrimitiveTypes) =>
                (obj as MemoryCompiledSet).add(item),
            );
            step.delete.forEach((item: MemoryAllowedPrimitiveTypes) =>
                (obj as MemoryCompiledSet).delete(item),
            );
        }
        return obj;
    }
    private _compiledObjectPatches(patches: patches): MemoryTypeObject {
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
    private _create(sliceKey: SliceKey, fromSliceKey: SliceKey): MemorySlice {
        const refs = this._slices;
        if (refs[sliceKey]) {
            throw new Error('The memory slice "' + sliceKey + '" already exists');
        }
        const parent = refs[fromSliceKey];
        const ref = (refs[sliceKey] = new MemorySlice(sliceKey, parent));
        if (parent) {
            parent.children.push(ref);
        }
        return ref;
    }
    private _getChangesPath(
        fromSliceKey: SliceKey,
        toSliceKey: SliceKey,
        ancestorKey: SliceKey,
    ): MemorySlice[] {
        const fromPath = [];
        let ref = this._slices[fromSliceKey];
        while (ref) {
            fromPath.push(ref);
            if (ref.name === ancestorKey) {
                break;
            }
            ref = ref.getPrevious();
        }

        const toPath = [];
        ref = this._slices[toSliceKey];
        while (ref) {
            if (ref.name === ancestorKey) {
                break;
            }
            toPath.push(ref);
            ref = ref.getPrevious();
        }
        toPath.reverse();
        return fromPath.concat(toPath);
    }
    private _getCommonAncestor(sliceKeyA: SliceKey, sliceKeyB: SliceKey): SliceKey {
        const rootB = this._slices[sliceKeyB];
        let refA = this._slices[sliceKeyA];
        while (refA) {
            let refB = rootB;
            while (refB) {
                if (refA.name === refB.name) {
                    return refA.name;
                }
                refB = refB.getPrevious();
            }
            refA = refA.getPrevious();
        }
    }
    private _getProxyParentedPath(sliceKey: SliceKey, ID: VersionableID): proxyAttributePath {
        // bubbling up magic for proxyParents
        let ref = this._slices[sliceKey];
        while (ref) {
            const slice = ref.linkedParentOfProxy;
            const path = slice && slice[ID as VersionableMemoryID];
            if (path) {
                return path;
            }
            ref = ref.parent;
        }
        return [];
    }
    private _getValue(sliceKey: string, ID: VersionableID): MemoryCompiled {
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
    private _getValueArray(sliceKey: string, ID: VersionableID, patches: patches): MemoryCompiled {
        const ref = this._slices[sliceKey];
        let owner: MemoryTypeArray;
        if (ref.data[ID as VersionableMemoryID]) {
            owner = patches.shift().value as MemoryTypeArray;
        }
        const value = this._compiledArrayPatches(patches);
        return new MemoryArrayCompiledWithPatch(
            value.patch,
            owner || new MemoryTypeArray(),
            value.props,
        );
    }
    private _getPatches(
        fromSliceKey: SliceKey,
        toSliceKey: string,
        ID: VersionableID,
    ): { patches: patches; type: string } {
        let ref = this._slices[toSliceKey];
        let type: string;
        const patches = [];
        while (ref && ref.name !== fromSliceKey) {
            const slice = ref.data;
            const value = slice && slice[ID as VersionableMemoryID];
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
    private _aggregateInvalidCaches(from: SliceKey, to: SliceKey): Set<VersionableMemoryID> {
        const invalidCache = new Set<number>();
        if (from === to) {
            return invalidCache;
        }
        const ancestorKey = this._getCommonAncestor(from, to);
        const refs = this._getChangesPath(from, to, ancestorKey);
        if (this._sliceKey === ancestorKey) {
            refs.shift();
        }
        while (refs.length) {
            const ref = refs.pop();
            Object.keys(ref.invalidCache).forEach(key => {
                // It was invalid before, it is still invalid now since it wasn't yet read
                invalidCache.add(+key);
            });
        }
        return invalidCache;
    }
    private _linkToMemory(proxy: MemoryAllowedObjectType): void {
        const params: VersionableParams = proxy[memoryProxyPramsKey];
        if (params.memory) {
            if (params.memory !== this._memoryWorker) {
                throw new MemoryError('This object is already linked to a other memory');
            }
            return;
        }

        const ID = params.ID as VersionableMemoryID;
        params.memory = this._memoryWorker;
        params.linkCallback(this._memoryWorker);
        this._proxies[ID] = proxy;

        if (params.isDiffRoot) {
            this._rootProxies[ID] = true;
        }

        this._currentSlice.ids.add(+ID);
    }
    private _remove(sliceKey: SliceKey): Set<VersionableMemoryID> {
        const IDs = [];
        let ref = this._slices[sliceKey];
        const index = ref.parent.children.indexOf(ref);
        ref.parent.children.splice(index, 1);

        const refs = [ref];
        while ((ref = refs.pop())) {
            const sliceKey = ref.name;
            ref.children.forEach(ref => refs.push(ref));
            Object.keys(ref.linkedParentOfProxy).forEach(ID => IDs.push(+ID));
            delete this._slices[sliceKey];
        }
        return new Set(IDs);
    }
    private _squashInto(
        fromSliceKey: SliceKey,
        unitSliceKey: SliceKey,
        intoSliceKey: SliceKey,
    ): void {
        const refs = this._slices;
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
            throw new Error('Can not merge the slices');
        }

        const intoLinkedParentOfProxy = refs[intoSliceKey].linkedParentOfProxy;
        const intoInvalidCache = refs[intoSliceKey].invalidCache;
        const intoSlices = intoRef.data;

        while ((ref = references.pop())) {
            const LinkedParentOfProxy = ref.linkedParentOfProxy;
            Object.keys(LinkedParentOfProxy).forEach(ID => {
                intoLinkedParentOfProxy[ID] = LinkedParentOfProxy[ID].slice();
            });

            Object.keys(ref.invalidCache).forEach(link => {
                intoInvalidCache[link] = true;
            });

            const slice = ref.data;
            Object.keys(slice).forEach(ID => {
                const id = +ID;
                const memoryItem = slice[id];
                if (memoryItem instanceof MemoryTypeArray) {
                    let intoItem = intoSlices[id] as MemoryTypeArray;
                    if (!intoItem) {
                        intoItem = intoSlices[id] = new MemoryTypeArray();
                    }
                    Object.assign(intoItem.patch, memoryItem.patch);
                    Object.assign(intoItem.props, memoryItem.props);
                } else if (memoryItem instanceof MemoryTypeSet) {
                    let intoItem = intoSlices[id] as MemoryTypeSet;
                    if (!intoItem) {
                        intoItem = intoSlices[id] = new MemoryTypeSet();
                    }
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
                    let intoItem = intoSlices[id] as MemoryTypeObject;
                    if (!intoItem) {
                        intoItem = intoSlices[id] = new MemoryTypeObject();
                    }
                    Object.assign(intoItem.props, memoryItem.props);
                }
            });
        }
    }
    private _autoSnapshot(): void {
        const refs = [];
        let ref = this._currentSlice;
        while (ref && ref.name) {
            refs.push(ref);
            ref = ref.parent;
        }
        if (refs.length > this._numberOfFlatSlices + this._numberOfSlicePerSnapshot) {
            const fromSliceKey = refs[refs.length - 1].name;
            const unitSliceKey = refs[refs.length - 1 - this._numberOfSlicePerSnapshot].name;
            const newSliceKey =
                unitSliceKey +
                '[snapshot from ' +
                fromSliceKey.replace(regExpoSnapshotOrigin, '$1') +
                ']';
            this.snapshot(fromSliceKey, unitSliceKey, newSliceKey);
        }
    }
}
