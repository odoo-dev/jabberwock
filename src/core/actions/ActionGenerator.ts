import { Dispatcher } from '../dispatcher/Dispatcher';

export class ActionGenerator {
    dispatcher: Dispatcher;
    constructor(dispatcher: Dispatcher) {
        this.dispatcher = dispatcher;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Shorthand to generate an action of type 'intent'.
     *
     * @param {ActionType} type
     * @param {string} name
     * @param {string} origin
     * @param {ActionPayload} [payload]
     * @param {Range} [position]
     * @returns {Intent}
     */
    static intent(name: string, origin: string, payload?: ActionPayload, position?: Range): Intent {
        return this.make('intent', name, origin, payload, position) as Intent;
    }
    /**
     * Shorthand to generate an action of type 'primitive'.
     *
     * @param {ActionType} type
     * @param {string} name
     * @param {string} origin
     * @param {ActionPayload} [payload]
     * @param {Range} [position]
     * @returns {Primitive}
     */
    static primitive(
        name: string,
        origin: string,
        payload?: ActionPayload,
        position?: Range,
    ): Primitive {
        return this.make('primitive', name, origin, payload, position) as Primitive;
    }
    /**
     * Shorthand to generate an action of type 'command'.
     *
     * @param {ActionType} type
     * @param {string} name
     * @param {string} origin
     * @param {ActionPayload} [payload]
     * @param {Range} [position]
     * @returns {Command}
     */
    static command(
        name: string,
        origin: string,
        payload?: ActionPayload,
        position?: Range,
    ): Command {
        return this.make('command', name, origin, payload, position) as Command;
    }
    /**
     * Return a properly formatted Action.
     *
     * @param {ActionType} type
     * @param {string} name
     * @param {string} origin
     * @param {ActionPayload} [payload]
     * @param {Range} [position]
     * @returns {Intent|Primitive|Command}
     */
    static make(
        type: ActionType,
        name: string,
        origin: string,
        payload?: ActionPayload,
        position?: Range,
    ): Action {
        const action: Action = {
            id: this._makeID(type, name),
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

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    static _makeID(type, name): ActionIdentifier {
        return type + '.' + name;
    }
}
