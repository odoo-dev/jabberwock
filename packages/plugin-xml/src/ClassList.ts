export class ClassList {
    private _classList = new Set<string>();
    constructor(...classList: string[]) {
        for (const className of classList) {
            this.add(className);
        }
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * Return the number of classes in the set.
     */
    get length(): number {
        return this._classList.size;
    }
    /**
     * Return a textual representation of the set.
     */
    get className(): string {
        if (!this._classList.size) return;
        return Array.from(this._classList).join(' ');
    }
    /**
     * Reinitialize the set with a new set of classes, from a string to parse.
     */
    set className(className: string) {
        this.reset(className);
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new set of classes, parsed from a className string.
     *
     * @param className
     */
    parseClassName(className: string): Set<string> {
        return new Set(
            className
                .trim()
                .split(/\s+/)
                .filter(c => c.length),
        );
    }
    /**
     * Return a clone of this list.
     */
    clone(): ClassList {
        const clone = new ClassList();
        clone._classList = new Set(this._classList);
        return clone;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the set has the given class, false otherwise.
     *
     * @param name
     */
    has(name: string): boolean {
        return this._classList.has(name);
    }
    /**
     * Return an array containing all the items in the list.
     */
    items(): string[] {
        return Array.from(this._classList);
    }
    /**
     * Add the given class(es) to the set.
     *
     * @param classNames
     */
    add(...classNames: string[]): void {
        for (const className of classNames) {
            if (className) {
                const classes = this.parseClassName(className);
                for (const name of classes) {
                    this._classList.add(name);
                }
            }
        }
    }
    /**
     * Remove the given class(es) from the set.
     *
     * @param classNames
     */
    remove(...classNames: string[]): void {
        for (const className of classNames) {
            if (className) {
                const classes = this.parseClassName(className);
                for (const name of classes) {
                    this._classList.delete(name);
                }
            }
        }
    }
    /**
     * Clear the set of all its classes.
     */
    clear(): void {
        this._classList = new Set();
    }
    /**
     * Reinitialize the set with a new set of classes (empty if no argument is
     * passed). The argument can be a set of classes or a string to parse.
     *
     * @param classList
     */
    reset(...classList: string[]): void {
        this._classList.clear();
        for (const className of classList) {
            this.add(className);
        }
    }
    /**
     * For each given class, add it to the set if it doesn't have it yet,
     * otherwise remove it.
     *
     * @param classes
     */
    toggle(...classes: string[]): void {
        for (const className of classes) {
            const parsed = this.parseClassName(className);
            for (const name of parsed) {
                if (this._classList.has(name)) {
                    this._classList.delete(name);
                } else {
                    this._classList.add(name);
                }
            }
        }
    }
}
