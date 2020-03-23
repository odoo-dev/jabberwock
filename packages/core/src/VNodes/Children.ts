import { VNode, Predicate } from './VNode';
import { Constructor } from '../../../utils/src/utils';

const source: unique symbol = Symbol('source');
const call: unique symbol = Symbol('call');
const handler: unique symbol = Symbol('handler');

/**
 * The prototype singleton object acts as a proxy for Array.prototype function
 * calls such that they are called with the true source array instead as `this`.
 */
const prototype = {};
const stringProperties = Object.getOwnPropertyNames(Array.prototype);
const symbolProperties = Object.getOwnPropertySymbols(Array.prototype);
for (const propertyName of [...stringProperties, ...symbolProperties]) {
    const property = Array.prototype[propertyName];
    if (typeof property === 'function') {
        prototype[propertyName] = function(...args): void {
            return property.call(this[source], ...args);
        };
    }
}

/**
 * The rediction proxy handler ensures that calling the redirected function
 * properly calls the registered callback and that accessing or setting
 * properties of the redirected function are redirected on the callable source.
 */
const redirection: ProxyHandler<CallableArray> = {
    apply: function(target, thisArg, argArray): {} {
        return target[call].call(target[source], target[source], ...argArray);
    },
    get: function(target, property): {}[] {
        if (property === source) {
            return target[source];
        }
        if (prototype[property]) {
            return prototype[property];
        }
        return target[source][property];
    },
    set: function(target, property, value): boolean {
        if (property !== source) {
            target[source][property] = value;
        }
        return true;
    },
};

/**
 * This class implements a callable array by instantiating a function for which
 * calls are redirected to the given callback and read and write operations
 * are redirected to the given array.
 */
interface CallableArray<T, R> extends Array<T> {
    [index: number]: T;
    length: number;
}
class CallableArray<T = {}, R = {}> extends Function {
    [source]: Array<T>;
    [call]: (...args) => R;
    [handler]: ProxyHandler<CallableArray<T, R>>;
    constructor(array: Array<T>, callback: (...args) => R) {
        super();
        this[source] = array;
        this[call] = callback;
        this[handler] = redirection;
        return new Proxy(this, this[handler]);
    }
}

/**
 * This class implements a callable array of VNode.
 *
 * Suppose `const children = new Children([])`. The statement `children`
 * accesses the proper array that was originally given to the constructor.
 * However, calling `children(predicate)` will return an array containing the
 * items of the array which satisfy the given predicate, excluding marker nodes.
 *
 */
export interface Children extends CallableArray<VNode, VNode[]> {
    (predicate?: Predicate): VNode[];
    <T extends VNode>(predicate?: Constructor<T>): T[];
    <T>(predicate?: Predicate<T>): VNode[];
}
export class Children extends CallableArray<VNode, VNode[]> {
    constructor(source: Array<VNode>) {
        super(source, children);
    }
}
function children<T>(children: VNode[], predicate?: Predicate<T>): VNode[] {
    return children.filter(child => child.tangible && child.test(predicate));
}
