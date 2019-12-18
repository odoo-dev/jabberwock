import { MemoryVersionable, LinkedID, typeLinkedID, MemoryCompiled } from './Versionable';
import { removedItem, memoryProxyPramsKey, NotVersionableErrorMessage } from './const';

import { MemoryTypeObject, MemoryCompiledObject } from './VersionableObject';
import { MemoryTypeArray, MemoryArrayCompiledWithPatch } from './VersionableArray';
import { MemoryTypeSet, MemoryCompiledSet } from './VersionableSet';
import { MemoryDiffArray } from './MemoryDiffArray';

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
export type MemoryTypeValues = string | number | boolean | typeLinkedID | object | symbol; // object must to be LinkedID
export type MemoryType = MemoryTypeObject | MemoryTypeArray | MemoryTypeSet;
export type patches = { sliceKey: sliceKey; value: MemoryType }[];
type proxyAttributePath = string[];

export type PrePath = [
    [number, string, (number | string)],
    ...[number, string, (number | string)][],
];
type Path = [object, ...string[]];
export interface PreDiffChange {
    paths: PrePath[];
    type: 'attribute' | 'values' | 'set';
    old?: MemoryTypeValues | object;
    new?: MemoryTypeValues | object;
    add?: Set<MemoryTypeValues>;
    delete?: Set<MemoryTypeValues>;
}
interface DiffChange {
    paths: Path[];
    type: 'attribute' | 'values' | 'set';
    old?: MemoryTypeValues | object;
    new?: MemoryTypeValues | object;
    add?: Set<MemoryTypeValues>;
    delete?: Set<MemoryTypeValues>;
}
type DiffRootChange = {
    path: string[];
    change: DiffChange;
};
export type DiffRoot = Record<
    string,
    {
        target: object;
        changes: DiffRootChange[];
    }
>;

export type Diff = Record<string, DiffChange>;
export const diffSeparator = '•';
const proxyParentsRegExp = new RegExp('^(.*?)(' + diffSeparator + '(.*))?$');

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
    children: MemoryReference[];
    snapshotParented?: MemoryReference;
    snapshotChild?: MemoryReference;
    constructor(name: sliceKey, parent?: MemoryReference) {
        this.name = name;
        this.parent = parent;
        this.children = [];
    }
    previous(): MemoryReference {
        return this.snapshotParented ? this.snapshotParented.parent : this.parent;
    }
}

export class Memory {
    _id: number;
    _sliceKey: sliceKey; // identifier or current memory slice
    _slicesReference: Record<sliceKey, MemoryReference> = {}; // Record<children, parent>
    _sliceReference: MemoryReference; // Record<children, parent>
    _slices: Record<sliceKey, Record<typeLinkedID, MemoryType>> = {}; // registry of values by slices
    _slice: Record<typeLinkedID, MemoryType>;
    _slicesLinkedParentOfProxy: Record<sliceKey, Record<typeLinkedID, proxyAttributePath>> = {};
    _slicesInvalideCache: Record<sliceKey, Record<typeLinkedID, boolean>> = {}; // paths that have been changed in given memory slice (when switching slice, this set is loaded in _invalidCache)
    _sliceInvalideCache: Record<typeLinkedID, boolean>;
    _invalideCache: Record<typeLinkedID, boolean> = {}; // paths which have been set but not read again yet (after the set)
    _proxies: Record<typeLinkedID, object> = {};
    _rootProxies: Record<typeLinkedID, boolean> = {};
    _memoryVersionable: MemoryVersionable;
    _isMemoryLinkProcess = false;
    _numberOfFlatSlices = 40;
    _numberOfSlicePerSnapshot = 8;

