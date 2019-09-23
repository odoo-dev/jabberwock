import { EventNormalizer } from './EventNormalizer';
import { Signal, Action } from '../types/Flux';
import { ActionGenerator } from '../actions/ActionGenerator';

export interface EventManagerOptions {
    dispatch?: (action: Action) => void;
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
     * @param {Signal} signal
     * @returns {Action}
     */
    _induceIntent(signal: Signal): Action {
        switch (signal.type) {
            case 'remove':
            // return a 'remove' action of type 'intent', with the right payload
        }
        return ActionGenerator.make('intent', signal.type, 'EventManager', signal.params);
    }
    /**
     * Take a signal, induce the user's intention from it, and dispatch that.
     *
     * @param {Signal} signal
     */
    _triggerEvent(signal: Signal): void {
        this.options.dispatch(this._induceIntent(signal));
    }
}
