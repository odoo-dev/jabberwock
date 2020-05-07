import { Modifier } from '../../core/src/Modifier';

export class Attributes extends Modifier {
    private _record: Record<string, string> = {};
    constructor(attributes?: Record<string, string> | Attributes) {
        super();
        if (attributes instanceof Attributes) {
            this._record = { ...attributes._record };
        } else if (attributes) {
            this._record = attributes;
        }
    }
    get length(): number {
        return this.keys().length;
    }
    get name(): string {
        const name = [];
        for (const attributeName of this.keys()) {
            name.push(attributeName + ': ' + this.get(attributeName));
        }
        return name.join('; ');
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a clone of this record.
     */
    clone(): this {
        const clone = new this.constructor();
        clone._record = { ...this._record };
        return clone;
    }
    /**
     * Return an array containg all the keys in the record.
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

    keys(): string[] {
        return Object.keys(this._record);
    }
    /**
     * Return an array containing all the values in the record.
     */
    values(): string[] {
        return Object.values(this._record);
    }
    /**
     * Return the record matching the given name.
     *
     * @param name
     */
    get(name: string): string {
        return this._record[name];
    }
    /**
     * Set the record with the given name to the given value.
     *
     * @param name
     * @param value
     */
    set(name: string, value: string): void {
        this._record[name] = value;
    }
    /**
     * Remove the record with the given name.
     *
     * @param name
     */
    remove(name: string): void {
        delete this._record[name];
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
                this.keys().every(key => this._record[key] === otherAttributes._record[key])
            );
        } else {
            return !this.length;
        }
    }
}
