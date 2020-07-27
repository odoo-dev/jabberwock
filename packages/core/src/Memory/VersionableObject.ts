import {
    MemoryAllowedType,
    MemoryAllowedPrimitiveTypes,
    MemoryTypeObject,
    MemoryWorker,
} from './Memory';
import {
    VersionableID,
    _checkVersionable,
    VersionableParams,
    generateVersionableID,
    _stackedProxify,
} from './Versionable';

import {
    removedItem,
    memoryProxyNotVersionableKey,
    memoryProxyPramsKey,
    FroozenError,
    symbolVerify,
} from './const';

export type keyType = string | number | symbol;

interface ObjectParams extends VersionableParams {
    proxy: Record<keyType, MemoryAllowedType>;
    object: Record<keyType, MemoryAllowedType>;
    proto: GettersSetters;
}

export interface GettersSetters {
    getters: Record<string | symbol, () => MemoryAllowedType>;
    setters: Record<string | symbol, (value: MemoryAllowedType) => void>;
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
                gettersSetters.getters[propName] = desc.get as () => MemoryAllowedType;
            }
            if (!gettersSetters.setters[propName] && desc.set) {
                gettersSetters.setters[propName] = desc.set as (value: MemoryAllowedType) => void;
            }
        });
    } while ((obj = Object.getPrototypeOf(obj)) && obj !== rootPrototype);
    return gettersSetters;
}

export interface ProxyObjectHandler {
    get(obj: MemoryAllowedType, prop: keyType, proxy: object): MemoryAllowedType;
    set(obj: MemoryAllowedType, prop: keyType, value: MemoryAllowedType, proxy: object): boolean;
    has(obj: MemoryAllowedType, prop: keyType): boolean;
    ownKeys(obj: MemoryAllowedType): keyType[];
    getOwnPropertyDescriptor(obj: MemoryAllowedType, prop: string | symbol): PropertyDescriptor;
    deleteProperty(obj: MemoryAllowedType, prop: string): boolean;
}

export const proxyObjectHandler = {
    set(obj: object, prop: keyType, value: MemoryAllowedType, proxy: object): boolean {
        // Object.assign might try to set the value of the paramsKey. We
        // obviously don't want that. Let it think it succeeded (returning false
        // will throw an error, which is not what we want here.)
        if (prop === memoryProxyPramsKey) {
            return true;
        }
        if (prop === symbolVerify) {
            obj[symbolVerify] = value;
            return true;
        }

        const params = obj[memoryProxyPramsKey] as ObjectParams;
        const memory = params.memory;

        if (!memory && value === removedItem) {
            // "synchronize" the delete
            delete obj[prop];
            return true;
        }

        // if the property is a method of the class or prototype.
        const protoMethod = params.proto.setters[prop as string];
        if (protoMethod) {
            protoMethod.call(proxy, value as MemoryAllowedPrimitiveTypes);
            return true;
        }

        // if the property is a getter
        const desc = Object.getOwnPropertyDescriptor(obj, prop);
        if (desc?.set) {
            desc.set.call(proxy, value as MemoryAllowedPrimitiveTypes);
            return true;
        }

        _checkVersionable(value);

        // if not linked to memory
        if (!memory) {
            obj[prop] = value as MemoryAllowedPrimitiveTypes;
            return true;
        }

        if (memory.isFrozen()) {
            throw new FroozenError();
        }

        const oldValue = obj[prop];
        // The value is the same, or we are deleting a value that was not
        // already there in the first place.
        if (oldValue === value || (value === removedItem && !(prop in obj))) {
            return true;
        }

        const slice = memory.getSlice();
        let memoryObject = slice[params.ID as number] as MemoryTypeObject;
        if (!memoryObject) {
            slice[params.ID as number] = memoryObject = new params.MemoryType() as MemoryTypeObject;
        }
        const memoryObjectProps = memoryObject.props;

        let memoryItem = value;
        if (value !== null && typeof value === 'object' && !value[memoryProxyNotVersionableKey]) {
            // if object, the stored value needs to be "converted" (see Set)
            memory.linkToMemory(value as object);
            const newParams = value && value[memoryProxyPramsKey];
            memoryItem = newParams.ID;
            memory.addSliceProxyParent(newParams.ID, params.ID, prop as string);
        }

        // if the old value was a versionable as well, sever its link to its parent
        const oldParams = oldValue && typeof oldValue === 'object' && oldValue[memoryProxyPramsKey];
        if (oldParams) {
            memory.deleteSliceProxyParent(oldParams.ID, params.ID, prop as string);
        }

        if (value === removedItem) {
            memoryObjectProps[prop as string] = removedItem; // notify that the deletion happened in this slice
            delete obj[prop];
        } else {
            memoryObjectProps[prop as string] = memoryItem;
            obj[prop] = value;
        }

        memory.markDirty(params.ID); // mark the cache as invalid when change the slide memory
        return true;
    },
    deleteProperty(obj: object, prop: keyType): boolean {
        // `removedItem` is a marker to notify that there was something here but
        // it got removed
        this.set(obj, prop, removedItem);
        delete obj[prop];
        return true;
    },
} as ProxyObjectHandler;

export function _proxifyObject(obj: object): object {
    const proxy = new Proxy(obj, proxyObjectHandler) as object;

    obj[memoryProxyPramsKey] = {
        ID: generateVersionableID(),
        linkCallback: linkVersionable,
        synchronize: proxifySyncObject,
        MemoryType: MemoryTypeObject,
        verify: verify,
        proxy: proxy,
        object: obj,
        proto: getPrototypeGettersSetters(obj),
    } as ObjectParams;

    const keys = Object.keys(obj);
    for (let k = 0, len = keys.length; k < len; k++) {
        const key = keys[k];
        const value = obj[key];
        _stackedProxify(value, newValue => {
            if (newValue !== value) {
                obj[key] = newValue;
            }
        });
    }
    return proxy;
}

function verify(proxy: MemoryAllowedType): boolean {
    const params = this as ObjectParams;
    const obj = params.object as object;
    proxy[symbolVerify] = true;
    const value = obj[symbolVerify] as boolean;
    obj[symbolVerify] = false;
    return value;
}
export function proxifySyncObject(): void {
    // Synchronization function
    // Most methods of the "proxy" will call this synchronization function, even
    // if it is not yet linked to a memory !
    const params = this as ObjectParams;
    const memory = params.memory;
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
        if (value instanceof VersionableID) {
            // Convert proxy references to actual proxy
            value = memory.getProxy(value);
        }
        params.object[key] = value;
    }
}
function linkVersionable(memory: MemoryWorker): void {
    const params = this as ObjectParams;
    params.memory = memory;
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
    constructor(obj?: Record<string, MemoryAllowedType> | object) {
        if (obj) {
            const keys = Object.keys(obj);
            let key: string;
            while ((key = keys.pop())) {
                this[key] = obj[key];
            }
        }
        return _proxifyObject(this);
    }
}