    constructor() {
        this._id = ++memoryID;
        this._create('', '');
        this.switchTo('');
        this._memoryVersionable = {
            ID: this._id,
            getProxy: (ID: typeLinkedID): object => this._proxies[ID],
            getSlice: (): Record<typeLinkedID, MemoryType> => this._slice,
            getSliceValue: (ID: typeLinkedID): MemoryCompiled => this._getValue(this._sliceKey, ID),
            isFrozen: (): boolean => this._sliceReference.children.length > 0,
            // Is currently dirty (we may have switched from a slice to a very
            // different one, thus setting "dirty" on a lot of objects along the
            // way, all the ones that were modified at one point)
            // Is your proxy unsynchronized
            isDirty: (ID: typeLinkedID): boolean => this._invalideCache[ID],
            // Mark as "modified" in this slice
            markDirty: (ID: typeLinkedID): boolean => (this._sliceInvalideCache[ID] = true),
            // I am the proxy, I tell you I synchornized the value
            markAsLoaded: (ID: typeLinkedID): boolean => (this._invalideCache[ID] = false),
            deleteSliceProxyParent: this._deleteSliceProxyParent.bind(this),
            addSliceProxyParent: this._addSliceProxyParent.bind(this),
            linkToMemory: this._linkToMemory.bind(this),
        };
    }

