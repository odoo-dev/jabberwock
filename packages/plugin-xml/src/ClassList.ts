import { VersionableObject } from '../../core/src/Memory/VersionableObject';
import { EventMixin } from '../../utils/src/EventMixin';
import { makeVersionable } from '../../core/src/Memory/Versionable';

export class ClassList extends EventMixin {
    private _classList: Record<string, boolean>;
    constructor(...classList: string[]) {
        super();
        for (const className of classList) {
            this.add(className);
        }
        return makeVersionable(this);
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * Return the number of classes in the set.
     */
    get length(): number {
        return this._classList ? this.items().length : 0;
    }
    /**
     * Return a textual representation of the set.
     */
    get className(): string {
        if (!this.length) return;
        return this.items().join(' ');
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
        const classList = new Set(
            className
                .trim()
                .split(/\s+/)
                .filter(c => c.length),
        );
        this.trigger('update');
        return classList;
    }
    /**
     * Return a clone of this list.
     */
    clone(): ClassList {
        const clone = new ClassList();
        // TODO: Maybe this should copy the entire history rather than only the
        // currently active classes ?
        clone.add(...this.items());
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
        return this._classList?.[name] || false;
    }
    /**
     * Return an array containing all the items in the list.
     */
    items(): string[] {
        return this._classList
            ? Object.keys(this._classList).filter(key => this._classList[key])
            : [];
    }
    /**
     * Return a record containing all the past and current classes. Classes that
     * are not active anymore have their value set to `false`.
     *
     */
    history(): Record<string, boolean> {
        return Object.assign({ ...this._classList } || {});
    }
    /**
     * Add the given class(es) to the set.
     *
     * @param classNames
     */
    add(...classNames: string[]): void {
        if (!this._classList) {
            this._classList = new VersionableObject() as Record<string, boolean>;
        }
        for (const className of classNames) {
            if (className) {
                const classes = this.parseClassName(className);
                for (const name of classes) {
                    this._classList[name] = true;
                }
            }
        }
        if (classNames.length) {
            this.trigger('update');
        }
    }
    /**
     * Remove the given class(es) from the set.
     *
     * @param classNames
     */
    remove(...classNames: string[]): void {
        if (!this._classList) return;
        for (const className of classNames) {
            if (className) {
                const classes = this.parseClassName(className);
                for (const name of classes) {
                    this._classList[name] = false;
                }
            }
        }
        if (classNames.length) {
            this.trigger('update');
        }
    }
    /**
     * Clear the set of all its classes.
     */
    clear(): void {
        delete this._classList;
        this.trigger('update');
    }
    /**
     * Reinitialize the set with a new set of classes (empty if no argument is
     * passed). The argument can be a set of classes or a string to parse.
     *
     * @param classList
     */
    reset(...classList: string[]): void {
        delete this._classList;
        for (const className of classList) {
            this.add(className);
        }
        if (classList.length) {
            this.trigger('update');
        }
    }
    /**
     * For each given class, add it to the set if it doesn't have it yet,
     * otherwise remove it.
     *
     * @param classes
     */
    toggle(...classes: string[]): void {
        if (!this._classList) {
            this._classList = new VersionableObject() as Record<string, boolean>;
        }
        for (const className of classes) {
            if (className) {
                const parsed = this.parseClassName(className);
                for (const name of parsed) {
                    if (this._classList[name]) {
                        this._classList[name] = false;
                    } else {
                        this._classList[name] = true;
                    }
                }
            }
        }
        if (classes.length) {
            this.trigger('update');
        }
    }
}
