export let isWithMarkers = false;
/**
 * Call a callback on this VNode without ignoring the marker nodes.
 *
 * @param callback
 */
export function withMarkers<T>(callback: () => T): T {
    // Record the previous value to allow for nested calls to `withMarkers`.
    const previousValue = isWithMarkers;
    isWithMarkers = true;
    const result = callback();
    isWithMarkers = previousValue;
    return result;
}
