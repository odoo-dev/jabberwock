import { AllowedMemory, MemoryTypeValues, MemoryTypeObject, MemoryVersionable } from './Memory';
import {
    ProxyUniqID,
    checkIfProxy,
    VersionableParams,
    generateMemoryID,
    stackedProxify,
} from './Versionable';

import {
    removedItem,
    memoryProxyNotVersionableKey,
    memoryProxyPramsKey,
    FroozenErrorMessage,
    symbolItsme,
} from './const';

export type keyType = string | number | symbol;

interface ObjectParams extends VersionableParams {
    proxy: Record<keyType, AllowedMemory>;
    object: Record<keyType, AllowedMemory>;
}

interface GettersSetters {
    getters: Record<string | symbol, () => AllowedMemory>;
    setters: Record<string | symbol, (value: AllowedMemory) => void>;
}

const classGettersSetters: WeakMap<object, GettersSetters> = new WeakMap();
const rootPrototype = Object.getPrototypeOf({});
export function getPrototypeGettersSetters(obj: object): GettersSetters {
    let gettersSetters = classGettersSetters.get(obj.constructor);
    if (gettersSetters) {
        return gettersSetters;
    }
    gettersSetters = {
        getters: {},
        setters: {},
    };
    classGettersSetters.set(obj.constructor, gettersSetters);
    obj = Object.getPrototypeOf(obj);
    do {
        const descs = Object.getOwnPropertyDescriptors(obj);
        Object.keys(descs).forEach(propName => {
            const desc = descs[propName];
            if (!gettersSetters.getters[propName] && desc.get) {
                gettersSetters.getters[propName] = desc.get as () => AllowedMemory;
            }
            if (!gettersSetters.setters[propName] && desc.set) {
                gettersSetters.setters[propName] = desc.set as (value: AllowedMemory) => void;
            }
        });
    } while ((obj = Object.getPrototypeOf(obj)) && obj !== rootPrototype);
    return gettersSetters;
}

export interface ProxyObjectHandler {
    get(obj: AllowedMemory, prop: keyType, proxy: object): AllowedMemory;
    set(obj: AllowedMemory, prop: keyType, value: AllowedMemory, proxy: object): boolean;
    has(obj: AllowedMemory, prop: keyType): boolean;
    ownKeys(obj: AllowedMemory): (keyType)[];
    getOwnPropertyDescriptor(obj: AllowedMemory, prop: string | symbol): PropertyDescriptor;
    deleteProperty(obj: AllowedMemory, prop: string): boolean;
}

