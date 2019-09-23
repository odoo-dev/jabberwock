import { Dispatcher } from '../dispatcher/Dispatcher';
import { ActionType, ActionPayload, Action } from '../types/Flux';
import { VRange } from '../stores/VRange';

export class ActionGenerator {
    dispatcher: Dispatcher;
    constructor(dispatcher: Dispatcher) {
        this.dispatcher = dispatcher;
    }
    /**
     * Return a properly formatted Action.
     *
     * @param {ActionType} type
     * @param {string} name
     * @param {string} origin
     * @param {ActionPayload} [payload]
     * @param {VRange} [position]
     * @returns {Action}
     */
    static make(
        type: ActionType,
        name: string,
        origin: string,
        payload?: ActionPayload,
        position?: VRange,
    ): Action {
        const action: Action = {
            type: type,
            name: name,
            origin: origin,
        };
        if (payload) {
            action.payload = payload;
        }
        if (position) {
            action.position = position;
        }
        return action;
    }
}
