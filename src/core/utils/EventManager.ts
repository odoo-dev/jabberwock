import { EventNormalizer } from './EventNormalizer';
import { DispatchFunction } from '../dispatcher/Dispatcher';
import { ActionGenerator } from '../actions/ActionGenerator';

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
     * Match the received signal with the corresponding user intention, based on
     * the user's configuration and context.
     * TODO: this is just a stub
     *
     * @param {CustomEvent} customEvent
     * @returns {Action}
     */
    _matchIntent(customEvent: CustomEvent): Intent {
        switch (customEvent.type) {
            case 'remove':
            // todo: return a 'remove' action of type 'intent', with the right payload
        }
        return ActionGenerator.intent({
            name: customEvent.type,
            origin: 'EventManager',
            payload: customEvent.detail,
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
