import { AllowedMemory, MemoryTypeValues, MemoryType } from './Memory';
import {
    LinkedID,
    typeLinkedID,
    proxify,
    VersionableParams,
    MemoryVersionable,
    generateMemoryID,
    stackedProxify,
} from './Versionable';
import {
    removedItem,
    memoryProxyPramsKey,
    memoryProxyNotVersionableKey,
    FroozenErrorMessage,
} from './const';

type uniqSec = number[];
type uniqID = string;
type uniqIDMemoryTypeValues = Record<uniqID, MemoryTypeValues>;

export class MemoryTypeArray {
    patch: uniqIDMemoryTypeValues = {};
    props: Record<string, MemoryTypeValues | Function> = {};
}
export class MemoryArrayCompiledWithPatch {
    compiled: uniqIDMemoryTypeValues;
    props: uniqIDMemoryTypeValues;
    patch: MemoryTypeArray;
    constructor(
        compiled: uniqIDMemoryTypeValues,
        props: uniqIDMemoryTypeValues,
        patch: MemoryTypeArray,
    ) {
        this.compiled = compiled;
        this.props = props;
        this.patch = patch;
    }
}
const Undefined = Symbol('jabberwockMemoryUndefined');

interface ArrayParams extends VersionableParams {
    uniqIDs: uniqID[];
    sequences: uniqID[];
    previousSliceValues: uniqIDMemoryTypeValues;
    previousSliceProps: Record<string, MemoryTypeValues>;
    proxy: AllowedMemory[];
    object: AllowedMemory[];
    map: Map<AllowedMemory, uniqID>;
    syncSlice: Record<typeLinkedID, MemoryType>;
}

