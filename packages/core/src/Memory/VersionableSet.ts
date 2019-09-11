import {
    AllowedMemory,
    MemoryTypeValues,
    MemoryVersionable,
    MemoryTypeSet,
    MemoryCompiledSet,
} from './Memory';
import {
    ProxyUniqID,
    checkIfProxy,
    VersionableParams,
    generateMemoryID,
    stackedProxify,
} from './Versionable';

import { memoryProxyNotVersionableKey, memoryProxyPramsKey, FroozenErrorMessage } from './const';

interface SetParams extends VersionableParams {
    size: number;
    object: Set<AllowedMemory>;
    proxy: VersionableSet;
}

// People can override the set methods. They will be called from the proxy, but
// sometimes we want to call the true original methods, not the override of the
// user. This is how we do it.
const genericSet = new Set() as Set<AllowedMemory>;
const genericSetPrototype = Set.prototype;

function setPrototype<T extends AllowedMemory = AllowedMemory>(
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

export class VersionableSet<T extends AllowedMemory = AllowedMemory> extends Set<T> {
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
                stackedProxify(value, newValue => {
                    set.add.call(this, newValue);
                });
            });
        } else {
            set = params as Set<T>;
            set.forEach(value => {
                size++;
                stackedProxify(value, newValue => {
                    set.add.call(this, newValue);
                });
            });
            setPrototype(this, params);
        }

        this[memoryProxyPramsKey] = {
            ID: generateMemoryID(),
            linkCallback: linkVersionable,
            sync: nothing,
            MemoryType: MemoryTypeSet,
            itsme: (proxy: AllowedMemory): boolean => proxy === this,
            size: size,
            object: set,
            proxy: this,
        };
    }

    get size(): number {
        const params = this[memoryProxyPramsKey];
        params.sync();
        return params.size;
    }
    add(item: T): this {
        // For Set specifically, this line will never actually *proxify* per se.
        // It will either work if the item is already proxified, or throw an
        // error if it is not.
        item = checkIfProxy(item);

        const params = this[memoryProxyPramsKey];
        const memory = params.memory;
        if (memory && memory.isFrozen()) {
            FroozenErrorMessage();
        }

        params.sync();

        const check = this.has(item);
        if (!check) {
            params.size++;
            params.object.add.call(this, item);
        }

        if (check || !memory) {
            // Nothing changed. Either the item was already there, or we don't
            // care because we are not linked to memory.
            return this;
        }

        let memoryItem = item as MemoryTypeValues;
        if (item !== null && typeof item === 'object' && !item[memoryProxyNotVersionableKey]) {
            // The item is versionable, great, but it is not versioned yet !
            // This call versions it into the memory.
            memory.linkToMemory(item as object);
            const itemParams = item[memoryProxyPramsKey];
            memoryItem = itemParams.ID;
            memory.addSliceProxyParent(itemParams.ID, params.ID, undefined);
        }

        // get current slice
        const slice = memory.getSlice();
        let memorySet: MemoryTypeSet = slice[params.ID as number]; // read the pure value stored in memory
        if (!memorySet) {
            slice[params.ID as number] = memorySet = new MemoryTypeSet();
            // Mark the set as being modified in this slice (not necesarilly "dirty")
            memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
        }
        // Update the stored changes for this slice
        memorySet.add.add(memoryItem);
        memorySet.delete.delete(memoryItem);

        return this;
    }
    delete(item: T): boolean {
        // TODO: check if it would be possible to generalize a lot of these
        // functions ?
        const params = this[memoryProxyPramsKey];
        const memory = params.memory;
        if (memory && memory.isFrozen()) {
            FroozenErrorMessage();
        }

        params.sync();

        const check = this.has(item);
        if (check) {
            params.size--;
            params.object.delete.call(this, item);
        }

        if (!check || !memory) {
            return check;
        }

        let memoryItem = item as MemoryTypeValues;
        const itemParams = item && typeof item === 'object' && item[memoryProxyPramsKey];
        if (itemParams) {
            memoryItem = itemParams.ID as ProxyUniqID;
            memory.deleteSliceProxyParent(itemParams.ID, params.ID, undefined);
        }

        const slice = memory.getSlice();
        let memorySet: MemoryTypeSet = slice[params.ID as number];
        if (!memorySet) {
            slice[params.ID as number] = memorySet = new MemoryTypeSet();
        }
        memorySet.delete.add(memoryItem);
        memorySet.add.delete(memoryItem);

        memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory

        return check;
    }
    clear(): this {
        const params = this[memoryProxyPramsKey];
        const memory = params.memory;
        if (memory && memory.isFrozen()) {
            FroozenErrorMessage();
        }
        params.sync();
        if (params.size === 0) {
            return this;
        }

        params.size = 0;

        if (!memory) {
            params.object.clear.call(this);
            return this;
        }

        const slice = memory.getSlice();
        let memorySet: MemoryTypeSet = slice[params.ID as number];
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

        memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
        return this;
    }
    has(item: T): boolean {
        // TODO: check if can be generalized ?
        const params = this[memoryProxyPramsKey];
        params.sync();
        return params.object.has.call(this, item);
    }
    values(): IterableIterator<T> {
        const params = this[memoryProxyPramsKey];
        params.sync();
        return params.object.values.call(this);
    }
    keys(): IterableIterator<T> {
        const params = this[memoryProxyPramsKey];
        params.sync();
        return params.object.keys.call(this);
    }
    forEach(callback: (value: T, value2: T, set: Set<T>) => void): void {
        const params = this[memoryProxyPramsKey];
        params.sync();
        return params.object.forEach.call(this, callback);
    }
    entries(): IterableIterator<[T, T]> {
        const params = this[memoryProxyPramsKey];
        params.sync();
        return params.object.entries.call(this);
    }
}

function proxifySyncSet(): void {
    // Synchronization function
    // Most methods of the "proxy" will call this synchronization function, even
    // if it is not yet linked to a memory !

    const params = this as SetParams;
    const memory = params.memory;
    if (!memory.isDirty(params.ID)) {
        return;
    }
    const object = params.object;
    const proxy = params.proxy;
    // notify the memory that we are synchronizing this so it is not dirty
    // anymore in memory
    memory.markAsLoaded(params.ID);
    // get current object state in memory
    const memorySet = memory.getSliceValue(params.ID) as MemoryCompiledSet;
    // reset all keys (+ explanation of best/worst case scenario)
    object.clear.call(proxy);
    params.size = 0;
    if (!memorySet) {
        return;
    }
    // Update values according to what is stored
    memorySet.forEach(item => {
        if (item instanceof ProxyUniqID) {
            item = memory.getProxy(item);
        }
        object.add.call(proxy, item);
        params.size++;
    });
}

// This will be set on the versionable params object and called with the params
// as the value of `this`. It is created here so that it is created only once !
function linkVersionable(memory: MemoryVersionable): void {
    const params = this as SetParams;
    params.memory = memory;
    params.sync = proxifySyncSet;
    memory.markDirty(params.ID);
    if (!params.proxy.size) {
        return;
    }
    const slice = memory.getSlice();
    const memorySet = new params.MemoryType() as MemoryTypeSet;
    slice[params.ID as number] = memorySet; // store the "pure" value in memory
    params.object.forEach.call(params.proxy, (value: AllowedMemory): void => {
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

export function proxifySet<T extends AllowedMemory>(set: Set<T>): VersionableSet {
    return new VersionableSet(set);
}
