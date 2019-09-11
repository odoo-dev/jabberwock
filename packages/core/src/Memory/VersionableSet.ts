import { AllowedMemory, MemoryTypeValues } from './Memory';
import {
    LinkedID,
    typeLinkedID,
    proxify,
    MemoryVersionable,
    VersionableParams,
    generateMemoryID,
    stackedProxify,
} from './Versionable';

import { memoryProxyNotVersionableKey, memoryProxyPramsKey, FroozenErrorMessage } from './const';

const memoryProxySyncKey = Symbol('__jabberwockMemorySync__');

interface SetParams extends VersionableParams {
    size: number;
    object: Set<AllowedMemory>;
    proxy: VersionableSet;
}
export class MemoryTypeSet {
    add: Set<MemoryTypeValues> = new Set();
    delete: Set<MemoryTypeValues> = new Set();
}
export type MemoryCompiledSet = Set<MemoryTypeValues>;

const genericSet = new Set() as Set<AllowedMemory>;
const genericSetPrototype = Set.prototype;

function setPrototype(proxy: VersionableSet, obj: Set<AllowedMemory>): void {
    do {
        if (obj === genericSetPrototype) {
            break;
        }
        const op = Object.getOwnPropertyNames(obj);
        for (let i = 0; i < op.length; i++) {
            const prop = op[i];
            if (!proxy[prop]) {
                proxy[prop] = obj[prop];
            }
        }
    } while ((obj = Object.getPrototypeOf(obj)));
}

export class VersionableSet extends Set<AllowedMemory> {
    [memoryProxyPramsKey]: SetParams;
    constructor(params?: Set<AllowedMemory> | AllowedMemory[]) {
        super();
        let set: Set<AllowedMemory>;
        let size = 0;
        if (!params) {
            set = genericSet;
        } else if (params instanceof Array) {
            set = genericSet;
            params.forEach(value => {
                size++;
                stackedProxify(value, newValue => {
                    set.add.call(this, newValue);
                });
            });
        } else {
            set = params as Set<AllowedMemory>;
            set.forEach(value => {
                size++;
                stackedProxify(value, newValue => {
                    set.add.call(this, newValue);
                });
            });
            setPrototype(this, params);
        }

        const ID = generateMemoryID();
        this[memoryProxyPramsKey] = {
            ID: ID,
            linkedID: new LinkedID(ID),
            memory: undefined,
            linkCallback: linkVersionable,
            size: size,
            object: set,
            proxy: this,
        };
    }
    [memoryProxySyncKey](params: SetParams): void {
        const memory = params.memory;
        if (!memory || !memory.isDirty(params.ID)) {
            return;
        }
        memory.markAsLoaded(params.ID);
        const memorySet = memory.getSliceValue(params.ID) as MemoryCompiledSet;
        // reset all keys (+ explanation of best/worst case scenario)
        params.object.clear.call(this);
        params.size = 0;
        if (!memorySet) {
            return;
        }
        // Update values according to what is stored
        memorySet.forEach(item => {
            if (item instanceof LinkedID) {
                item = memory.getProxy(+item as typeLinkedID);
            }
            params.object.add.call(this, item);
            params.size++;
        });
    }

