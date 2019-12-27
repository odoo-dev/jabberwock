export let isWithMarkers = false;
/**
 * Call a callback on the VDocument without ignoring the markers nodes.
 *
 * @param callback
 */
export function withMarkers<T>(callback: () => T): T {
    // Record the previous value for nested calls to `withMarkers`.
    const previousValue = isWithMarkers;
    isWithMarkers = true;
    const result = callback();
    isWithMarkers = previousValue;
    return result;
}