export const proxyObjectHandler = {
    get(obj: object, prop: keyType, proxy: object): AllowedMemory {
        if (prop === memoryProxyPramsKey || prop === 'toString' || prop === 'constructor') {
            return obj[prop];
        }

        const desc = Object.getOwnPropertyDescriptor(obj, prop);
        const getter = desc ? desc.get : getPrototypeGettersSetters(obj).getters[prop as string];
        if (getter) {
            return getter.call(proxy);
        }

        obj[memoryProxyPramsKey].sync();
        return obj[prop];
    },
    set(obj: object, prop: keyType, value: AllowedMemory, proxy: object): boolean {
        // Object.assign might try to set the value of the paramsKey. We
        // obviously don't want that. Let it think it succeeded (returning false
        // will throw an error, which is not what we want here.)
        if (prop === memoryProxyPramsKey) {
            return true;
        }
        if (prop === symbolItsme) {
            obj[symbolItsme] = value;
            return true;
        }

        const params = obj[memoryProxyPramsKey];
        const memory = params.memory;

        if (!memory && value === removedItem) {
            // "synchronize" the delete
            delete obj[prop];
            return true;
        }

        // if the property is a getter
        const desc = Object.getOwnPropertyDescriptor(obj, prop);
        const setter = desc ? desc.set : getPrototypeGettersSetters(obj).setters[prop as string];
        if (setter) {
            setter.call(proxy, value as MemoryTypeValues);
            return true;
        }

        value = checkIfProxy(value);

        // if not linked to memory
        if (!memory) {
            obj[prop] = value as MemoryTypeValues;
            return true;
        }

        if (memory.isFrozen()) {
            FroozenErrorMessage();
        }

        // sync because we neet to look at the "current" value of this property
        params.sync();

        const oldValue = obj[prop];
        // The value is the same, or we are deleting a value that was not
        // already there in the first place.
        if (oldValue === value || (value === removedItem && !(prop in obj))) {
            return true;
        }

        const slice = memory.getSlice();
        let memoryObject = slice[params.ID] as MemoryTypeObject;
        if (!memoryObject) {
            slice[params.ID] = memoryObject = new params.MemoryType() as MemoryTypeObject;
        }
        const memoryObjectProps = memoryObject.props;

        let memoryItem = value;
        if (value !== null && typeof value === 'object' && !value[memoryProxyNotVersionableKey]) {
            // if object, the stored value needs to be "converted" (see Set)
            memory.linkToMemory(value as object);
            const newParams = value && value[memoryProxyPramsKey];
            memoryItem = newParams.ID;
            memory.addSliceProxyParent(newParams.ID, params.ID, prop);
        }

        // if the old value was a versionable as well, sever its link to its parent
        const oldParams = oldValue && typeof oldValue === 'object' && oldValue[memoryProxyPramsKey];
        if (oldParams) {
            memory.deleteSliceProxyParent(oldParams.ID, params.ID, prop);
        }

        if (value === removedItem) {
            memoryObjectProps[prop as string] = removedItem; // notify that the deletion happened in this slice
            delete obj[prop];
        } else {
            memoryObjectProps[prop as string] = memoryItem;
            obj[prop] = value;
        }

        memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
        return true;
    },
    has(obj: object, prop: keyType): boolean {
        obj[memoryProxyPramsKey].sync();
        return Reflect.has(obj, prop);
    },
    ownKeys(obj: object): Array<keyType> {
        obj[memoryProxyPramsKey].sync();
        return Reflect.ownKeys(obj);
    },
    getOwnPropertyDescriptor(obj: object, prop: keyType): PropertyDescriptor {
        if (prop !== memoryProxyPramsKey) {
            // We only want to synchronize when accessing the properties of an
            // object. However, when setting a value, we need to check the
            // paramsKey to assert whether an object is set as versionable or
            // not. This should not trigger a sync as this is not a read
            // operation. Reading the paramsKey is never a true "read" operation
            // anyway.
            obj[memoryProxyPramsKey].sync();
        }
        return Reflect.getOwnPropertyDescriptor(obj, prop);
    },
    deleteProperty(obj: object, prop: keyType): boolean {
        // `removedItem` is a marker to notify that there was something here but
        // it got removed
        this.set(obj, prop, removedItem);
        delete obj[prop];
        return true;
    },
} as ProxyObjectHandler;

// eslint-disable-next-line @typescript-eslint/no-empty-function
function nothing(): void {}

export function proxifyObject(obj: object): object {
    const proxy = new Proxy(obj, proxyObjectHandler) as object;

    obj[memoryProxyPramsKey] = {
        ID: generateMemoryID(),
        linkCallback: linkVersionable,
        sync: nothing,
        MemoryType: MemoryTypeObject,
        itsme: itsme,
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

function itsme(proxy: AllowedMemory): boolean {
    const params = this as ObjectParams;
    const obj = params.object as object;
    proxy[symbolItsme] = true;
    const value = obj[symbolItsme] as boolean;
    obj[symbolItsme] = false;
    return value;
}
function proxifySyncObject(): void {
    const params = this as ObjectParams;
    const memory = params.memory;
    if (!memory.isDirty(params.ID)) {
        return;
    }
    memory.markAsLoaded(params.ID);
    const memoryObject = memory.getSliceValue(params.ID) as MemoryTypeObject;
    const memoryObjectProps = (memoryObject && memoryObject.props) || {};

    // Clear keys that do not exist anymore
    let keys = Object.keys(params.object);
    let key: string;
    while ((key = keys.pop())) {
        // if the object is not present in this slice or it does not have this key
        if (!(key in memoryObjectProps)) {
            delete params.object[key];
        }
    }

    if (!memoryObject) {
        return;
    }

    // Update values according to what is stored
    keys = Object.keys(memoryObjectProps);
    while ((key = keys.pop())) {
        let value = memoryObjectProps[key];
        if (value instanceof ProxyUniqID) {
            // Convert proxy references to actual proxy
            value = memory.getProxy(value);
        }
        params.object[key] = value;
    }
}
function linkVersionable(memory: MemoryVersionable): void {
    const params = this as ObjectParams;
    params.memory = memory;
    params.sync = proxifySyncObject;
    const slice = params.memory.getSlice();
    const obj = params.object;
    const ID = params.ID;
    const keys = Object.keys(obj);
    if (keys.length) {
        const memoryObjectProps = Object.assign({}, obj);
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
                memoryObjectProps[key] = valueParams.ID;
            }
        }
        const memoryObject = new params.MemoryType() as MemoryTypeObject;
        memoryObject.props = memoryObjectProps;
        slice[ID as number] = memoryObject; // store the "pure" value in memory
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