const proxyProps = {
    get(array: AllowedMemory[], prop: string | symbol): AllowedMemory {
        const params = array[memoryProxyPramsKey];
        if (prop === memoryProxyPramsKey) {
            return params;
        }
        const proxy = params.proxy;
        if (prop === 'forEach') {
            return forEach.bind(proxy, params);
        }
        if (!params.memory) {
            return array[prop];
        }
        if (prop === 'indexOf') {
            return indexOf.bind(proxy, params);
        }
        if (prop === 'unshift') {
            return unshift.bind(proxy, params);
        }
        if (prop === 'splice') {
            return splice.bind(proxy, params);
        }
        if (prop === 'shift') {
            return shift.bind(proxy, params);
        }
        proxifySyncArray(params);
        return array[prop];
    },
    set(array: AllowedMemory[], prop: string | symbol, value: AllowedMemory): boolean {
        if (prop === memoryProxyPramsKey) {
            return true;
        }

        const params = array[memoryProxyPramsKey];
        const memory = params.memory;
        value = proxify(value);

        const index = +(prop as string);
        let desc: PropertyDescriptor;
        if (
            !memory ||
            (isNaN(index) && (desc = Object.getOwnPropertyDescriptor(array, prop)) && desc.get)
        ) {
            array[prop] = value as MemoryTypeValues;
            return true;
        }
        if (memory.isFrozen()) {
            FroozenErrorMessage();
        }

        proxifySyncArray(params);

        const oldValue = array[prop];
        if (oldValue === value || (value === removedItem && !(prop in array))) {
            return true;
        }

        const slice = memory.getSlice();
        let memoryArray = slice[params.ID] as MemoryTypeArray;
        if (!memoryArray) {
            slice[params.ID] = memoryArray = new MemoryTypeArray();
        }

        let newParams: VersionableParams;
        if (value !== null && (typeof value === 'object' || typeof value === 'function')) {
            if (typeof value === 'object' && !value[memoryProxyNotVersionableKey]) {
                memory.linkToMemory(value as object);
            }
            newParams = value[memoryProxyPramsKey];
        }

        if (prop === 'length') {
            for (let index = value as number; index < array.length; index++) {
                const val = array[index];
                const oldParams = typeof val === 'object' && val[memoryProxyPramsKey];
                if (oldParams) {
                    memory.deleteSliceProxyParent(
                        oldParams.ID,
                        params.ID,
                        '´' + params.uniqIDs[index],
                    );
                }
                memoryArray.patch[params.uniqIDs[index]] = removedItem;
            }
            array.length = value as number;
            memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
            return true;
        }

        array[prop] = value;

        const oldParams =
            oldValue && typeof oldValue === 'object' ? oldValue[memoryProxyPramsKey] : undefined;

        if (isNaN(index)) {
            memoryArray.props[prop as string] = (newParams && newParams.linkedID) || value;
            if (oldParams) {
                memory.deleteSliceProxyParent(oldParams.ID, params.ID, prop);
            }
            if (newParams) {
                memory.addSliceProxyParent(newParams.ID, params.ID, prop);
            }
            memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
            return true;
        }

        if (oldValue === Undefined) {
            const uid = params.uniqIDs[index];
            if (newParams) {
                memoryArray.patch[uid] = newParams.linkedID;
                memory.addSliceProxyParent(newParams.ID, params.ID, '´' + uid);
            } else {
                memoryArray.patch[uid] = value;
            }
            params.map.set(value, uid);
        } else {
            const uniqIDs = params.uniqIDs;
            const uid = uniqIDs[index];

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
                    slice !== params.syncSlice ||
                    (uid in params.previousSliceValues &&
                        params.previousSliceValues[uid] !== removedItem)
                ) {
                    memoryArray.patch[uid] = removedItem;
                } else {
                    delete memoryArray.patch[uid];
                }
                if (uid && oldParams) {
                    memory.deleteSliceProxyParent(oldParams.ID, params.ID, '´' + uid);
                }
            } else {
                if (index > uniqIDs.length) {
                    for (let k = uniqIDs.length; k < index; k++) {
                        const newUniqID = generateUid(params.sequences, uniqIDs[k - 1]);
                        uniqIDs.push(newUniqID);
                        memoryArray.patch[newUniqID] = Undefined;
                    }
                }
            }

            if (value === removedItem) {
                memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
                return true;
            }

            const isEnd = index >= uniqIDs.length;
            const nearest = isEnd ? undefined : uniqIDs[index];
            const newUniqID = generateUid(params.sequences, nearest, isEnd);
            uniqIDs[index] = newUniqID;

            if (newParams) {
                memory.addSliceProxyParent(newParams.ID, params.ID, '´' + newUniqID);
                memoryArray.patch[newUniqID] = newParams.linkedID;
            } else {
                memoryArray.patch[newUniqID] = value;
            }
            if (!params.map.has(oldValue)) {
                params.map.set(value, newUniqID);
            }
        }

        memory.markDirty(params.ID); // mark the cache as invalide when change the slide memory
        return true;
    },
    has(array: AllowedMemory[], prop: string | symbol): boolean {
        proxifySyncArray(array[memoryProxyPramsKey]);
        return prop in array;
    },
    ownKeys(array: AllowedMemory[]): Array<string | number | symbol> {
        proxifySyncArray(array[memoryProxyPramsKey]);
        return Reflect.ownKeys(array);
    },
    getOwnPropertyDescriptor(array: AllowedMemory[], prop: string | symbol): PropertyDescriptor {
        proxifySyncArray(array[memoryProxyPramsKey]);
        return Reflect.getOwnPropertyDescriptor(array, prop);
    },
    deleteProperty(array: AllowedMemory[], prop: string): boolean {
        this.set(array, prop, isNaN(+prop) ? removedItem : undefined);
        delete array[prop];
        return true;
    },
};

export function proxifyArray<T extends AllowedMemory>(array: T[]): T[] {
    const proxy = new Proxy(array, proxyProps) as T[];

    const ID = generateMemoryID();
    array[memoryProxyPramsKey] = {
        ID: ID,
        linkedID: new LinkedID(ID),
        memory: undefined,
        linkCallback: linkVersionable,
        proxy: proxy,
        object: array,
        map: new Map(),
        uniqIDs: [],
        sequences: [],
        syncSlice: undefined,
        previousSliceValues: undefined,
        previousSliceProps: undefined,
    } as ArrayParams;

    const keys = Object.keys(array);
    for (let k = 0, len = keys.length; k < len; k++) {
        const key = keys[k];
        const value = array[key];
        stackedProxify(value, newValue => {
            if (newValue !== value) {
                array[key] = newValue;
            }
        });
    }
    return proxy;
}

