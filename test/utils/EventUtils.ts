interface EventPayload {
    key?: string;
    charCode?: number;
    keyCode?: number;
}
interface Event {
    type: string;
    payload: EventPayload;
}

interface Events {
    foo: string;
}

// todo: move me or find a bettor solutino to get this definition
declare global {
    interface Window {
        InputEvent: typeof InputEvent;
        CustomEvent: any;
    }
}

/**
 * Get the event type based on its name.
 *
 * @private
 * @param {string} eventName
 * @returns string 'mouse' | 'keyboard' | 'unknown'
 */
export function getEventType(eventName: string): string | undefined {
    const types = {
        mouse: ['click', 'mouse', 'pointer', 'contextmenu', 'select', 'wheel'],
        keyboard: ['key'],
    };
    return Object.keys(types).find(function(key) {
        return types[key].some(str => str === eventName);
    });
}

/**
 * Trigger events natively on the specified target.
 *
 * @param {node} el
 * @param {string []} eventNames
 * @param {object} [options]
 * @returns Promise <Event []>
 */
export function triggerNativeEvents(el: Node, eventName, options): void {
    options = Object.assign({}, options, {
        view: window,
        bubbles: true,
        cancelable: true,
    });
    switch (getEventType(eventName)) {
        case 'mouse':
            el.dispatchEvent(new MouseEvent(eventName, options));
            break;
        case 'keyboard':
            el.dispatchEvent(new KeyboardEvent(eventName, options));
            break;
        default:
            console.log('create event:', eventName);
            el.dispatchEvent(new Event(eventName, options));
            break;
    }
}

/**
 * @private
 * @param {string} data
 * @param {string} insert
 */
export function _triggerTextInput(el, data, insert): void {
    const ev = new (window.InputEvent || window.CustomEvent)('input', {
        bubbles: true,
        cancelBubble: false,
        cancelable: true,
        composed: true,
        data: data,
        defaultPrevented: false,
        detail: 0,
        eventPhase: 3,
        isTrusted: true,
        returnValue: true,
        sourceCapabilities: null,
        inputType: 'textInput',
        which: 0,
    });
    el.dispatchEvent(ev);
    if (!ev.defaultPrevented && insert) {
        el.ownerDocument.execCommand('insertText', 0, insert);
    }
}

/**
 * This function trigger `events` on `el`.
 *
 * @param el
 * @param events
 */
export async function triggerEvents(el: Element, events): Promise<boolean> {
    let ev;
    events.forEach(event => {
        //? why?
        if (ev && event.nativeEventType !== 'keydown' && event.nativeEventType !== 'keyup' && ev.defaultPrevented) {
            return;
        }
        if (event.inputType === 'insertText') {
            el.ownerDocument.execCommand('insertText', false, event.data);
        } else if (event.nativeEventType === 'textInput' || event.inputType === 'textInput') {
            ev = _triggerTextInput(el, event.data, event.insert);
        } else {
            const options = Object.assign({}, event);
            if (event.nativeEventType === 'keypress') {
                options.noTextInput = true;
            }
            ev = triggerNativeEvents(el, event.nativeEventType, options);
        }
    });
    return new Promise((resolve): void => resolve(true));
}

// export async function triggerEvents(events): Promise<boolean> {
//     return new Promise((resolve): void => resolve(true));
// }

export function _selectDOMRange(node, offset): void {
    const nativeRange = node.ownerDocument.createRange();
    nativeRange.setStart(node, offset);
    nativeRange.setEnd(node, offset + 1);
    const selection = node.ownerDocument.getSelection();
    if (selection.rangeCount > 0) {
        selection.removeAllRanges();
    }
    selection.addRange(nativeRange);
}

export async function nextTick(): Promise<boolean> {
    return new Promise((resolve): void => {
        setTimeout(resolve);
    });
}
