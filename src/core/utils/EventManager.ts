import { EventNormalizer, DomRangeDescription } from './EventNormalizer';
import { DispatchFunction } from '../dispatcher/Dispatcher';
import { ActionGenerator } from '../actions/ActionGenerator';
import { VRangeDescription, RelativePosition } from '../stores/VRange';
import { VDocumentMap } from './VDocumentMap';
import { VNode, VNodeType } from '../stores/VNode';

export interface EventManagerOptions {
    dispatch?: DispatchFunction;
}

const ctrlAltShortcuts = {
    '1': {
        name: 'formatParagraph',
        value: VNodeType.HEADING1,
    },
    '2': {
        name: 'formatParagraph',
        value: VNodeType.HEADING2,
    },
    '3': {
        name: 'formatParagraph',
        value: VNodeType.HEADING3,
    },
    '4': {
        name: 'formatParagraph',
        value: VNodeType.HEADING4,
    },
    '5': {
        name: 'formatParagraph',
        value: VNodeType.HEADING5,
    },
    '6': {
        name: 'formatParagraph',
        value: VNodeType.HEADING6,
    },
    '7': {
        name: 'formatParagraph',
        value: VNodeType.PARAGRAPH,
    },
};

export class EventManager {
    editable: HTMLElement;
    options: EventManagerOptions;
    eventNormalizer: EventNormalizer;

    constructor(editable: HTMLElement, options: EventManagerOptions = {}) {
        this.editable = editable;
        this.options = options;
        this.eventNormalizer = new EventNormalizer(editable, this._triggerEvent.bind(this));
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Convert the DOM values for a range to set to VRange locations in the
     * CustomEvent's payload.
     *
     * @param range
     */
    _convertRange(range: DomRangeDescription): VRangeDescription {
        const start = this._locate(range.startContainer, range.startOffset);
        const end = this._locate(range.endContainer, range.endOffset);
        const [startVNode, startPosition] = start;
        const [endVNode, endPosition] = end;
        return {
            start: startVNode,
            startPosition: startPosition,
            end: endVNode,
            endPosition: endPosition,
            direction: range.direction,
        };
    }
    /**
     * Return a position in the `VDocument` as a tuple containing a reference
     * node and a relative position with respect to this node ('BEFORE' or
     * 'AFTER'). The position is always given on the leaf.
     *
     * @param container
     * @param offset
     */
    _locate(container: Node, offset: number): [VNode, RelativePosition] {
        // Position `BEFORE` is preferred over `AFTER`, unless the offset
        // overflows the children list, in which case `AFTER` is needed.
        let position = RelativePosition.BEFORE;
        const isTextNode = container.nodeType === Node.TEXT_NODE;
        const content = isTextNode ? container.nodeValue : container.childNodes;
        if (offset >= content.length) {
            position = RelativePosition.AFTER;
            offset = content.length - 1;
        }
        // Move to deepest child of container.
        while (container.hasChildNodes()) {
            container = container.childNodes[offset];
            offset = 0;
        }
        // Get the VNodes matching the container.
        const containers = VDocumentMap.fromDom(container);
        // The reference is the offset-th match (eg.: text split into chars).
        return [containers[offset], position];
    }
    /**
     * Match the received signal with the corresponding user intention, based on
     * the user's configuration and context.
     * TODO: this is just a stub
     *
     * @param {CustomEvent} customEvent
     * @returns {Action}
     */
    _matchIntent(customEvent: CustomEvent): Intent {
        // TODO: this value is an implicit any!
        let payload = customEvent.detail;
        let name;
        switch (customEvent.type) {
            case 'selectAll':
            case 'setRange':
                payload.vRange = this._convertRange(payload.domRange);
                break;
            case 'keydown':
                // TODO: keydown should be matched with existing shortcuts. If
                // it matches an intent shortcut, trigger the corresponding
                // intent, otherwise do not trigger a 'keydown' intent.
                if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'b'
                ) {
                    name = 'applyFormat';
                    payload = { format: 'bold' };
                } else if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'i'
                ) {
                    name = 'applyFormat';
                    payload = { format: 'italic' };
                } else if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'u'
                ) {
                    name = 'applyFormat';
                    payload = { format: 'underline' };
                } else if (
                    payload.ctrlKey &&
                    payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey
                ) {
                    // CTRL+ALT shortcuts
                    // TODO: research use payload.code (Digit[0-6]) instead of
                    // payload.key
                    if (Object.keys(ctrlAltShortcuts).includes(payload.key)) {
                        name = ctrlAltShortcuts[payload.key].name;
                        payload.value = ctrlAltShortcuts[payload.key].value;
                    }
                }
        }
        return ActionGenerator.intent({
            name: name || customEvent.type,
            origin: 'EventManager',
            payload: payload,
        });
    }
    /**
     * Take a signal, match it with the corresponding user intention,
     * and dispatch that.
     *
     * @param {CustomEvent} customEvent
     */
    _triggerEvent(customEvent: CustomEvent): void {
        const intent = this._matchIntent(customEvent);
        if (intent) {
            this.options.dispatch(intent);
        }
    }
}