function unshift(params: ArrayParams, ...items: AllowedMemory[]): number {
    proxifySyncArray(params);
    for (let k = 0, len = items.length; k < len; k++) {
        const item = items[k];
        params.object.unshift(Undefined);
        params.uniqIDs.unshift(generateUid(params.sequences, undefined));
        this[0] = item;
    }
    return params.object.length;
}
function shift(params: ArrayParams): AllowedMemory {
    proxifySyncArray(params);
    const value = params.object[0];
    this['0'] = removedItem;
    params.object.shift();
    params.uniqIDs.shift();
    return value;
}
const nativeSlice = [].slice;
function splice(
    params: ArrayParams,
    index: number,
    nb: number,
    ...items: AllowedMemory[]
): AllowedMemory[] {
    proxifySyncArray(params);
    if (nb === undefined) {
        nb = params.object.length - index;
    }
    const value = (nb > 0
        ? nativeSlice.call(params.object, index, index + nb)
        : []) as AllowedMemory[];
    for (let i = 0; i < nb; i++) {
        this[(i + index).toString()] = removedItem;
    }
    if (nb !== 0) {
        params.object.splice(index, nb);
        params.uniqIDs.splice(index, nb);
    }
    for (let key = 0, len = items.length; key < len; key++) {
        const item = items[key];
        const i = key + index;
        params.object.splice(i, 0, Undefined);
        const nearest = params.uniqIDs[i - 1];
        params.uniqIDs.splice(i, 0, generateUid(params.sequences, nearest));
        this[i] = item;
    }
    return value;
}
function forEach(
    params: ArrayParams,
    callback: (value: AllowedMemory, index: number, array: AllowedMemory[]) => void,
): void {
    proxifySyncArray(params);
    const array = params.object;
    for (let index = 0, len = array.length; index < len; index++) {
        callback(array[index], index, this);
    }
}
function indexOf(params: ArrayParams, item: AllowedMemory): number {
    proxifySyncArray(params);
    const uniqID = params.map.get(item);
    if (uniqID === undefined) {
        return -1;
    }
    const uniqIDs = params.uniqIDs;
    let level = uniqIDs.length >> 1;
    let index = level - (uniqIDs.length & 1 ? 0 : 1);
    let value = uniqIDs[index];
    while (value !== uniqID) {
        if (value > uniqID) {
            index -= level;
            if (index < 0) {
                index = 0;
            }
        } else {
            index += level;
        }
        value = uniqIDs[index];
        if (level === 1) {
            return index;
        }
        level = (level + 1) >> 1;
    }
    return index;
}
function proxifySyncArray(
    params: ArrayParams,
): { compiled: uniqIDMemoryTypeValues; sequences: uniqID[] } {
    const memory = params.memory;
    if (!memory) {
        return;
    }
    if (!memory.isDirty(params.ID)) {
        return;
    }
    memory.markAsLoaded(params.ID);
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
    const values = Object.assign({}, rawValues.compiled, rawValues.patch.patch);
    const sequences = Object.keys(values);
    sequences.sort();
    proxifySyncArrayItems(memory, sequences, values, params.object, params.uniqIDs);
    const props = Object.assign({}, rawValues.props, rawValues.patch.props);
    proxifySyncArrayItems(memory, Object.keys(props), props, params.object);

    params.syncSlice = memory.getSlice() as Record<number, MemoryType>;
    params.previousSliceValues = rawValues.compiled;
    params.previousSliceProps = rawValues.props;
    params.sequences = sequences;

    params.map.clear();
    params.object.forEach((item: AllowedMemory, i: number) => {
        params.map.set(item, params.uniqIDs[i]);
    });
}
function proxifySyncArrayItems(
    memory: MemoryVersionable,
    keys: string[],
    values: Record<string, MemoryTypeValues>,
    array: AllowedMemory[],
    uniqIDs?: string[],
): void {
    let index = 0;
    for (let k = 0, len = keys.length; k < len; k++) {
        const key = keys[k];
        let value = values[key];
        if (value === removedItem) {
            continue;
        }
        if (value instanceof LinkedID) {
            value = memory.getProxy(+value as typeLinkedID);
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
function linkVersionable(memory: MemoryVersionable): void {
    this.memory = memory;
    const slice = memory.getSlice();
    const array = this.object;
    const keys = Object.keys(array);
    const len = keys.length;
    const ID = this.ID;
    if (len === 0) {
        memory.markDirty(ID);
        return;
    }
    const memoryArray = (slice[ID] = new MemoryTypeArray());
    const props = memoryArray.props;
    const patch = memoryArray.patch;
    const uniqIDs = this.uniqIDs;
    const sequences = this.sequences;
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
                props[key] = valueParams.linkedID;
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
                patch[newUniqID] = valueParams.linkedID;
                memory.addSliceProxyParent(valueParams.ID, ID, '´' + newUniqID);
            } else {
                patch[newUniqID] = value;
            }
        }
    }
    this.map.clear();
    array.forEach((item: AllowedMemory, i: number) => {
        if (!this.map.has(item)) {
            this.map.set(item, uniqIDs[i]);
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

export class VersionableArray extends Array<AllowedMemory> {
    constructor(...items: AllowedMemory[]) {
        super(...items);
        return proxifyArray(this);
    }
}
