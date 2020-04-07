/**
 * Abstract class to add event mechanism.
 */
export class EventMixin<T extends EventMixin<T>> {
    _eventCallbacks: Record<string, Function[]> = {};
    parent?: T;
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
    async fire<T>(eventName: string, args?: T): Promise<void> {
        if (this._eventCallbacks[eventName]) {
            for (const callback of this._eventCallbacks[eventName]) {
                await callback(args);
            }
        }

        if (this.parent) {
            await this.parent.fire(eventName, args);
        }
    }
}
