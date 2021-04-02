import { Modifier, ModifierLevel } from '../../core/src/Modifier';
import { CssStyle } from './CssStyle';
import { ClassList } from './ClassList';
import { makeVersionable } from '../../core/src/Memory/Versionable';

export class Attributes extends Modifier {
    level = ModifierLevel.LOW;
    private _record: Record<string, string>;
    style = new CssStyle();
    // Avoid copiying FontAwesome classes on paragraph break.
    // TODO : need to be improved to better take care of color classes, etc.
    preserveAfterParagraphBreak = false;
    classList = new ClassList();
    constructor(attributes?: Attributes | NamedNodeMap | Record<string, string>) {
        super();
        this.style.on('update', this._triggerUpdate.bind(this));
        this.classList.on('update', this._triggerUpdate.bind(this));
        if (attributes instanceof Attributes) {
            for (const key of attributes.keys()) {
                this.set(key, attributes.get(key));
            }
        } else if (attributes instanceof NamedNodeMap) {
            for (const attribute of Array.from(attributes)) {
                this.set(attribute.name, attribute.value);
            }
        } else if (attributes) {
            for (const key of Object.keys(attributes)) {
                this.set(key, attributes[key]);
            }
        }
        if (attributes && (this.style.length || this.classList.length)) {
            console.log('-------\nnew attributes');
            if (this.style.length) console.log(this.style.keys(), this.style.values());
            if (this.classList.length) console.log('class : ' + this.classList.className);
        }
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    get length(): number {
        return this.keys().length;
    }
    get name(): string {
        const name = [];
        for (const attributeName of this.keys()) {
            name.push(`${attributeName}: "${this.get(attributeName)}"`);
        }
        return `{${name.join(', ')}}`;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a clone of this record.
     */
    clone(): this {
        const clone = new this.constructor();
        if (this._record) {
            clone._record = makeVersionable({ ...this._record });
        }
        if (this.style.length) {
            clone.style = this.style.clone();
        }
        if (this.classList.length) {
            clone.classList = this.classList.clone();
        }
        return clone;
    }
    /**
     * Return a string representing the attributes.
     */
    toString(): string {
        if (!this.length) return `${this.constructor.name}: {}`;
        const valueRepr = [];
        for (const key of this.keys()) {
            valueRepr.push(`${key}: "${this.get(key)}"`);
        }
        return `${this.constructor.name}: { ${valueRepr.join(', ')} }`;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the record has the given key, false otherwise.
     *
     * @param key
     */
    has(key: string): boolean {
        return this.keys().includes(key.toLowerCase());
    }
    /**
     * Return an array containing all the keys in the record.
     */
    keys(): string[] {
        const keys = this._record
            ? Object.keys(this._record).filter(key => {
                  return (
                      (key !== 'style' || !!this.style.length) &&
                      (key !== 'class' || !!this.classList.length)
                  );
              })
            : [];
        if (this.classList.length && !keys.includes('class')) {
            // The node was not parsed with a class attribute, add it in place.
            // Use `get` for its value but record its position in the record.
            keys.push('class');
        }
        if (this.style.length && !keys.includes('style')) {
            // The node was not parsed with a style attribute, keep it always at
            // the end of the attributes list.
            keys.push('style');
        }
        return keys;
    }
    /**
     * Return an array containing all the values in the record.
     */
    values(): string[] {
        return this.keys().map(key => this.get(key));
    }
    /**
     * Return the record matching the given name.
     *
     * @param name
     */
    get(name: string): string {
        name = name.toLowerCase();
        if (name === 'style') {
            return this.style?.cssText;
        } else if (name === 'class') {
            return this.classList?.className;
        } else {
            return this._record?.[name];
        }
    }
    /**
     * Set the record with the given name to the given value.
     *
     * @param name
     * @param value
     */
    set(name: string, value: string): void {
        name = name.toLowerCase();
        if (!this._record) {
            this._record = makeVersionable({});
        }
        if (name === 'style') {
            if (this.style) {
                this.style.reset(value);
            } else {
                this.style = new CssStyle();
                this.style.on('update', this._triggerUpdate.bind(this));
            }
            // Use `get` for its value but record its position in the record.
            this._record.style = null;
        } else if (name === 'class') {
            this.classList.reset(value);
            // Use `get` for its value but record its position in the record.
            this._record.class = null;
        } else {
            this._record[name] = value;
        }
        this.trigger('update');
    }
    /**
     * Remove the records with the given names.
     *
     * @param names
     */
    remove(...names: string[]): void {
        for (let name of names) {
            name = name.toLowerCase();
            if (name === 'style') {
                this.style.clear();
            } else if (name === 'class') {
                this.classList.clear();
            } else if (this._record) {
                delete this._record[name];
            }
        }
        if (names.length) {
            this.trigger('update');
        }
    }
    clear(): void {
        delete this._record;
        this.style.clear();
        this.classList.clear();
        this.trigger('update');
    }
    /**
     * Return true if the given attributes are the same as the ones in this
     * record.
     *
     * @param otherAttributes
     */
    isSameAs(otherAttributes: Attributes): boolean {
        if (otherAttributes) {
            return (
                this.length === otherAttributes.length &&
                this.keys().every(key => {
                    return this.get(key) === otherAttributes.get(key);
                })
            );
        } else {
            return !this.length;
        }
    }
    /**
     * @override
     */
    off(eventName: string, callback?: Function): void {
        super.off(eventName, callback);
        this.classList.off(eventName, callback);
        this.style.off(eventName, callback);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _triggerUpdate(): void {
        this.trigger('update');
    }
}
