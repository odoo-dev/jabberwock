import { CustomError } from '../../../utils/src/errors';

export const memoryProxyNotVersionableKey = Symbol('jabberwockMemoryNotVersionable');
export const memoryProxyPramsKey = Symbol('jabberwockMemoryParams');
export const removedItem = Symbol('jabberwockMemoryRemovedItem');
export const symbolVerify = Symbol('jabberwockMemoryVerify');

/**
 * Creates an instance representing an error that occurs when theyr are any
 * error in the memory feature or with the integration of the memory.
 */
export class MemoryError extends CustomError {
    constructor(message?: string, ...params) {
        super(message, ...params);
        this.message = message || 'Jabberwok error in memory feature';
    }
}
export class NotVersionableError extends MemoryError {
    constructor() {
        super();
        this.message =
            'You can only link to the memory the instance of VersionableObject, VersionableArray or VersionableSet.' +
            "\nIf that's not possible, then you can also use makeVersionable method on your custom object." +
            '\nIf you do not want to make versionable this object, indicate it using MarkNotVersionable method' +
            '\nPlease read the Jabberwock documentation.';
    }
}
export class VersionableAllreadyVersionableError extends MemoryError {
    constructor() {
        super();
        this.message =
            'This object was already update and a proxy was create to be versionable.' +
            '\nPlease use it instead of the source object.';
    }
}
export class FrozenError extends MemoryError {
    constructor() {
        super();
        this.message =
            'This memory is frozen and immutable.' +
            '\nYou can not update a memory version who content memory dependencies';
    }
}
