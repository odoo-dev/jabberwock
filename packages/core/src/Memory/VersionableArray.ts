import {
    MemoryAllowedType,
    MemoryAllowedPrimitiveTypes,
    MemoryWorker,
    MemoryType,
    MemoryTypeArray,
    MemoryArrayCompiledWithPatch,
} from './Memory';
import { VersionableID, _checkVersionable, VersionableParams } from './Versionable';
import {
    removedItem,
    memoryProxyPramsKey,
    memoryProxyNotVersionableKey,
    FroozenError,
} from './const';
import {
    _proxifyObject,
    GettersSetters,
    ProxyObjectHandler,
    proxyObjectHandler,
    keyType,
} from './VersionableObject';

type uniqSec = number[];
type uniqID = string;
type uniqIDMemoryTypeValues = Record<uniqID, MemoryAllowedPrimitiveTypes>;

const Undefined = Symbol('jabberwockMemoryUndefined');

export interface ArrayParams extends VersionableParams {
    uniqIDs: uniqID[];
    sequences: uniqID[];
    proxy: MemoryAllowedType[];
    object: MemoryAllowedType[];
    map: Map<MemoryAllowedType, uniqID>;
    syncSlice?: Record<number, MemoryType>;
    previousSliceValues?: uniqIDMemoryTypeValues;
    proto: GettersSetters;
}

