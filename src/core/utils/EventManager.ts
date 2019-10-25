import { EventNormalizer, DomRangeChange } from './EventNormalizer';
import { DispatchFunction } from '../dispatcher/Dispatcher';
import { ActionGenerator } from '../actions/ActionGenerator';
import { VRangeLocation, RelativePosition } from '../stores/VRange';
import { VDocumentMap } from './VDocumentMap';
import { VNode } from '../stores/VNode';
import { Format } from './Format';

interface TargetLocation {
    vNode: VNode;
    position: RelativePosition;
}
export interface EventManagerOptions {
    dispatch?: DispatchFunction;
}

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
    _convertRange(range: DomRangeChange): VRangeLocation {
        const start = this._getTargetLocation(range.startContainer, range.startOffset);
        const end = this._getTargetLocation(range.endContainer, range.endOffset);
        return {
            start: start.vNode,
            startPosition: start.position,
            end: end.vNode,
            endPosition: end.position,
            direction: range.direction,
        };
    }
    /**
     * Return a position in the `VDocument` as an object containing a reference
     * node (`ref`) and a position (`position`: 'BEFORE' or 'AFTER' the
     * reference VNode). The position is always given on the leaf.
     *
     * @param container
     * @param offset
     */
    _getTargetLocation(container: Node, offset: number): TargetLocation {
        // Move to deepest child of container
        while (container.hasChildNodes()) {
            container = container.childNodes[offset];
            offset = 0;
        }
        // Get the VNodes matching the container
        const containers = VDocumentMap.fromDom(container);
        // The reference is the offset-th match (eg.: text split into chars)
        const location: TargetLocation = {
            vNode: containers[offset],
            position: RelativePosition.BEFORE,
        };
        // At the end of a text node (eg.: 'text', offset 4 -> we target AFTER
        // the char at index 3 (containers[4] does not exist).
        if (container.nodeType === Node.TEXT_NODE && !location.vNode) {
            location.vNode = containers[containers.length - 1];
            location.position = RelativePosition.AFTER;
        }
        return location;
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
        const payload = customEvent.detail;
        let name = customEvent.type;
        switch (customEvent.type) {
            case 'setRange':
                payload.vRangeLocation = this._convertRange(payload['domRangeChange']);
                break;
            case 'keydown':
                if (
                    Format.tags.includes(payload.key.toUpperCase()) &&
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.metaKey &&
                    !payload.shiftKey
                ) {
                    name = 'applyFormat';
                    payload.format = Format.fromTag(payload.key.toUpperCase());
                }
        }
        return ActionGenerator.intent({
            name: name,
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
        this.options.dispatch(this._matchIntent(customEvent));
    }
}
