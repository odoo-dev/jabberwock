import { AllowedMemory, AllowedObject } from './Memory';
import { proxifyObject, MemoryCompiledObject } from './VersionableObject';
import { proxifyArray, MemoryArrayCompiledWithPatch } from './VersionableArray';
import { proxifySet, MemoryCompiledSet } from './VersionableSet';
import {
    memoryProxyNotVersionableKey,
    NotVersionableErrorMessage,
    VersionableAllreadyVersionableErrorMessage,
    memoryProxyPramsKey,
} from './const';

let MemoryID = 0;
export function generateMemoryID(): number {
    return ++MemoryID;
}
let applyMakeVersionableOnDeepObject = false;

export class LinkedID extends Number {}
LinkedID.prototype[memoryProxyNotVersionableKey] = true;
export type typeLinkedID = number;

export type MemoryCompiled =
    | MemoryCompiledObject
    | MemoryArrayCompiledWithPatch
    | MemoryCompiledSet;

// List of memory accessors usable by versionable (we don't want to give them
// access to the true memory object !)
export interface MemoryVersionable {
    ID: number;
    getProxy: (ID: typeLinkedID) => object;
    getSlice: () => object;
    getSliceValue: (ID: typeLinkedID) => MemoryCompiled;
    isFrozen: () => boolean;
    isDirty: (ID: typeLinkedID) => boolean;
    markDirty: (ID: typeLinkedID) => void;
    markAsLoaded: (ID: typeLinkedID) => boolean;
    addSliceProxyParent: (
        ID: typeLinkedID,
        parentID: typeLinkedID,
        attributeName: string,
    ) => boolean;
    deleteSliceProxyParent: (
        ID: typeLinkedID,
        parentID: typeLinkedID,
        attributeName: string,
    ) => boolean;
    linkToMemory: (obj: AllowedMemory) => AllowedMemory;
}
// const key = new LinkedID(1);
// const rec = {};
// rec[key as number] = 4;

// Magic memory key that is set on the object through a symbol (inaccessible for
// others). It stores everything that is useful for the memory to handle this object.
export interface VersionableParams {
    ID: number; // same as LinkedID but pure number type => should be removed
    linkedID: LinkedID; // id du couple (proxy, object) en mémoire (number extension)
    memory?: MemoryVersionable; // interface for versionale to access memory (since we don't want to give them the true memory object !)
    proxy: AllowedObject; // proxy itself (what we return, what people actually manipulate)
    object: AllowedObject; // Object that is proxified (it is synchronized with the proxy because the proxy updates it at some points ... -- not the Set !)
    linkCallback: (memory: MemoryVersionable) => void; // function to call when this versionable is linked to a memory
    willBeRootDiff?: true; // is it a standalone object or does it only makes sense as part of an other object's structure ?
}
let objectStackToProxifyIsPull = false;

// queue of stuff to proxify
const objectStackToProxify = new Map<AllowedMemory, Array<(proxy: AllowedMemory) => void>>();

export function makeVersionable<T extends AllowedMemory>(customClass: T): T {
    const params = customClass[memoryProxyPramsKey];
    if (params && (params.proxy === customClass || params.object === customClass)) {
        VersionableAllreadyVersionableErrorMessage();
    }
    const type = applyMakeVersionableOnDeepObject;
    applyMakeVersionableOnDeepObject = true;
    const proxy = proxify(customClass);
    pullStackedProxify();
    applyMakeVersionableOnDeepObject = type;
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
export function proxify<T extends AllowedMemory>(customClass: T): T {
    if (
        typeof customClass !== 'object' ||
        customClass === null ||
        customClass[memoryProxyNotVersionableKey] // this is set by the user
    ) {
        return customClass;
    }

    const params = customClass[memoryProxyPramsKey];
    if (params && (params.proxy === customClass || params.object === customClass)) {
        // Already versioned ! (we could have inherited from the `params` of
        // another, already versioned object, but we might not)
        return params.proxy;
    }

    if (!applyMakeVersionableOnDeepObject) {
        NotVersionableErrorMessage();
    }
    return _proxify(customClass);
}
function _proxify<T extends AllowedMemory>(customClass: T): T {
    const params = customClass[memoryProxyPramsKey];
    if (params && (params.proxy === customClass || params.object === customClass)) {
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
function pullStackedProxify(): void {
    if (objectStackToProxifyIsPull) {
        return;
    }
    objectStackToProxifyIsPull = true;
    objectStackToProxify.forEach((callbacks, customClass) => {
        objectStackToProxify.delete(customClass);
        const proxy = _proxify(customClass);
        callbacks.forEach(callback => callback(proxy));
    });
    objectStackToProxifyIsPull = false;
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
    const callbacks = objectStackToProxify.get(customClass) || [];
    objectStackToProxify.set(customClass, callbacks);
    callbacks.push(callback);
    pullStackedProxify();
}