const proxyArrayHandler = {
    get(array: MemoryAllowedType[], prop: keyType, proxy: object): MemoryAllowedType {
        if (typeof prop === 'symbol' || !isNaN(prop as number)) {
            return array[prop];
        }
        const params = array[memoryProxyPramsKey];
        if (!params.memory) {
            return array[prop];
        }
        switch (prop) {
            case 'indexOf':
                return indexOf.bind(proxy, params);
            case 'includes':
                return includes.bind(proxy, params);
            case 'splice':
                return splice.bind(proxy, params);
            case 'push':
                return array[prop];
            case 'unshift':
                return unshift.bind(proxy, params);
            case 'shift':
                return shift.bind(proxy, params);
            case 'pop':
                return pop.bind(proxy, params);
            case 'forEach':
                return forEach.bind(proxy, params);
            case 'map':
                return map.bind(proxy, params);
            case 'filter':
                return filter.bind(proxy, params);
            default:
                return array[prop];
        }
    },
    set(
        proxyObject: MemoryAllowedType[],
        prop: keyType,
        value: MemoryAllowedType,
        proxy: object,
    ): boolean {
        const params: ArrayParams = proxyObject[memoryProxyPramsKey];
        const array = params.object;
        if (
            typeof prop === 'symbol' ||
            !params.memory ||
            (prop !== 'length' && isNaN(prop as number))
        ) {
            return proxyObjectHandler.set(array, prop, value, proxy);
        }

        const index = +prop;
        const memory = params.memory;
        if (memory.isFrozen()) {
            throw new FroozenError();
        }

        const oldValue = array[prop];
        if (oldValue === value || (value === removedItem && !(prop in array))) {
            // no change
            return true;
        }

        const slice = memory.getSlice();
        let memoryArray = slice[params.ID as number] as MemoryTypeArray;
        if (!memoryArray) {
            slice[params.ID as number] = memoryArray = new params.MemoryType() as MemoryTypeArray;
        }
        if (slice !== params.syncSlice) {
            // allready sync, the current value (before update) is the previous value
            params.syncSlice = slice;
            params.previousSliceValues = {};
            array.forEach((value: MemoryAllowedType, index: number) => {
                params.previousSliceValues[params.uniqIDs[index]] = value;
            });
        }

        if (prop === 'length') {
            const length = +(value as number);
            for (let index = length; index < array.length; index++) {
                const val = array[index];
                const oldParams = typeof val === 'object' && val[memoryProxyPramsKey];
                if (oldParams) {
                    memory.deleteSliceProxyParent(
                        oldParams.ID,
                        params.ID,
                        '´' + params.uniqIDs[index],
                    );
                }
                const uid = params.uniqIDs[index];
                if (
                    params.previousSliceValues[uid] === removedItem ||
                    !(uid in params.previousSliceValues)
                ) {
                    delete memoryArray.patch[uid];
                } else {
                    memoryArray.patch[uid] = removedItem;
                }
            }
            array.length = length;
            memory.markDirty(params.ID); // mark the cache as invalid when change the slide memory
            return true;
        }

        let newParams: VersionableParams;
        if (value !== null && typeof value === 'object' && !value[memoryProxyNotVersionableKey]) {
            _checkVersionable(value);
            memory.linkToMemory(value as object);
            newParams = value[memoryProxyPramsKey];
        }

        array[prop] = value;

        if (oldValue === Undefined) {
            const uid = params.uniqIDs[index];
            if (newParams) {
                memoryArray.patch[uid] = newParams.ID;
                memory.addSliceProxyParent(newParams.ID, params.ID, '´' + uid);
            } else {
                memoryArray.patch[uid] = value;
            }
            params.map.set(value, uid);
        } else {
            const uniqIDs = params.uniqIDs;
            const uid = uniqIDs[index];

            // begin with remove previous

            if (uid) {
                const mapUID = params.map.get(oldValue);
                if (mapUID === uid) {
                    params.map.delete(oldValue);
                    const otherIndex = array.indexOf(oldValue);
                    if (otherIndex !== -1) {
                        params.map.set(oldValue, uniqIDs[otherIndex]);
                    }
                }
                if (
                    params.previousSliceValues[uid] === removedItem ||
                    !(uid in params.previousSliceValues)
                ) {
                    delete memoryArray.patch[uid];
                } else {
                    memoryArray.patch[uid] = removedItem;
                }

                const oldParams =
                    oldValue && typeof oldValue === 'object' && oldValue[memoryProxyPramsKey];
                if (oldParams) {
                    memory.deleteSliceProxyParent(oldParams.ID, params.ID, '´' + uid);
                }
            }

            if (value === removedItem) {
                memory.markDirty(params.ID); // mark the cache as invalid when change the slide memory
                return true;
            }

            // and then we add item

            if (!uid && index > uniqIDs.length) {
                // add fake undefined values (don't add undefined in array)
                for (let k = uniqIDs.length; k < index; k++) {
                    const newUniqID = generateUid(params.sequences, uniqIDs[k - 1]);
                    uniqIDs.push(newUniqID);
                    memoryArray.patch[newUniqID] = Undefined;
                }
            }

            const isEnd = index >= uniqIDs.length;
            const nearest = isEnd ? undefined : uniqIDs[index];
            const newUniqID = generateUid(params.sequences, nearest, isEnd);
            uniqIDs[index] = newUniqID;

            if (newParams) {
                memory.addSliceProxyParent(newParams.ID, params.ID, '´' + newUniqID);
                memoryArray.patch[newUniqID] = newParams.ID;
            } else {
                memoryArray.patch[newUniqID] = value;
            }
            if (!params.map.has(oldValue)) {
                params.map.set(value, newUniqID);
            }
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

export function _proxifyArray<T extends MemoryAllowedType>(array: T[]): T[] {
    const proxyObject = _proxifyObject(array);
    const proxy = new Proxy(proxyObject, proxyArrayHandler) as T[];
    const params = proxyObject[memoryProxyPramsKey] as ArrayParams;
    params.proxy = proxy;
    params.linkCallback = linkVersionable;
    params.MemoryType = MemoryTypeArray;
    params.map = new Map();
    params.uniqIDs = [];
    params.sequences = [];
    return proxy;
}

function unshift(params: ArrayParams, ...items: MemoryAllowedType[]): number {
    for (let k = 0, len = items.length; k < len; k++) {
        const item = items[k];
        params.object.unshift(Undefined);
        params.uniqIDs.unshift(generateUid(params.sequences, undefined));
        this[0] = item;
    }
    return params.object.length;
}
function shift(params: ArrayParams): MemoryAllowedType {
    const value = params.object[0];
    this['0'] = removedItem;
    params.object.shift();
    params.uniqIDs.shift();
    return value;
}
function pop(params: ArrayParams): MemoryAllowedType {
    const lastIndex = params.object.length - 1;
    const value = params.object[lastIndex];
    this.length = lastIndex;
    return value;
}
function splice(
    params: ArrayParams,
    index: number,
    nb: number,
    ...items: MemoryAllowedType[]
): MemoryAllowedType[] {
    const array = params.object;
    const uniqIDs = params.uniqIDs;
    const len = array.length;
    if (nb === undefined) {
        nb = len - index;
    }
    const value: MemoryAllowedType[] = new (array.constructor as typeof Array)();
    if (nb > 0) {
        for (let i = 0; i < nb; i++) {
            value.push(array[i + index]);
        }
        for (let i = 0; i < nb; i++) {
            this[(i + index).toString()] = removedItem;
        }
        array.splice(index, nb);
        uniqIDs.splice(index, nb);
    }
    for (let key = 0, len = items.length; key < len; key++) {
        const item = items[key];
        const i = key + index;
        array.splice(i, 0, Undefined);
        const nearest = uniqIDs[i - 1];
        uniqIDs.splice(i, 0, generateUid(params.sequences, nearest));
        this[i] = item;
    }
    return value;
}
function forEach(
    params: ArrayParams,
    callback: (value: MemoryAllowedType, index: number, array: MemoryAllowedType[]) => void,
): void {
    const array = params.object;
    for (let index = 0, len = array.length; index < len; index++) {
        callback(array[index], index, this);
    }
}
function map(
    params: ArrayParams,
    callback: (
        value: MemoryAllowedType,
        index: number,
        array: MemoryAllowedType[],
    ) => MemoryAllowedType,
): MemoryAllowedType[] {
    const result = [];
    const array = params.object;
    for (let index = 0, len = array.length; index < len; index++) {
        result.push(callback(array[index], index, this));
    }
    return result;
}
function filter(
    params: ArrayParams,
    callback: (value: MemoryAllowedType, index: number, array: MemoryAllowedType[]) => boolean,
): MemoryAllowedType[] {
    const result = [];
    const array = params.object;
    for (let index = 0, len = array.length; index < len; index++) {
        const value = array[index];
        if (callback(value, index, this)) {
            result.push(value);
        }
    }
    return result;
}
function indexOf(params: ArrayParams, item: MemoryAllowedType): number {
    return params.object.indexOf(item);
}
function includes(params: ArrayParams, item: MemoryAllowedType): boolean {
    return params.object.includes(item);
}
function proxifySyncArray(): { compiled: uniqIDMemoryTypeValues; sequences: uniqID[] } {
    // Synchronization function
    // Most methods of the "proxy" will call this synchronization function, even
    // if it is not yet linked to a memory !
    const params = this as ArrayParams;
    const memory = params.memory;
    // empties the array
    params.uniqIDs.length = 0;
    params.object.length = 0;
    // Clear props
    const keys = Object.keys(params.object);
    let key: string;
    while ((key = keys.pop())) {
        delete params.object[key];
    }
    const rawValues = memory.getSliceValue(params.ID) as MemoryArrayCompiledWithPatch;

    if (!rawValues) {
        return;
    }
    const values = Object.assign({}, rawValues.compiledValues, rawValues.newValues.patch);
    const sequences = Object.keys(values);
    sequences.sort();
    proxifySyncArrayItems(memory, sequences, values, params.object, params.uniqIDs);
    const props = Object.assign({}, rawValues.props, rawValues.newValues.props);
    proxifySyncArrayItems(memory, Object.keys(props), props, params.object);

    params.syncSlice = memory.getSlice() as Record<number, MemoryType>;
    params.previousSliceValues = rawValues.compiledValues;
    params.sequences = sequences;

    params.map.clear();
    params.object.forEach((item: MemoryAllowedType, i: number) => {
        params.map.set(item, params.uniqIDs[i]);
    });
}
function proxifySyncArrayItems(
    memory: MemoryWorker,
    keys: string[],
    values: Record<string, MemoryAllowedPrimitiveTypes>,
    array: MemoryAllowedType[],
    uniqIDs?: string[],
): void {
    let index = 0;
    for (let k = 0, len = keys.length; k < len; k++) {
        const key = keys[k];
        let value = values[key];
        if (value === removedItem) {
            continue;
        }
        if (value instanceof VersionableID) {
            value = memory.getProxy(value);
        }
        if (uniqIDs) {
            if (value !== Undefined) {
                array[index] = value;
            }
            uniqIDs.push(key);
            index++;
        } else {
            array[key] = value;
        }
    }
}
function linkVersionable(memory: MemoryWorker): void {
    const params = this as ArrayParams;
    params.memory = memory;
    params.synchronize = proxifySyncArray;
    const slice = memory.getSlice();
    const array = params.object;
    const keys = Object.keys(array);
    const len = keys.length;
    const ID = params.ID;
    if (len === 0) {
        memory.markDirty(ID);
        return;
    }
    const memoryArray = (slice[ID as number] = new params.MemoryType() as MemoryTypeArray);
    const props = memoryArray.props;
    const patch = memoryArray.patch;
    const uniqIDs = params.uniqIDs;
    const sequences = params.sequences;
    let arrayIndex = -1;
    for (let k = 0; k < len; k++) {
        const key = keys[k];
        const index = +key;
        const value = array[key];
        const valueParams =
            value !== null && typeof value === 'object' && value[memoryProxyPramsKey];

        if (valueParams) {
            memory.linkToMemory(value as object);
        }
        if (isNaN(index)) {
            if (valueParams) {
                props[key] = valueParams.ID;
                memory.addSliceProxyParent(valueParams.ID, ID, key);
            } else {
                props[key] = value;
            }
        } else {
            arrayIndex++;
            while (arrayIndex < index) {
                const newUniqID = generateUid(sequences, undefined, true);
                uniqIDs[arrayIndex] = newUniqID;
                patch[newUniqID] = Undefined;
                arrayIndex++;
            }
            const newUniqID = generateUid(sequences, undefined, true);
            uniqIDs[index] = newUniqID;
            if (valueParams) {
                patch[newUniqID] = valueParams.ID;
                memory.addSliceProxyParent(valueParams.ID, ID, '´' + newUniqID);
            } else {
                patch[newUniqID] = value;
            }
        }
    }
    params.map.clear();
    array.forEach((item: MemoryAllowedType, i: number) => {
        if (!params.map.has(item)) {
            params.map.set(item, uniqIDs[i]);
        }
    });
    memory.markDirty(ID);
}

// IDs

function allocUid(min: uniqSec, max: uniqSec): uniqSec {
    const step = 4;
    if (!min && !max) {
        return [128];
    }
    min = min || [];
    max = max || [];
    const res = [];
    let minSeq = 0;
    let maxSeq = max[0];
    for (let index = 0, len = Math.max(min.length, max.length); index < len; index++) {
        minSeq = min[index] | 0;
        maxSeq = index in max ? max[index] : 4096;
        if (minSeq === 4095 && maxSeq === 4096) {
            res.push(minSeq);
        } else if (minSeq === maxSeq) {
            res.push(minSeq);
        } else if (minSeq === maxSeq - 1 && len > index - 1) {
            res.push(minSeq);
        } else {
            break;
        }
    }
    const diff = (maxSeq - minSeq) >> 1;
    if (diff === 0) {
        res.push(min.length ? 128 : 2048);
    } else if (minSeq === 0) {
        res.push(maxSeq - Math.min(diff, step));
    } else {
        res.push(minSeq + Math.min(diff, step));
    }
    return res;
}
function hexaToSeq(str: string): uniqSec {
    const seq = [];
    for (let k = 0, len = str.length; k < len; k += 3) {
        seq.push(parseInt(str.slice(k, k + 3), 16));
    }
    return seq;
}
function SeqToHexa(seq: uniqSec): uniqID {
    let str = '';
    const len = seq.length;
    for (let k = 0; k < len; k++) {
        const n = seq[k];
        if (n === 0) {
            str += '000';
        } else if (n < 16) {
            str += '00' + n.toString(16);
        } else if (n < 256) {
            str += '0' + n.toString(16);
        } else {
            str += n.toString(16);
        }
    }
    return str;
}
function generateUid(sortedUniqIDs: uniqID[], min: uniqID, isEnd?: boolean): uniqID {
    let max: uniqID;
    if (isEnd) {
        min = sortedUniqIDs[sortedUniqIDs.length - 1];
    } else if (min) {
        max = sortedUniqIDs[sortedUniqIDs.indexOf(min) + 1];
    } else {
        max = sortedUniqIDs[0];
    }
    const minSeq = min && hexaToSeq(min);
    const maxSeq = max && hexaToSeq(max);
    const newUniqID = SeqToHexa(allocUid(minSeq, maxSeq));

    if (isEnd) {
        sortedUniqIDs.push(newUniqID);
    } else {
        const sortedIndex = min ? sortedUniqIDs.indexOf(min) : -1;
        if (sortedIndex === -1) {
            sortedUniqIDs.unshift(newUniqID);
        } else {
            sortedUniqIDs.splice(sortedIndex + 1, 0, newUniqID);
        }
    }
    return newUniqID;
}

export class VersionableArray<T extends MemoryAllowedType = MemoryAllowedType> extends Array<T> {
    constructor(...items: T[]) {
        super(...items);
        return _proxifyArray(this);
    }
}
