/**
 * Abstract class to add event mechanism.
 */
export class EventMixin2 {
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
            this._eventCallbacks = {};
        }
        if (!this._eventCallbacks[eventName]) {
            this._eventCallbacks[eventName] = [];
        }
        this._eventCallbacks[eventName].push(callback);
    }

    /**
     * Stop listening to an event for a specific callback. If no callback is
     * provided, remove stop listening all event `eventName`.
     *
     * @param eventName
     * @param callback
     */
    off(eventName: string, callback?: Function): void {
        if (callback) {
            const index = this._eventCallbacks[eventName].indexOf(callback);
            if (index !== -1) {
                this._eventCallbacks[eventName].splice(index, 1);
            }
        } else {
            this._eventCallbacks[eventName].splice(0);
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
                this._callbackWorking = new Set();
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
