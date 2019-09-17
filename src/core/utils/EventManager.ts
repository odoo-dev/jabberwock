import { EventNormalizer } from './EventNormalizer';
import { DispatchFunction } from '../dispatcher/Dispatcher';

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
     * Induce the user's intention from the received signal, based on the user's
     * configuration and context.
     * TODO: this is just a stub
     *
     * @param {CustomEvent} customEvent
     * @returns {Action}
     */
    _matchIntent(customEvent: CustomEvent): Action {
        switch (customEvent.type) {
            case 'remove':
            // todo: return a 'remove' action of type 'intent', with the right payload
        }
        return {
            id: 'intent.' + customEvent.type, // todo: automize
            type: 'intent',
            name: customEvent.type,
            payload: customEvent.detail,
            origin: customEvent.detail['origin'],
        };
    }
    /**
     * Take a signal, induce the user's intention from it, and dispatch that.
     *
     * @param {CustomEvent} customEvent
     */
    _triggerEvent(customEvent: CustomEvent): void {
        this.options.dispatch(this._matchIntent(customEvent));
    }
}
