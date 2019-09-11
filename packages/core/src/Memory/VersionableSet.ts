import {
    MemoryAllowedType,
    MemoryAllowedPrimitiveTypes,
    MemoryWorker,
    MemoryTypeSet,
    MemoryCompiledSet,
} from './Memory';
import {
    VersionableID,
    _checkVersionable,
    VersionableParams,
    generateVersionableID,
    _stackedProxify,
} from './Versionable';

import { memoryProxyNotVersionableKey, memoryProxyPramsKey, FroozenError } from './const';

interface SetParams extends VersionableParams {
    size: number;
    object: Set<MemoryAllowedType>;
    proxy: VersionableSet;
}

// People can override the set methods. They will be called from the proxy, but
// sometimes we want to call the true original methods, not the override of the
// user. This is how we do it.
const genericSet = new Set() as Set<MemoryAllowedType>;
const genericSetPrototype = Set.prototype;

function setPrototype<T extends MemoryAllowedType = MemoryAllowedType>(
    proxy: VersionableSet<T>,
    obj: Set<T>,
): void {
    do {
        // This function loops on the prototypes of the object. This is what
        // stops it.
        // TODO refactor: while !== genericSetPrototype
        if (obj === genericSetPrototype) {
            break;
        }
        const op = Object.getOwnPropertyNames(obj);
        for (let i = 0; i < op.length; i++) {
            const prop = op[i]; // propName
            if (!proxy[prop]) {
                proxy[prop] = obj[prop];
            }
        }
    } while ((obj = Object.getPrototypeOf(obj)));
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
function nothing(): void {}

export class VersionableSet<T extends MemoryAllowedType = MemoryAllowedType> extends Set<T> {
    [memoryProxyPramsKey]: SetParams;
    constructor(params?: Set<T> | T[]) {
        super();
        let set: Set<T>; // original set (won't be synced, it's just for its method ex: overrides)
        let size = 0;
        if (!params) {
            set = genericSet as Set<T>;
        } else if (params instanceof Array) {
            set = genericSet as Set<T>;
            params.forEach(value => {
                size++;
                _stackedProxify(value, newValue => {
                    set.add.call(this, newValue);
                });
            });
        } else {
            if (params instanceof VersionableSet) {
                set = params[memoryProxyPramsKey].object as Set<T>;
            } else {
                set = params as Set<T>;
            }
            params.forEach(value => {
                size++;
                _stackedProxify(value, newValue => {
                    set.add.call(this, newValue);
                });
            });
            setPrototype(this, set);
        }

        this[memoryProxyPramsKey] = {
            ID: generateVersionableID(),
            linkCallback: linkVersionable,
            synchronize: nothing,
            MemoryType: MemoryTypeSet,
            verify: (proxy: MemoryAllowedType): boolean => proxy === this,
            size: size,
            object: set,
            proxy: this,
        };
    }

    add(item: T): this {
        // For Set specifically, this line will never actually *proxify* per se.
        // It will either work if the item is already proxified, or throw an
        // error if it is not.
        _checkVersionable(item);

        const params = this[memoryProxyPramsKey];
        const memory = params.memory;
        if (memory && memory.isFrozen()) {
            throw new FroozenError();
        }

        const check = this.has(item);
        if (!check) {
            params.object.add.call(this, item);
        }

        if (check || !memory) {
            // Nothing changed. Either the item was already there, or we don't
            // care because we are not linked to memory.
            return this;
        }

        let memoryItem = item as MemoryAllowedPrimitiveTypes;
        if (item !== null && typeof item === 'object' && !item[memoryProxyNotVersionableKey]) {
            // The item is versionable, great, but it is not versioned yet !
            // This call versions it into the memory.
            memory.linkToMemory(item as object);
            const itemParams = item[memoryProxyPramsKey];
            memoryItem = itemParams.ID;
            memory.addSliceProxyParent(itemParams.ID, params.ID, undefined);
        }

        // Get current slice.
        const slice = memory.getSlice();
        let memorySet = slice[params.ID as number] as MemoryTypeSet; // read the pure value stored in memory
        if (!memorySet) {
            slice[params.ID as number] = memorySet = new MemoryTypeSet();
            // Mark the set as being modified in this slice (not necesarilly "dirty")
            memory.markDirty(params.ID); // mark the cache as invalid when change the slide memory
        }
        // Update the stored changes for this slice
        memorySet.add.add(memoryItem);
        memorySet.delete.delete(memoryItem);

        return this;
    }
    delete(item: T): boolean {
        const params = this[memoryProxyPramsKey];
        const memory = params.memory;
        if (memory && memory.isFrozen()) {
            throw new FroozenError();
        }

        const check = this.has(item);
        if (check) {
            params.object.delete.call(this, item);
        }

        if (!check || !memory) {
            return check;
        }

        let memoryItem = item as MemoryAllowedPrimitiveTypes;
        const itemParams = item && typeof item === 'object' && item[memoryProxyPramsKey];
        if (itemParams) {
            memoryItem = itemParams.ID as VersionableID;
            memory.deleteSliceProxyParent(itemParams.ID, params.ID, undefined);
        }

        const slice = memory.getSlice();
        let memorySet = slice[params.ID as number] as MemoryTypeSet;
        if (!memorySet) {
            slice[params.ID as number] = memorySet = new MemoryTypeSet();
        }
        memorySet.delete.add(memoryItem);
        memorySet.add.delete(memoryItem);

        memory.markDirty(params.ID); // mark the cache as invalid when change the slide memory

        return check;
    }
    clear(): this {
        const params = this[memoryProxyPramsKey];
        const memory = params.memory;
        if (memory && memory.isFrozen()) {
            throw new FroozenError();
        }
        if (this.size === 0) {
            return this;
        }

        if (!memory) {
            params.object.clear.call(this);
            return this;
        }

        const slice = memory.getSlice();
        let memorySet = slice[params.ID as number] as MemoryTypeSet;
        if (!memorySet) {
            slice[params.ID as number] = memorySet = new params.MemoryType() as MemoryTypeSet;
        }

        params.object.forEach.call(this, (item: T) => {
            const itemParams = item && typeof item === 'object' && item[memoryProxyPramsKey];
            if (itemParams) {
                item = itemParams.ID;
                memory.deleteSliceProxyParent(itemParams.ID, params.ID, undefined);
            }
            memorySet.delete.add(item);
            memorySet.add.delete(item);
        });
        params.object.clear.call(this);

        memory.markDirty(params.ID); // mark the cache as invalid when change the slide memory
        return this;
    }
    has(item: T): boolean {
        const params = this[memoryProxyPramsKey];
        return params.object.has.call(this, item);
    }
    values(): IterableIterator<T> {
        const params = this[memoryProxyPramsKey];
        return params.object.values.call(this);
    }
    keys(): IterableIterator<T> {
        const params = this[memoryProxyPramsKey];
        return params.object.keys.call(this);
    }
    forEach(callback: (value: T, value2: T, set: Set<T>) => void): void {
        const params = this[memoryProxyPramsKey];
        return params.object.forEach.call(this, callback);
    }
    entries(): IterableIterator<[T, T]> {
        const params = this[memoryProxyPramsKey];
        return params.object.entries.call(this);
    }
}

function proxifySyncSet(): void {
    // Synchronization function
    // Most methods of the "proxy" will call this synchronization function, even
    // if it is not yet linked to a memory !
    const params = this as SetParams;
    const memory = params.memory;
    const object = params.object;
    const proxy = params.proxy;
    // get current object state in memory
    const memorySet = memory.getSliceValue(params.ID) as MemoryCompiledSet;

    // reset all keys (+ explanation of best/worst case scenario)
    object.clear.call(proxy);
    if (!memorySet) {
        return;
    }
    // Update values according to what is stored
    memorySet.forEach(item => {
        if (item instanceof VersionableID) {
            item = memory.getProxy(item);
        }
        object.add.call(proxy, item);
    });
}

// This will be set on the versionable params object and called with the params
// as the value of `this`. It is created here so that it is created only once !
function linkVersionable(memory: MemoryWorker): void {
    const params = this as SetParams;
    params.memory = memory;
    params.synchronize = proxifySyncSet;
    memory.markDirty(params.ID);
    if (!params.proxy.size) {
        return;
    }
    const slice = memory.getSlice();

    const memorySet = new params.MemoryType() as MemoryTypeSet;
    slice[params.ID as number] = memorySet; // store the "pure" value in memory
    params.object.forEach.call(params.proxy, (value: MemoryAllowedType): void => {
        const valueParams =
            value !== null && typeof value === 'object' && value[memoryProxyPramsKey];
        if (valueParams) {
            // If object is versionable then link it to memory as well
            memory.linkToMemory(value as object);
            memory.addSliceProxyParent(valueParams.ID, params.ID, undefined);
            memorySet.add.add(valueParams.ID);
        } else {
            memorySet.add.add(value);
        }
    });
}

export function _proxifySet<T extends MemoryAllowedType>(set: Set<T>): VersionableSet {
    const versionableSet = new VersionableSet(set);
    set[memoryProxyPramsKey] = versionableSet[memoryProxyPramsKey];
    return versionableSet;
}
