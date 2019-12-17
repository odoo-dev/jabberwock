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

import {
    removedItem,
    memoryProxyNotVersionableKey,
    memoryProxyPramsKey,
    FroozenErrorMessage,
} from './const';

// Type that the memory handles in practice. This is how it is stored in memory.
export type MemoryTypeObject = Record<string, MemoryTypeValues>;

// Output of memory given to proxy to operate (not sure it is useful to rename
// the type. semantic value of "compiled")
export type MemoryCompiledObject = MemoryTypeObject;

interface ObjectParams extends VersionableParams {
    proxy: Record<string, AllowedMemory>;
    object: Record<string, AllowedMemory>;
}

const proxyProps = {
    get(obj: object, prop: string | symbol): AllowedMemory {
        const params = obj[memoryProxyPramsKey];
        if (prop === memoryProxyPramsKey) {
            return params;
        }
        if (params.memory) {
            proxifySyncObject(params);
        }
        return obj[prop];
    },
    set(obj: object, prop: string | symbol, value: AllowedMemory): boolean {
        // Object.assign might try to set the value of the paramsKey. We
        // obviously don't want that. Let it think it succeeded (returning false
        // will throw an error, which is not what we want here.)
        if (prop === memoryProxyPramsKey) {
            return true;
        }

        const params = obj[memoryProxyPramsKey];
        const memory = params.memory;
        value = proxify(value);

        let desc: PropertyDescriptor;
        // if not linked to memory or the property is a getter
        if (!memory || ((desc = Object.getOwnPropertyDescriptor(obj, prop)) && desc.get)) {
            // "synchronize" the delete
            if (value === removedItem) {
                delete obj[prop];
            } else {
                obj[prop] = value as MemoryTypeValues;
            }
            return true;
        }

        if (memory.isFrozen()) {
            FroozenErrorMessage();
        }

        // sync because we neet to look at the "current" value of this property
        proxifySyncObject(params);

        const oldValue = obj[prop];
        // The value is the same, or we are deleting a value that was not
        // already there in the first place.
        if (oldValue === value || (value === removedItem && !(prop in obj))) {
            return true;
        }

        const slice = memory.getSlice();
        let memoryObject = slice[params.ID];
        if (!memoryObject) {
            slice[params.ID] = memoryObject = {};
        }

        let memoryItem = value;
        if (
            value !== null &&
            (typeof value === 'object' || typeof value === 'function') &&
            !value[memoryProxyNotVersionableKey]
        ) {
            // if object, the stored value needs to be "converted" (see Set)
            memory.linkToMemory(value as object);
            const newParams = value && value[memoryProxyPramsKey];
            if (newParams) {
                memoryItem = newParams.linkedID;
                memory.addSliceProxyParent(newParams.ID, params.ID, prop);
            }
        }

        // if the old value was a versionable as well, sever its link to its parent
        const oldParams = oldValue && typeof oldValue === 'object' && oldValue[memoryProxyPramsKey];
        if (oldParams) {
            memory.deleteSliceProxyParent(oldParams.ID, params.ID, prop);
        }

        if (value === removedItem) {
            memoryObject[prop] = removedItem; // notify that the deletion happened in this slice
            delete obj[prop];
        } else {
            memoryObject[prop] = memoryItem;
            obj[prop] = value;
        }

        memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
        return true;
    },
    has(obj: object, prop: string | symbol): boolean {
        proxifySyncObject(obj[memoryProxyPramsKey]);
        return Reflect.has(obj, prop);
    },
    ownKeys(obj: object): Array<string | number | symbol> {
        proxifySyncObject(obj[memoryProxyPramsKey]);
        return Reflect.ownKeys(obj);
    },
    getOwnPropertyDescriptor(obj: object, prop: string | symbol): PropertyDescriptor {
        if (prop !== memoryProxyPramsKey) {
            // We only want to synchronize when accessing the properties of an
            // object. However, when setting a value, we need to check the
            // paramsKey to assert whether an object is set as versionable or
            // not. This should not trigger a sync as this is not a read
            // operation. Reading the paramsKey is never a true "read" operation
            // anyway.
            proxifySyncObject(obj[memoryProxyPramsKey]);
        }
        return Reflect.getOwnPropertyDescriptor(obj, prop);
    },
    deleteProperty(obj: object, prop: string): boolean {
        // `removedItem` is a marker to notify that there was something here but
        // it got removed
        return this.set(obj, prop, removedItem);
    },
};

export function proxifyObject<T extends AllowedMemory>(
    obj: Record<string, T> | object,
): Record<string, T> {
    const proxy = new Proxy(obj, proxyProps) as Record<string, T>;

    const ID = generateMemoryID();
    obj[memoryProxyPramsKey] = {
        ID: ID,
        linkedID: new LinkedID(ID),
        memory: undefined,
        linkCallback: linkVersionable,
        proxy: proxy,
        object: obj,
    } as ObjectParams;

    const keys = Object.keys(obj);
    for (let k = 0, len = keys.length; k < len; k++) {
        const key = keys[k];
        const value = obj[key];
        stackedProxify(value, newValue => {
            if (newValue !== value) {
                obj[key] = newValue;
            }
        });
    }
    return proxy;
}

function proxifySyncObject(params: ObjectParams): void {
    const memory = params.memory;
    if (!memory || !memory.isDirty(params.ID)) {
        return;
    }
    memory.markAsLoaded(params.ID);
    const memoryObject = memory.getSliceValue(params.ID) as MemoryTypeObject;

    // Clear keys that do not exist anymore
    let keys = Object.keys(params.object);
    let key: string;
    while ((key = keys.pop())) {
        // if the object is not present in this slice or it does not have this key
        if (!memoryObject || !(key in memoryObject)) {
            delete params.object[key];
        }
    }

    if (!memoryObject) {
        return;
    }
    // Update values according to what is stored
    keys = Object.keys(memoryObject);
    while ((key = keys.pop())) {
        let value = memoryObject[key];
        if (value instanceof LinkedID) {
            // Convert proxy references to actual proxy
            value = memory.getProxy(+value as typeLinkedID);
        }
        params.object[key] = value;
    }
}
function linkVersionable(memory: MemoryVersionable): void {
    this.memory = memory;
    const slice = this.memory.getSlice();
    const obj = this.object;
    const ID = this.ID;
    const keys = Object.keys(obj);
    if (keys.length) {
        const memoryObject = Object.assign({}, obj);
        let key: string;
        while ((key = keys.pop())) {
            const value = obj[key];
            // Some of the values in the original object may be versionable and
            // need to be converted
            const valueParams =
                value !== null && typeof value === 'object' && value[memoryProxyPramsKey];
            if (valueParams) {
                memory.linkToMemory(value as object);
                memory.addSliceProxyParent(valueParams.ID, ID, key);
                memoryObject[key] = valueParams.linkedID;
            }
        }
        slice[ID] = memoryObject; // store the "pure" value in memory
    }
    memory.markDirty(ID);
}
export class VersionableObject {
    constructor(obj?: Record<string, AllowedMemory> | object) {
        if (obj) {
            const keys = Object.keys(obj);
            let key: string;
            while ((key = keys.pop())) {
                this[key] = obj[key];
            }
        }
        return proxifyObject(this);
    }
}