    get size(): number {
        const params = this[memoryProxyPramsKey];
        this[memoryProxySyncKey](params);
        return params.size;
    }
    add(item: AllowedMemory): this {
        const params = this[memoryProxyPramsKey];
        const memory = params.memory;
        item = proxify(item);

        if (memory && memory.isFrozen()) {
            FroozenErrorMessage();
        }

        this[memoryProxySyncKey](params);

        const check = this.has(item);
        if (!check) {
            params.size++;
            params.object.add.call(this, item);
        }

        if (check || !memory) {
            return this;
        }

        if (
            (typeof item === 'object' || typeof item === 'function') &&
            !item[memoryProxyNotVersionableKey]
        ) {
            memory.linkToMemory(item as object);
        }

        let memoryItem = item as MemoryTypeValues;
        const itemParams = item && typeof item === 'object' && item[memoryProxyPramsKey];
        if (itemParams) {
            memoryItem = itemParams.linkedID;
            memory.addSliceProxyParent(itemParams.ID, params.ID, undefined);
        }

        const slice = memory.getSlice();
        let memorySet: MemoryTypeSet = slice[params.ID];
        if (!memorySet) {
            slice[params.ID] = memorySet = new MemoryTypeSet();
        }
        memorySet.add.add(memoryItem);
        memorySet.delete.delete(memoryItem);

        memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory

        return this;
    }
    delete(item: AllowedMemory): boolean {
        const params = this[memoryProxyPramsKey];
        const memory = params.memory;
        if (memory && memory.isFrozen()) {
            FroozenErrorMessage();
        }

        this[memoryProxySyncKey](params);

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
            memoryItem = itemParams.linkedID as LinkedID;
            memory.deleteSliceProxyParent(+memoryItem as typeLinkedID, params.ID, undefined);
        }

        const slice = memory.getSlice();
        let memorySet: MemoryTypeSet = slice[params.ID];
        if (!memorySet) {
            slice[params.ID] = memorySet = new MemoryTypeSet();
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
        this[memoryProxySyncKey](params);
        if (params.size === 0) {
            return this;
        }

        params.size = 0;

        if (!memory) {
            params.object.clear.call(this);
            return this;
        }

        const slice = memory.getSlice();
        let memorySet: MemoryTypeSet = slice[params.ID];
        if (!memorySet) {
            slice[params.ID] = memorySet = new MemoryTypeSet();
        }

        params.object.forEach.call(this, (item: AllowedMemory) => {
            const itemParams = item && typeof item === 'object' && item[memoryProxyPramsKey];
            if (itemParams) {
                item = itemParams.linkedID;
                memory.deleteSliceProxyParent(itemParams.ID, params.ID, undefined);
            }
            memorySet.delete.add(item);
            memorySet.add.delete(item);
        });
        params.object.clear.call(this);

        memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
        return this;
    }
    has(item: AllowedMemory): boolean {
        const params = this[memoryProxyPramsKey];
        this[memoryProxySyncKey](params);
        return params.object.has.call(this, item);
    }
    values(): IterableIterator<AllowedMemory> {
        const params = this[memoryProxyPramsKey];
        this[memoryProxySyncKey](params);
        return params.object.values.call(this);
    }
    keys(): IterableIterator<AllowedMemory> {
        const params = this[memoryProxyPramsKey];
        this[memoryProxySyncKey](params);
        return params.object.keys.call(this);
    }
    forEach(
        callback: (value: AllowedMemory, value2: AllowedMemory, set: Set<AllowedMemory>) => void,
    ): void {
        const params = this[memoryProxyPramsKey];
        this[memoryProxySyncKey](params);
        return params.object.forEach.call(this, callback);
    }
    entries(): IterableIterator<[AllowedMemory, AllowedMemory]> {
        const params = this[memoryProxyPramsKey];
        this[memoryProxySyncKey](params);
        return params.object.entries.call(this);
    }
}

function linkVersionable(memory: MemoryVersionable): void {
    this.memory = memory;
    const slice = memory.getSlice();
    if (!this.proxy.size) {
        memory.markDirty(this.ID);
        return;
    }
    const memorySet = (slice[this.ID] = new MemoryTypeSet());
    this.object.forEach.call(this.proxy, (value: AllowedMemory): void => {
        const valueParams =
            value !== null && typeof value === 'object' && value[memoryProxyPramsKey];
        if (valueParams) {
            memory.linkToMemory(value as object);
            memory.addSliceProxyParent(valueParams.ID, this.ID, undefined);
            memorySet.add.add(valueParams.linkedID);
        } else {
            memorySet.add.add(value);
        }
    });
    memory.markDirty(this.ID);
}

export function proxifySet<T extends AllowedMemory>(set: Set<T>): VersionableSet {
    return new VersionableSet(set);
}