    autoSnapshot(): void {
        const refs = [];
        let ref = this._sliceReference;
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
        const refs = this._slicesReference;
        const fromRref = refs[fromSliceKey];
        const untilRref = refs[unitSliceKey];
        const toRemove = fromRref.children.slice().map(ref => ref.name);
        fromRref.children = untilRref.children.splice(0);
        this.snapshotIntoExistingSlice(fromSliceKey, unitSliceKey, fromSliceKey);
        let key: sliceKey;
        while ((key = toRemove.pop())) {
            this._remove(key);
        }
        return true;
    }
    create(sliceKey: sliceKey): Memory {
        this._create(sliceKey, this._sliceKey);
        return this;
    }
    diff(fromSliceKey: sliceKey, toSliceKey: sliceKey): Diff {
        if (!(fromSliceKey in this._slicesReference)) {
            throw new Error('You must create the "' + fromSliceKey + '" slice before try to diff');
        }
        if (!(toSliceKey in this._slicesReference)) {
            throw new Error('You must create the "' + toSliceKey + '" slice before try to diff');
        }
        const ancestorKey = this._getCommonAncestor(fromSliceKey, toSliceKey);
        const path = this._getChangesPath(fromSliceKey, toSliceKey, ancestorKey);
        const dirtyProxIDs: Set<typeLinkedID> = new Set();
        // for each slice in the path, look at the properties/values that have been changed in memory
        while (path.length) {
            const pathKey = path.pop();
            Object.keys(this._slices[pathKey]).forEach(linkedID => {
                dirtyProxIDs.add(+linkedID as typeLinkedID);
            });
        }

        const changes: PreDiffChange[] = [];

        dirtyProxIDs.forEach((ID: typeLinkedID) => {
            const path = this._getAttributePath(toSliceKey, ID);
            if (!path.length) {
                return;
            }
            const newPatch = this._getPatches(ancestorKey, toSliceKey, ID);
            const oldPatch = this._getPatches(ancestorKey, fromSliceKey, ID);
            if (!newPatch && !oldPatch) {
                return;
            }
            if ((newPatch || oldPatch).type === 'set') {
                changes.push(
                    ...this._diffSet(
                        path,
                        oldPatch && oldPatch.type === 'set' && oldPatch.patches,
                        newPatch && newPatch.patches,
                        ancestorKey,
                        ID,
                    ),
                );
            } else if ((newPatch || oldPatch).type === 'array') {
                changes.push(
                    ...this._diffArray(
                        path,
                        oldPatch && oldPatch.type === 'array' && oldPatch.patches,
                        newPatch && newPatch.patches,
                        ancestorKey,
                        ID,
                    ),
                );
            } else {
                changes.push(
                    ...this._diffObject(
                        path,
                        oldPatch && oldPatch.type === 'object' && oldPatch.patches,
                        newPatch && newPatch.patches,
                        ancestorKey,
                        ID,
                    ),
                );
            }
        });

        return this._addPathOnChanges(changes, toSliceKey);
    }
    linkToMemory(proxy: AllowedObject): void {
        const params = proxy[memoryProxyPramsKey];
        if (!params || params.proxy !== proxy) {
            return NotVersionableErrorMessage();
        }
        if (params.memory !== this._memoryVersionable) {
            params.willBeRootDiff = true;
            this._linkToMemory(proxy);
        }
        const ID = params.ID;
        this._rootProxies[ID] = true;
    }
    remove(sliceKey: sliceKey): Memory {
        if (!(sliceKey in this._slices)) {
            return this;
        }
        if (sliceKey === '') {
            throw new Error('You should not remove the original memory slice');
        }

        let ref = this._slicesReference[this._sliceKey];
        while (ref) {
            if (ref.name === sliceKey) {
                CanNotRemoveSliceBeforeSwitch();
            }
            ref = ref.parent;
        }

        const IDs = this._remove(sliceKey);
        // check if the IDs are linked evrywere
        Object.keys(this._slicesLinkedParentOfProxy).forEach(sliceKey => {
            const slice = this._slicesLinkedParentOfProxy[sliceKey];
            IDs.forEach(ID => {
                if (ID in slice) {
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
        let ref = this._slicesReference[sliceKey];
        while (ref && ref.name) {
            sliceKeys.push(ref.name);
            ref = withoutSnapshot ? ref.previous() : ref.parent;
        }
        return sliceKeys;
    }
    switchTo(sliceKey: sliceKey): Memory {
        if (!(sliceKey in this._slices)) {
            throw new Error('You must create the "' + sliceKey + '" slice before switch on it');
        }
        if (sliceKey === this._sliceKey) {
            return;
        }
        const ancestorKey = this._getCommonAncestor(this._sliceKey, sliceKey);
        const path = this._getChangesPath(this._sliceKey, sliceKey, ancestorKey);

        if (this._sliceKey === ancestorKey) {
            path.shift();
        }

        while (path.length) {
            const pathKey = path.pop();
            Object.keys(this._slicesInvalideCache[pathKey]).forEach(key => {
                // It was invalid before, it is still invalid now since it wasn't yet read
                this._invalideCache[key] = true;
            });
        }
        this._sliceKey = sliceKey;
        this._slice = this._slices[this._sliceKey];
        this._sliceInvalideCache = this._slicesInvalideCache[this._sliceKey];
        this._sliceReference = this._slicesReference[this._sliceKey];
        return this;
    }
    snapshot(fromSliceKey: sliceKey, unitSliceKey: sliceKey, newSliceKey: sliceKey): void {
        const refs = this._slicesReference;
        const fromRref = refs[fromSliceKey];
        const untilRref = refs[unitSliceKey];

        const newRef = this._create(newSliceKey, fromRref.parent && fromRref.parent.name);
        this.snapshotIntoExistingSlice(fromSliceKey, unitSliceKey, newRef.name);

        untilRref.children.forEach(child => {
            child.parent = newRef;
        });
        newRef.children = untilRref.children;
        untilRref.children = [];
        untilRref.snapshotChild = newRef;
        newRef.snapshotParented = untilRref;
    }
    snapshotIntoExistingSlice(
        fromSliceKey: sliceKey,
        unitSliceKey: sliceKey,
        intoSliceKey: sliceKey,
    ): void {
        const refs = this._slicesReference;
        const fromRref = refs[fromSliceKey];
        const untilRref = refs[unitSliceKey];

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

        const _slicesLinkedParentOfProxy = this._slicesLinkedParentOfProxy;
        const intoLinkedParentOfProxy = _slicesLinkedParentOfProxy[intoSliceKey];
        const _slicesInvalideCache = this._slicesInvalideCache;
        const intoInvalideCache = _slicesInvalideCache[intoSliceKey];
        const _slices = this._slices;
        const intoSlices = _slices[intoSliceKey];

        while ((ref = references.pop())) {
            const sliceKey = ref.name;
            const LinkedParentOfProxy = _slicesLinkedParentOfProxy[sliceKey];
            Object.keys(LinkedParentOfProxy).forEach(ID => {
                intoLinkedParentOfProxy[ID] = LinkedParentOfProxy[ID].slice();
            });

            Object.keys(_slicesInvalideCache[sliceKey]).forEach(link => {
                intoInvalideCache[link] = true;
            });

            const slice = _slices[sliceKey];
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
                    Object.assign(intoItem, memoryItem);
                }
            });
        }
    }

    /////////////////////////////////////////////////////
    // private
    /////////////////////////////////////////////////////

    _addSliceProxyParent(ID: typeLinkedID, parentID: typeLinkedID, attributeName: string): void {
        const sliceKey = this._sliceKey;
        const sliceLinkedParentOfProxy = this._slicesLinkedParentOfProxy[sliceKey];
        const path = parentID + (attributeName === undefined ? '' : diffSeparator + attributeName);
        let parents = sliceLinkedParentOfProxy[ID];
        if (!parents) {
            const parented = !this._isMemoryLinkProcess && this._getProxyParentedPath(sliceKey, ID);
            parents = sliceLinkedParentOfProxy[ID] = parented ? parented.slice() : [];
        }
        parents.push(path);
    }
    _deleteSliceProxyParent(ID: typeLinkedID, parentID: typeLinkedID, attributeName: string): void {
        const sliceKey = this._sliceKey;
        const path = parentID + (attributeName === undefined ? '' : diffSeparator + attributeName);
        let parents = this._getProxyParentedPath(sliceKey, ID);
        const index = parents.indexOf(path);
        if (!this._slicesLinkedParentOfProxy[sliceKey][ID]) {
            parents = this._slicesLinkedParentOfProxy[sliceKey][ID] = parents.slice();
        }
        parents.splice(index, 1);
    }
    _compiledArrayPatches(patches: patches): MemoryTypeArray {
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
    _compiledSetPatches(patches: patches): MemoryCompiledSet {
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
    _compiledObjectPatches(patches: patches): MemoryCompiledObject {
        const obj = {} as MemoryCompiledObject;
        while (patches.length) {
            const patch = patches.pop();
            const step = patch.value as MemoryTypeObject;
            Object.assign(obj, step);
        }
        Object.keys(obj).forEach(key => {
            if (obj[key] === removedItem) {
                delete obj[key];
            }
        });
        return obj;
    }
    _create(sliceKey: sliceKey, fromSliceKey: sliceKey): MemoryReference {
        if (this._slices[sliceKey]) {
            throw new Error('The memory slice "' + sliceKey + '" already exists');
        }
        const refs = this._slicesReference;
        const parent = refs[fromSliceKey];
        const ref = (refs[sliceKey] = new MemoryReference(sliceKey, parent));
        if (parent) {
            parent.children.push(refs[sliceKey]);
        }
        this._slices[sliceKey] = {};
        this._slicesLinkedParentOfProxy[sliceKey] = {};
        this._slicesInvalideCache[sliceKey] = {};
        return ref;
    }
    _diffArray(
        parented: PrePath[],
        oldPatches: patches,
        newPatches: patches,
        ancestorKey: sliceKey,
        ID: typeLinkedID,
    ): PreDiffChange[] {
        const patches = this._getPatches(undefined, ancestorKey, ID);
        const diff = new MemoryDiffArray(
            parented,
            ID,
            oldPatches,
            newPatches,
            patches ? this._compiledArrayPatches(patches.patches) : { patch: {}, props: {} },
            this._diffValueToObject.bind(this),
        );
        return diff.getChanges();
    }
    _diffObject(
        parented: PrePath[],
        oldPatches: patches,
        newPatches: patches,
        ancestorKey: sliceKey,
        ID: typeLinkedID,
    ): PreDiffChange[] {
        const changes: PreDiffChange[] = [];
        const ancestorValue = this._getValue(ancestorKey, ID);
        const newValue = Object.assign({}, ancestorValue);
        while (newPatches && newPatches.length) {
            Object.assign(newValue, newPatches.pop().value);
        }
        const oldValue = Object.assign({}, ancestorValue);
        while (oldPatches && oldPatches.length) {
            Object.assign(oldValue, oldPatches.pop().value);
        }
        Object.keys(newValue).forEach(key => {
            if (oldValue[key] === newValue[key]) {
                return;
            }
            const change: PreDiffChange = {
                paths: parented.map(
                    (path): PrePath => {
                        return path.concat([[ID, 'attributes', key]]) as PrePath;
                    },
                ),
                type: 'attribute',
            };
            if (key in oldValue && oldValue[key] !== removedItem) {
                change.old = this._diffValueToObject(oldValue[key]);
            }
            if (newValue[key] !== removedItem) {
                change.new = this._diffValueToObject(newValue[key]);
            }
            changes.push(change);
        });
        Object.keys(oldValue).forEach(key => {
            if (oldValue[key] === removedItem || key in newValue) {
                return;
            }
            const change: PreDiffChange = {
                paths: parented.map(
                    (path): PrePath => {
                        return path.concat([[ID, 'attributes', key]]) as PrePath;
                    },
                ),
                type: 'attribute',
                old: this._diffValueToObject(oldValue[key]),
            };
            changes.push(change);
        });
        return changes;
    }
    _addPathOnChanges(changes: PreDiffChange[], toSliceKey: sliceKey): Diff {
        const allChanges: Record<string, DiffChange> = {};
        const arrays: Record<string, string[]> = {};

        changes.forEach(change => {
            const alterateChange = {
                paths: [],
                type: change.type,
            } as DiffChange;

            if ('old' in change) {
                alterateChange.old = change.old;
            }
            if ('new' in change) {
                alterateChange.new = change.new;
            }
            if ('add' in change) {
                alterateChange.add = change.add;
            }
            if ('delete' in change) {
                alterateChange.delete = change.delete;
            }
            alterateChange.paths.push(
                ...change.paths.map(prePath => {
                    const path = this._diffPreparePath(toSliceKey, arrays, prePath);

                    const ID = prePath[0][0];
                    const rootPath = path.slice(1) as string[];

                    let pathName = ID.toString();
                    pathName += diffSeparator + rootPath.join(diffSeparator);
                    allChanges[pathName] = alterateChange;

                    return path;
                }),
            );
        });

        return allChanges;
    }
    _diffPreparePath(
        toSliceKey: sliceKey,
        arrays: Record<string, string[]>,
        prePath: PrePath,
    ): Path {
        const ID = prePath[0][0];
        const proxy = this._proxies[ID];

        const path: Path = [proxy];
        prePath.forEach(([ID, type, prop]) => {
            if (type === 'values') {
                path.push('values');
                if (prop !== undefined) {
                    path.push(prop.toString());
                }
            } else if (type === 'attributes') {
                if (prop[0] === '´') {
                    if (!arrays[ID]) {
                        const patch = this._getPatches(undefined, toSliceKey, ID);
                        const patches = patch.patches;
                        const arrayPatches = {};
                        while (patches.length) {
                            const patch = patches.pop();
                            const step = patch.value as MemoryTypeArray;
                            Object.assign(arrayPatches, step.patch);
                        }
                        arrays[ID] = [];
                        Object.keys(arrayPatches).forEach(key => {
                            arrays[ID].push(key);
                        });
                        arrays[ID].sort();
                    }
                    const index = arrays[ID].indexOf((prop as string).slice(1));
                    path.push(index.toString());
                } else {
                    path.push(prop.toString());
                }
            }
        });

        return path;
    }
    _diffSet(
        parented: PrePath[],
        oldPatches: patches,
        newPatches: patches,
        ancestorKey: sliceKey,
        ID: typeLinkedID,
    ): PreDiffChange[] {
        const oldAdd = new Set() as MemoryCompiledSet;
        const oldDelete = new Set() as MemoryCompiledSet;
        while (oldPatches && oldPatches.length) {
            const patch = oldPatches.pop();
            const step = patch.value as MemoryTypeSet;
            step.add.forEach((item: MemoryTypeValues) => {
                oldAdd.add(item);
                oldDelete.delete(item);
            });
            step.delete.forEach((item: MemoryTypeValues) => {
                oldAdd.delete(item);
                oldDelete.add(item);
            });
        }
        const newAdd = new Set() as MemoryCompiledSet;
        const newDelete = new Set() as MemoryCompiledSet;
        while (newPatches && newPatches.length) {
            const patch = newPatches.pop();
            const step = patch.value as MemoryTypeSet;
            step.add.forEach((item: MemoryTypeValues) => {
                newAdd.add(item);
                newDelete.delete(item);
            });
            step.delete.forEach((item: MemoryTypeValues) => {
                newAdd.delete(item);
                newDelete.add(item);
            });
        }
        const resultAdd = new Set() as MemoryCompiledSet;
        const resultDelete = new Set() as MemoryCompiledSet;
        newAdd.forEach(item => {
            if (!oldAdd.has(item)) {
                resultAdd.add(this._diffValueToObject(item));
            }
        });
        newDelete.forEach(item => {
            if (!oldDelete.has(item)) {
                resultDelete.add(this._diffValueToObject(item));
            }
        });
        oldAdd.forEach(item => {
            if (!newAdd.has(item)) {
                resultDelete.add(this._diffValueToObject(item));
            }
        });
        oldDelete.forEach(item => {
            if (!newDelete.has(item)) {
                resultAdd.add(this._diffValueToObject(item));
            }
        });
        if (!resultAdd.size && !resultDelete.size) {
            return [];
        }
        return [
            {
                paths: parented.map(
                    (path): PrePath => {
                        const newPath = [[ID, 'values', undefined]] as PrePath;
                        newPath.unshift(...path);
                        return newPath;
                    },
                ),
                type: 'set',
                add: resultAdd,
                delete: resultDelete,
            },
        ];
    }
    _diffValueToObject(value: MemoryTypeValues | object): MemoryTypeValues | object {
        if (value && value instanceof LinkedID) {
            return this._proxies[+value];
        }
        return value;
    }
    _getChangesPath(
        fromSliceKey: sliceKey,
        toSliceKey: sliceKey,
        ancestorKey: sliceKey,
    ): sliceKey[] {
        const fromPath = [];
        let ref = this._slicesReference[fromSliceKey];
        while (ref) {
            fromPath.push(ref.name);
            if (ref.name === ancestorKey) {
                break;
            }
            ref = ref.previous();
        }

        const toPath = [];
        ref = this._slicesReference[toSliceKey];
        while (ref) {
            if (ref.name === ancestorKey) {
                break;
            }
            toPath.push(ref.name);
            ref = ref.previous();
        }
        toPath.reverse();
        return fromPath.concat(toPath);
    }
    _getCommonAncestor(sliceKeyA: sliceKey, sliceKeyB: sliceKey): sliceKey {
        const rootB = this._slicesReference[sliceKeyB];
        let refA = this._slicesReference[sliceKeyA];
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
    _getProxyParentedPath(sliceKey: sliceKey, ID: typeLinkedID): proxyAttributePath {
        // bubbling up magic for proxyParents
        let ref = this._slicesReference[sliceKey];
        while (ref) {
            const slice = this._slicesLinkedParentOfProxy[ref.name];
            const path = slice && slice[ID];
            if (path) {
                return path;
            }
            ref = ref.parent;
        }
        return this._slicesLinkedParentOfProxy[sliceKey][ID];
    }
    _getValue(sliceKey: string, ID: typeLinkedID): MemoryCompiled {
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
    _getValueArray(sliceKey: string, ID: typeLinkedID, patches: patches): MemoryCompiled {
        let owner: MemoryTypeArray;
        if (this._slices[sliceKey][ID]) {
            owner = patches.shift().value as MemoryTypeArray;
        }
        const value = this._compiledArrayPatches(patches);
        return new MemoryArrayCompiledWithPatch(
            value.patch,
            value.props,
            owner || new MemoryTypeArray(),
        );
    }
    _getPatches(
        fromSliceKey: sliceKey,
        toSliceKey: string,
        ID: typeLinkedID,
    ): { patches: patches; type: string } {
        let ref = this._slicesReference[toSliceKey];
        let type: string;
        const patches = [];
        while (ref && ref.name !== fromSliceKey) {
            const slice = this._slices[ref.name];
            const value = slice && slice[ID];
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
    _getParent(sliceKey: string, ID: typeLinkedID): proxyAttributePath {
        // bubbling up magic for true, non-proxified values in memory
        let ref = this._slicesReference[sliceKey];
        while (ref) {
            const slice = this._slicesLinkedParentOfProxy[ref.name];
            if (slice && ID in slice) {
                return slice[ID];
            }
            ref = ref.parent;
        }
    }
    _getAttributePath(sliceKey: string, ID: typeLinkedID): PrePath[] {
        const parented: PrePath[] = [];
        const getParented = (ID: typeLinkedID, allPath: PrePath): void => {
            if (this._rootProxies[ID]) {
                allPath.unshift([ID, undefined, undefined]);
                parented.push(allPath);
                return;
            }
            const parents = this._getParent(sliceKey, ID);
            if (parents && parents.length) {
                parents.forEach((path: string): void => {
                    const split = path.match(proxyParentsRegExp);
                    const ID = +split[1];
                    const newAllPath: PrePath = [[ID, 'attributes', split[3]]];
                    newAllPath.push(...allPath);
                    getParented(ID, newAllPath);
                });
            }
        };
        getParented(ID, ([] as unknown) as PrePath);
        return parented;
    }
    _linkToMemory(proxy: AllowedObject): void {
        if (typeof proxy === 'function') {
            return;
        }
        const params = proxy[memoryProxyPramsKey];
        if (params.memory) {
            if (params.memory !== this._memoryVersionable) {
                VersionableAllreadyLinkedErrorMessage();
            }
            return;
        }

        const ID = params.ID;
        params.memory = this._memoryVersionable;
        this._isMemoryLinkProcess = true;
        params.linkCallback(this._memoryVersionable);
        this._isMemoryLinkProcess = false;
        this._proxies[ID] = proxy;

        if (params.willBeRootDiff) {
            this._rootProxies[ID] = true;
        }
    }
    _remove(sliceKey: sliceKey): Set<number> {
        const IDs = [];
        let ref = this._slicesReference[sliceKey];
        const index = ref.parent.children.indexOf(ref);
        ref.parent.children.splice(index, 1);

        const _slices = this._slices;
        const _slicesLinkedParentOfProxy = this._slicesLinkedParentOfProxy;
        const _slicesInvalideCache = this._slicesInvalideCache;
        const _slicesReferences = this._slicesReference;

        const refs = [ref];
        while ((ref = refs.pop())) {
            const sliceKey = ref.name;
            ref.children.forEach(ref => refs.push(ref));
            Object.keys(_slicesLinkedParentOfProxy[sliceKey]).forEach(ID => IDs.push(+ID));
            delete _slices[sliceKey];
            delete _slicesLinkedParentOfProxy[sliceKey];
            delete _slicesInvalideCache[sliceKey];
            delete _slicesReferences[sliceKey];
        }
        return new Set(IDs);
    }
}
