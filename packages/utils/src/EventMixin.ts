/**
 * Abstract class to add event mechanism.
 */
export class EventMixin<T extends EventMixin<T>> {
    _eventCallbacks: Record<string, Function[]> = {};
    parent?: () => T;
    _callbackWorking: Set<Function> = new Set();
    /**
     * Subscribe to an event with a callback.
     */
    on(eventName: string, callback: Function): void {
        if (!this._eventCallbacks[eventName]) {
            this._eventCallbacks[eventName] = [];
        }
        this._eventCallbacks[eventName].push(callback);
    }

    /**
     * Fire an event for of this object and all ancestors.
     */
    async fire<A>(eventName: string, args?: A): Promise<void> {
        if (this._eventCallbacks[eventName]) {
            for (const callback of this._eventCallbacks[eventName]) {
                if (!this._callbackWorking.has(callback)) {
                    this._callbackWorking.add(callback);
                    await callback(args);
                    this._callbackWorking.delete(callback);
                }
            }
        }

        const parent = this.parent?.();
        if (parent) {
            await parent.fire(eventName, args);
        }
    }
}
