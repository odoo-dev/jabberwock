import { Format } from './Format';
import { Constructor } from '../utils/src/utils';

export class Formats extends Array<Format> {
    constructor(...formats: Array<Format | Constructor<Format>>) {
        // Native constructor of Array takes a number. It is called with a
        // number ie. by `splice`.
        super(typeof formats[0] === 'number' ? formats[0] : 0);
        if (typeof formats[0] !== 'number') {
            this.append(...formats);
        }
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return an new instance of the class, with a copy of its contents.
     */
    clone(): Formats {
        return new Formats(...this);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Push one or more formats to the array. If one of the formats passed is an
     * uninstantiated format class, instantiate it.
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
     * Unshift one or more formats to the array. If one of the formats passed is
     * an uninstantiated format class, instantiate it.
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
     * format class, if any. If the format passed is actually an instance,
     * return it if it was present in the array.
     *
     * @param format
     */
    get<T extends Format>(format: T | Constructor<T>): T {
        if (format instanceof Format) {
            return this.find(formatInstance => formatInstance === format) as T;
        } else {
            return this.find(formatInstance => formatInstance instanceof format) as T;
        }
    }
    /**
     * Return the index of the first format in the array that is an instance of
     * the given format class or that matches the particular instance passed (if
     * an instance was passed and not a constructor), if any.
     *
     * @param format
     */
    getIndex(format: Format | Constructor<Format>): number {
        if (format instanceof Format) {
            return this.indexOf(format);
        } else {
            return this.findIndex(formatInstance => formatInstance instanceof format);
        }
    }
    /**
     * Remove the first format in the array that is an instance of the given
     * format class or that matches the particular instance passed (if an
     * instance was passed and not a constructor), if any. Return true if a
     * format was removed, false otherwise.
     *
     * @param format
     */
    remove(format: Format | Constructor<Format>): boolean {
        const formatIndex = this.getIndex(format);
        if (formatIndex === -1) {
            return false;
        } else {
            this.splice(formatIndex, 1);
            return true;
        }
    }
    /**
     * Replace the first format in the array that is an instance of the given
     * format class or that matches the particular instance passed (if an
     * instance was passed and not a constructor), if any, with the given format
     * instance. If the new format passed is a class, instantiate it.
     * If no format was found, simply add the new format to the array.
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
        const formatIndex = this.getIndex(oldFormat);
        const newFormatInstance = newFormat instanceof Format ? newFormat : new newFormat();
        if (formatIndex === -1) {
            this.append(newFormat);
            return false;
        } else {
            this.splice(formatIndex, 1, newFormatInstance);
            return true;
        }
    }
    /**
     * Remove the first format in the array that is an instance of the given
     * format class or that matches the particular instance passed (if an
     * instance was passed and not a constructor).
     * If no format was found, add the format passed instead.
     * If the new format passed is a class, instantiate it.
     *
     * @param format
     */
    toggle(format: Format | Constructor<Format>): void {
        this.remove(format) || this.append(format);
    }
}
