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
export interface VersionableParams {
    ID: number;
    linkedID: LinkedID;
    memory: MemoryVersionable;
    proxy: AllowedObject;
    object: AllowedObject;
    linkCallback: (memory: MemoryVersionable) => void;
}
let objectStackToProxifyIsPull = false;
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
export function proxify<T extends AllowedMemory>(customClass: T): T {
    if (
        !customClass ||
        typeof customClass !== 'object' ||
        customClass[memoryProxyNotVersionableKey]
    ) {
        return customClass;
    }
    const params = customClass[memoryProxyPramsKey];
    if (params && params.proxy === customClass) {
        return customClass;
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
