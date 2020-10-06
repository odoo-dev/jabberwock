import { VersionableArray } from '../../core/src/Memory/VersionableArray';
import { makeVersionable } from '../../core/src/Memory/Versionable';
import { VersionableSet } from '../../core/src/Memory/VersionableSet';

/**
 * Abstract class to add event mechanism.
 */
export class EventMixin {
    _eventCallbacks: Record<string, Function[]>;
    _callbackWorking: Set<Function>;

    /**
     * Subscribe to an event with a callback.
     *
     * @param eventName
     * @param callback
     */
    on(eventName: string, callback: Function): void {
        if (!this._eventCallbacks) {
            this._eventCallbacks = makeVersionable({});
        }
        if (!this._eventCallbacks[eventName]) {
            this._eventCallbacks[eventName] = new VersionableArray();
        }
        this._eventCallbacks[eventName].push(callback);
    }
    /**
     * Unsubscribe to an event (with a callback).
     *
     * @param eventName
     * @param callback
     */
    off(eventName: string, callback?: Function): void {
        const callbacks = this._eventCallbacks?.[eventName];
        if (callback) {
            const index = callbacks?.findIndex(eventCallback => eventCallback === callback);
            if (callbacks && index !== -1) {
                this._eventCallbacks[eventName].splice(index, 1);
                if (!this._eventCallbacks.length) {
                    delete this._eventCallbacks[eventName];
                }
            }
        } else if (this._eventCallbacks) {
            delete this._eventCallbacks[eventName];
        }
        if (this._eventCallbacks && !Object.keys(this._eventCallbacks).length) {
            delete this._eventCallbacks;
        }
    }

    /**
     * Fire an event for of this object and all ancestors.
     *
     * @param eventName
     * @param args
     */
    trigger<A>(eventName: string, args?: A): void {
        if (this._eventCallbacks?.[eventName]) {
            if (!this._callbackWorking) {
                this._callbackWorking = new VersionableSet();
            }
            for (const callback of this._eventCallbacks[eventName]) {
                if (!this._callbackWorking.has(callback)) {
                    this._callbackWorking.add(callback);
                    callback(args);
                    this._callbackWorking.delete(callback);
                }
            }
        }
    }
}
