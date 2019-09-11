import {
    MemoryAllowedType,
    MemoryAllowedObjectType,
    MemoryWorker,
    MemoryTypeArray,
    MemoryTypeObject,
    MemoryTypeSet,
} from './Memory';
import { _proxifyObject } from './VersionableObject';
import { _proxifyArray } from './VersionableArray';
import { _proxifySet } from './VersionableSet';
import {
    memoryProxyNotVersionableKey,
    NotVersionableError,
    VersionableAllreadyVersionableError,
    memoryProxyPramsKey,
} from './const';

export class VersionableID extends Number {}
VersionableID.prototype[memoryProxyNotVersionableKey] = true;

let MemoryID = 0;
export function generateVersionableID(): VersionableID {
    return new VersionableID(++MemoryID);
}

// Magic memory key that is set on the object through a symbol (inaccessible for
// others). It stores everything that is useful for the memory to handle this object.
export interface VersionableParams {
    ID: VersionableID; // proxy id in memory.
    memory?: MemoryWorker; // interface for versionale to access memory (since we don't want to give them the true memory object !)
    proxy: MemoryAllowedObjectType; // proxy itself (what we return, what people actually manipulate)
    object: MemoryAllowedObjectType; // Object that is proxified (it is synchronized with the proxy because the proxy updates it at some points ... -- not the Set !)
    linkCallback: (memory: MemoryWorker) => void; // function to call when this versionable is linked to a memory
    synchronize: () => void; // Synchronize the versionable object with the memory information.
    verify: (obj: MemoryAllowedType) => boolean; // Verify if the given proxy matches the versionable object.
    MemoryType: typeof MemoryTypeObject | typeof MemoryTypeArray | typeof MemoryTypeSet;
    isDiffRoot?: true; // is it a standalone object or does it only makes sense as part of an other object's structure ?
}

// queue of stuff to proxify
const toProxify = new Map<MemoryAllowedType, Array<(proxy: MemoryAllowedType) => void>>();

/**
 * Take an object and return a versionable proxy to this object.
 *
 * @param object
 */
export function makeVersionable<T extends MemoryAllowedType>(object: T): T {
    const params = object[memoryProxyPramsKey] as VersionableParams;
    if (params) {
        if (params.object === object) {
            throw new VersionableAllreadyVersionableError();
        }
        if (params && params.verify(object)) {
            return object;
        }
    }
    const proxy = _proxify(object);
    toProxify.forEach((callbacks, torototo) => {
        toProxify.delete(torototo);
        const proxy = _proxify(torototo);
        callbacks.forEach(callback => callback(proxy));
    });
    return proxy;
}
/**
 * Create a proxy from a versionable with given handler.
 *
 * @param versionable
 * @param handler
 */
export function proxifyVersionable<T extends MemoryAllowedType>(
    versionable: T,
    handler: ProxyHandler<object>,
): T {
    const newProxy = new Proxy(versionable as object, handler);
    versionable[memoryProxyPramsKey].proxy = newProxy;
    return newProxy as T;
}
/**
 * Mark the current object as not versionable in memory.
 * A non versionable object is not linked to the memory. The memory does not
 * take care of the change inside this object, and this object is nerver
 * immutable.
 *
 * @param object
 */
export function markNotVersionable(object: MemoryAllowedType): void {
    object[memoryProxyNotVersionableKey] = true;
}
/**
 * Throw an error if the given object is not a versionable.
 *
 * @param object
 */
export function _checkVersionable<T extends MemoryAllowedType>(object: T): void {
    if (
        typeof object !== 'object' ||
        object === null ||
        object[memoryProxyNotVersionableKey] // this is set by the user
    ) {
        return;
    }

    const params = object[memoryProxyPramsKey];
    if (params) {
        if (params.object === object) {
            throw new VersionableAllreadyVersionableError();
        }
        if (params.verify(object)) {
            // Already versioned ! (we could have inherited from the `params` of
            // another, already versioned object, but we might not)
            return;
        }
    }

    throw new NotVersionableError();
}
// Recursive proxification is very limited because of callback depth. To
// circumvent this issue, we queue the proxification of children.
export function _stackedProxify<T extends MemoryAllowedType>(
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
    const callbacks = toProxify.get(customClass) || [];
    toProxify.set(customClass, callbacks);
    callbacks.push(callback);
}

function _proxify<T extends MemoryAllowedType>(customClass: T): T {
    const params = customClass[memoryProxyPramsKey];
    if (params && params.verify(customClass)) {
        return params.proxy;
    }
    let proxy: T;
    if (customClass instanceof Set) {
        proxy = _proxifySet(customClass) as T;
    } else if (customClass instanceof Array) {
        proxy = _proxifyArray(customClass) as T;
    } else {
        proxy = _proxifyObject(customClass as Record<string, MemoryAllowedType>) as T;
    }
    return proxy;
}
