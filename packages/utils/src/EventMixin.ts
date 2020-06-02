/**
 * Abstract class to add event mechanism.
 */
export class EventMixin {
    _eventCallbacks: Record<string, Function[]> = {};
    _callbackWorking: Set<Function> = new Set();

    /**
     * Subscribe to an event with a callback.
     *
     * @param eventName
     * @param callback
     */
    on(eventName: string, callback: Function): void {
        if (!this._eventCallbacks[eventName]) {
            this._eventCallbacks[eventName] = [];
        }
        this._eventCallbacks[eventName].push(callback);
    }

    /**
     * Fire an event for of this object and all ancestors.
     *
     * @param eventName
     * @param args
     */
    trigger<A>(eventName: string, args?: A): void {
        if (this._eventCallbacks[eventName]) {
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
