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

export type MemoryTypeObject = Record<string, MemoryTypeValues>;
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
        if (prop === memoryProxyPramsKey) {
            return true;
        }

        const params = obj[memoryProxyPramsKey];
        const memory = params.memory;
        value = proxify(value);

        let desc: PropertyDescriptor;
        if (!memory || ((desc = Object.getOwnPropertyDescriptor(obj, prop)) && desc.get)) {
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
        proxifySyncObject(params);

        const oldValue = obj[prop];
        if (oldValue === value || (value === removedItem && !(prop in obj))) {
            return true;
        }

        const slice = memory.getSlice();
        let memoryObject = slice[params.ID];
        if (!memoryObject) {
            slice[params.ID] = memoryObject = {};
        }

        let newParams: VersionableParams;
        if (
            value !== null &&
            (typeof value === 'object' || typeof value === 'function') &&
            !value[memoryProxyNotVersionableKey]
        ) {
            memory.linkToMemory(value as object);
            newParams = value && value[memoryProxyPramsKey];
        }

        const oldParams = oldValue && typeof oldValue === 'object' && oldValue[memoryProxyPramsKey];
        if (oldParams) {
            memory.deleteSliceProxyParent(oldParams.ID, params.ID, prop);
        }
        if (newParams) {
            memory.addSliceProxyParent(newParams.ID, params.ID, prop);
        }

        if (value === removedItem) {
            memoryObject[prop] = removedItem;
            delete obj[prop];
        } else {
            memoryObject[prop] = (newParams && newParams.linkedID) || value;
            obj[prop] = value;
        }

        memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
        return true;
    },
    has(obj: object, prop: string | symbol): boolean {
        proxifySyncObject(obj[memoryProxyPramsKey]);
        return prop in obj;
    },
    ownKeys(obj: object): Array<string | number | symbol> {
        proxifySyncObject(obj[memoryProxyPramsKey]);
        return Reflect.ownKeys(obj);
    },
    getOwnPropertyDescriptor(obj: object, prop: string | symbol): PropertyDescriptor {
        if (prop !== memoryProxyPramsKey) {
            proxifySyncObject(obj[memoryProxyPramsKey]);
        }
        return Reflect.getOwnPropertyDescriptor(obj, prop);
    },
    deleteProperty(obj: object, prop: string): boolean {
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
    if (!memory) {
        return;
    }
    if (!memory.isDirty(params.ID)) {
        return;
    }
    memory.markAsLoaded(params.ID);
    const memoryObject = memory.getSliceValue(params.ID) as MemoryTypeObject;
    // Clear keys that do not exist anymore
    let keys = Object.keys(params.object);
    let key: string;
    while ((key = keys.pop())) {
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
        const memoryObject = (slice[ID] = Object.assign({}, obj));
        let key: string;
        while ((key = keys.pop())) {
            const value = obj[key];
            const valueParams =
                value !== null && typeof value === 'object' && value[memoryProxyPramsKey];
            if (valueParams) {
                memory.linkToMemory(value as object);
                memory.addSliceProxyParent(valueParams.ID, ID, key);
                memoryObject[key] = valueParams.linkedID;
            }
        }
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
