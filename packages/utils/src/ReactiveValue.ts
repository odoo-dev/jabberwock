import { EventMixin } from './EventMixin';

export class ReactiveValue<T> extends EventMixin {
    constructor(private _value?: T) {
        super();
    }

    /**
     * Set the value of this reactiveValue.
     *
     * @param {T} value The value to set.
     * @param {boolean} [fire=true] Fire an event if true.
     * @returns {Promise<void>}
     * @memberof ReactiveValue
     */
    async set(value: T, fire = true): Promise<void> {
        if (value !== this._value) {
            this._value = value;
            if (fire) {
                await this.fire('set', value);
            }
        }
    }

    /**
     * Get the value of this reactiveValue.
     *
     * @returns {T}
     * @memberof ReactiveValue
     */
    get(): T {
        return this._value;
    }
}
