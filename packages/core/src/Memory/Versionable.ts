import {
    AllowedMemory,
    AllowedObject,
    MemoryVersionable,
    MemoryTypeArray,
    MemoryTypeObject,
    MemoryTypeSet,
} from './Memory';
import { proxifyObject } from './VersionableObject';
import { proxifyArray } from './VersionableArray';
import { proxifySet } from './VersionableSet';
import {
    memoryProxyNotVersionableKey,
    NotVersionableErrorMessage,
    VersionableAllreadyVersionableErrorMessage,
    memoryProxyPramsKey,
} from './const';

export class ProxyUniqID extends Number {}
ProxyUniqID.prototype[memoryProxyNotVersionableKey] = true;

let MemoryID = 0;
export function generateMemoryID(): ProxyUniqID {
    // Unique ID (not really related to memory)
    return new ProxyUniqID(++MemoryID);
}

// const key = new ProxyUniqID(1);
// const rec = {};
// rec[key as number] = 4;

// Magic memory key that is set on the object through a symbol (inaccessible for
// others). It stores everything that is useful for the memory to handle this object.
export interface VersionableParams {
    ID: ProxyUniqID; // id du couple (proxy, object) en mémoire (number extension)
    memory?: MemoryVersionable; // interface for versionale to access memory (since we don't want to give them the true memory object !)
    proxy: AllowedObject; // proxy itself (what we return, what people actually manipulate)
    object: AllowedObject; // Object that is proxified (it is synchronized with the proxy because the proxy updates it at some points ... -- not the Set !)
    linkCallback: (memory: MemoryVersionable) => void; // function to call when this versionable is linked to a memory
    sync: () => void;
    itsme: (obj: AllowedMemory) => boolean;
    MemoryType: typeof MemoryTypeObject | typeof MemoryTypeArray | typeof MemoryTypeSet;
    willBeRootDiff?: true; // is it a standalone object or does it only makes sense as part of an other object's structure ?
}

// queue of stuff to proxify
const objectStackToProxify = new Map<AllowedMemory, Array<(proxy: AllowedMemory) => void>>();

export function makeVersionable<T extends AllowedMemory>(customClass: T): T {
    const params = customClass[memoryProxyPramsKey] as VersionableParams;
    if (params && params.itsme(customClass)) {
        VersionableAllreadyVersionableErrorMessage();
    }
    const proxy = _proxify(customClass);
    objectStackToProxify.forEach((callbacks, torototo) => {
        objectStackToProxify.delete(torototo);
        const proxy = _proxify(torototo);
        callbacks.forEach(callback => callback(proxy));
    });
    return proxy;
}
export function createProxyWithVersionable<T extends AllowedMemory>(
    proxy: T,
    handler: ProxyHandler<object>,
): T {
    const newProxy = new Proxy(proxy as object, handler);
    proxy[memoryProxyPramsKey].proxy = newProxy;
    return newProxy as T;
}
export function markNotVersionable(customClass: AllowedMemory): void {
    customClass[memoryProxyNotVersionableKey] = true;
}
// the argument can be anything actually, not necessarily a class
export function checkIfProxy<T extends AllowedMemory>(customClass: T): T {
    if (
        typeof customClass !== 'object' ||
        customClass === null ||
        customClass[memoryProxyNotVersionableKey] // this is set by the user
    ) {
        return customClass;
    }

    const params = customClass[memoryProxyPramsKey];
    if (params) {
        if (params.object === customClass) {
            VersionableAllreadyVersionableErrorMessage();
        }
        if (params.itsme(customClass)) {
            // Already versioned ! (we could have inherited from the `params` of
            // another, already versioned object, but we might not)
            return customClass;
        }
    }

    NotVersionableErrorMessage();
}
function _proxify<T extends AllowedMemory>(customClass: T): T {
    const params = customClass[memoryProxyPramsKey];
    if (params && params.itsme(customClass)) {
        return params.proxy;
    }
    let proxy: T;
    if (customClass instanceof Set) {
        proxy = proxifySet(customClass) as T;
    } else if (customClass instanceof Array) {
        proxy = proxifyArray(customClass) as T;
    } else {
        proxy = proxifyObject(customClass as Record<string, AllowedMemory>) as T;
    }
    return proxy;
}
// Recursive proxification is very limited because of callback depth. To
// circumvent this issue, we queue the proxification of children.
export function stackedProxify<T extends AllowedMemory>(
    customClass: T,
    callback: (proxy: T) => void,
): void {
    if (
        !customClass ||
        typeof customClass !== 'object' ||
        customClass[memoryProxyNotVersionableKey]
    ) {
        callback(customClass);
        return;
    }
    const params = customClass[memoryProxyPramsKey];
    if (params) {
        callback(params.proxy);
    }
    const callbacks = objectStackToProxify.get(customClass) || [];
    objectStackToProxify.set(customClass, callbacks);
    callbacks.push(callback);
}
