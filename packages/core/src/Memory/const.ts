export const memoryProxyNotVersionableKey = Symbol('jabberwockMemoryNotVersionable');
export const memoryProxyPramsKey = Symbol('jabberwockMemoryParams');
export const removedItem = Symbol('jabberwockMemoryRemovedItem');
export const symbolItsme = Symbol('jabberwockMemoryItsme');

export function NotVersionableErrorMessage(): void {
    throw new Error(
        'You can only link to the memory the instance of VersionableObject, VersionableArray or VersionableSet.' +
            "\nIf that's not possible, then you can also use makeVersionable method on your custom object." +
            '\nIf you do not want to make versionable this object, indicate it using MarkNotVersionable method' +
            '\nPlease read the Jabberwock documentation.',
    );
}
export function VersionableAllreadyVersionableErrorMessage(): void {
    throw new Error(
        'This object was already update and a proxy was create to be versionable.' +
            '\nPlease use it instead of the source object.',
    );
}
export function FroozenErrorMessage(): void {
    throw new Error(
        'This memory is froozen and immutable.' +
            '\nYou can not update a memory version who content memory dependencies',
    );
}
