import { Format } from './Format';
import { Constructor } from '../utils/src/utils';

export class Formats extends Array<Format> {
    constructor(...formats: Array<Format | Constructor<Format>>) {
        // Native Array constructor takes the length as argument.
        const length = formats[0];
        if (typeof length === 'number') {
            super(length);
        } else {
            super(0);
            this.append(...formats);
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Append one or more formats to the array. If one of the given formats is a
     * format class constructor, instantiate it.
     *
     * @param formats
     */
    append(...formats: Array<Format | Constructor<Format>>): void {
        for (const format of formats) {
            if (format instanceof Format) {
                this.push(format);
            } else {
                this.push(new format());
            }
        }
    }
    /**
     * Prepend one or more formats to the array. If one of the given formats is
     * a format class constructor, instantiate it.
     *
     * @param formats
     */
    prepend(...formats: Array<Format | Constructor<Format>>): void {
        for (const format of formats) {
            if (format instanceof Format) {
                this.unshift(format);
            } else {
                this.unshift(new format());
            }
        }
    }
    /**
     * Return the first format in the array that is an instance of the given
     * format class, if any. If the format passed is a format instance, return
     * it if it was present in the array.
     *
     * @param format
     */
    get<T extends Format>(format: T | Constructor<T>): T {
        if (format instanceof Format) {
            return this.find(instance => instance === format) as T;
        } else {
            for (const instance of this) {
                if (instance instanceof format) {
                    return instance;
                }
            }
        }
    }
    /**
     * Remove the first format in the array that is an instance of the given
     * format class. If a format instance is given, remove that particuar
     * instance from the array. Return true if a format was removed, false
     * otherwise.
     *
     * @param format
     */
    remove(format: Format | Constructor<Format>): boolean {
        const formatIndex = this.findIndex(formatInstance => {
            if (format instanceof Format) {
                return formatInstance === format;
            } else {
                return formatInstance instanceof format;
            }
        });
        if (formatIndex === -1) {
            return false;
        } else {
            this.splice(formatIndex, 1);
            return true;
        }
    }
    /**
     * Replace the first format in the array that is an instance of the given
     * format class or that matches the particular instance passed with the
     * given format instance. If the new format passed is a class, instantiate
     * it. If no format was found, simply push the new format on the array.
     *
     * Return true if a format was replaced, false if the format was simply
     * added.
     *
     * @param oldFormat
     * @param newFormat
     */
    replace(
        oldFormat: Format | Constructor<Format>,
        newFormat: Format | Constructor<Format>,
    ): boolean {
        const oldFormatIndex = this.findIndex(formatInstance => {
            if (oldFormat instanceof Format) {
                return formatInstance === oldFormat;
            } else {
                return formatInstance instanceof oldFormat;
            }
        });
        if (oldFormatIndex === -1) {
            this.append(newFormat);
            return false;
        } else {
            const format = newFormat instanceof Format ? newFormat : new newFormat();
            this[oldFormatIndex] = format;
            return true;
        }
    }
    /**
     * Remove the first format in the array that is an instance of the given
     * format class or that matches the particular instance passed.
     * If no format was found, add the given format instead.
     * If the given new format is a class, instantiate it.
     *
     * @param format
     */
    toggle(format: Format | Constructor<Format>): void {
        this.remove(format) || this.append(format);
    }
    /**
     * Return a new instance of the Formats class containing the same formats.
     */
    clone(): Formats {
        return new Formats(...this);
    }
}
