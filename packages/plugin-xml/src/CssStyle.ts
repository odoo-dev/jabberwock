export class CssStyle {
    private _style: Record<string, string> = {};
    constructor(style?: string | Record<string, string>) {
        if (style) {
            this.reset(style);
        }
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * Return the number of styles in the set.
     */
    get length(): number {
        return Object.keys(this._style).length;
    }
    /**
     * Return a textual representation of the CSS declaration block.
     */
    get cssText(): string {
        const keys = Object.keys(this._style);
        if (!Object.keys(this._style).length) return;
        const valueRepr = [];
        for (const key of keys) {
            valueRepr.push(`${key}: ${this._style[key]}`);
        }
        let result = valueRepr.join('; ');
        if (valueRepr.length) {
            result += ';';
        }
        return result;
    }
    /**
     * Reinitialize the record with a new record of styles, from a string to
     * parse.
     */
    set cssText(cssText: string) {
        this.reset(cssText);
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new record of styles, parsed from a cssText string.
     *
     * @param className
     */
    parseCssText(cssText: string): Record<string, string> {
        const style: Record<string, string> = {};
        return cssText
            .split(';')
            .map(style => style.trim())
            .filter(style => style.length)
            .reduce((accumulator, value) => {
                const [key, v] = value.split(':');
                style[key.trim()] = v.trim();
                return accumulator;
            }, style);
    }
    /**
     * Return a clone of this record.
     */
    clone(): CssStyle {
        const clone = new CssStyle();
        clone._style = { ...this._style };
        return clone;
    }
    /**
     * Return the style value as record.
     */
    toJSON(): Record<string, string> {
        return Object.assign({}, this._style);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the record has the given style, false otherwise.
     *
     * @param key
     */
    has(key: string): boolean {
        return !!this._style[key];
    }
    /**
     * Return an array containing all the keys in the record.
     */
    keys(): string[] {
        return Object.keys(this._style);
    }
    /**
     * Return an array containing all the values in the record.
     */
    values(): string[] {
        return Object.values(this._style);
    }
    /**
     * Return the record matching the given name.
     *
     * @param name
     */
    get(name: string): string {
        return this._style[name];
    }
    /**
     * Set the records with the given names to the given values.
     * Eg: `set({ width: '100%', height: '100%' });`
     *
     * @param pairs [name, value]
     */
    set(pairs: Record<string, string>): void;
    /**
     * Set the record with the given name to the given value.
     * Eg: `set('position', 'fixed');`
     *
     * @param name
     * @param value
     */
    set(name: string, value: string): void;
    set(pairsOrName: string | Record<string, string>, value?: string): void {
        if (typeof pairsOrName === 'string') {
            this._style[pairsOrName] = value;
        } else {
            for (const name of Object.keys(pairsOrName)) {
                this._style[name] = pairsOrName[name];
            }
        }
    }
    /**
     * Remove the record(s) with the given name(s).
     *
     * @param name
     */
    remove(...names: string[]): void {
        for (const name of names) {
            delete this._style[name];
        }
    }
    /**
     * Clear the record of all its styles.
     */
    clear(): void {
        this._style = {};
    }
    /**
     * Reinitialize the record with a new record of styles (empty if no argument
     * is passed). The argument can be a record of styles or a string to parse.
     *
     * @param style
     */
    reset(style: Record<string, string> | string = {}): void {
        if (typeof style === 'object') {
            this._style = style;
        } else {
            this._style = this.parseCssText(style);
        }
    }
}
