import { EventNormalizer, DomRangeToSet } from './EventNormalizer';
import { DispatchFunction } from '../dispatcher/Dispatcher';
import { ActionGenerator } from '../actions/ActionGenerator';
import { TargetLocation, VRangeLocation, RelativePosition } from '../stores/VRange';
import { VDocumentMap } from './VDocumentMap';

export interface EventManagerOptions {
    dispatch?: DispatchFunction;
}

export class EventManager {
    editable: DOMElement;
    options: EventManagerOptions;
    eventNormalizer: EventNormalizer;

    constructor(editable: HTMLElement, options: EventManagerOptions = {}) {
        this.editable = editable as DOMElement;
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
    _convertRange(range: DomRangeToSet): VRangeLocation {
        return {
            start: this._getTargetLocation(range.startContainer, range.startOffset),
            end: this._getTargetLocation(range.endContainer, range.endOffset),
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
    _getTargetLocation(container: DOMElement | Node, offset: number): TargetLocation {
        // Move to deepest child of container
        while (container.hasChildNodes()) {
            container = container.childNodes[offset];
            offset = 0;
        }
        // Get the VNodes matching the container
        const containers = VDocumentMap.fromDom(container);
        // The reference is the offset-th match (eg.: text split into chars)
        const location: TargetLocation = {
            reference: containers[offset],
            relativePosition: RelativePosition.BEFORE,
        };
        // At the end of a text node (eg.: 'text', offset 4 -> we target AFTER
        // the char at index 3 (containers[4] does not exist).
        if (container.nodeType === Node.TEXT_NODE && !location.reference) {
            location.reference = containers[containers.length - 1];
            location.relativePosition = RelativePosition.AFTER;
        }
        return this._makeLocationDeepest(location);
    }
    /**
     * Move the position to its deepest first descendent.
     *
     * @param location
     */
    _makeLocationDeepest(location: TargetLocation): TargetLocation {
        while (location.reference.children.length) {
            location.reference = location.reference.firstChild;
            location.relativePosition = RelativePosition.BEFORE;
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
        let payload = customEvent.detail;
        switch (customEvent.type) {
            case 'setRange':
                payload = Object.assign({}, payload, {
                    vRangeToSet: this._convertRange(payload['domRangeToSet']),
                });
                break;
        }
        return ActionGenerator.intent({
            name: customEvent.type,
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
