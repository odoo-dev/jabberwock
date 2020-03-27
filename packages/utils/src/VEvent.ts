/**
 * Abstract class to add event mechanism.
 *
 * @export
 * @class VEvent
 * @template T
 */
export class VEvent<T extends VEvent<T>> {
    _eventCallbacks: Record<string, Function[]> = {};
    parent?: T;
    /**
     * Subscribe to an event with a callback.
     *
     * @param {*} eventName The event name.
     * @param {*} callback The callback that will be called.
     * @memberof VEvent
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
     * @param {*} eventName The event name.
     * @param {*} [args] The arguments of the event.
     * @returns {Promise<void>}
     * @memberof VEvent
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
