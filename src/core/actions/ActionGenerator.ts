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
     * @param {ActionInit} actionInit
     * @returns {Intent}
     */
    static intent(actionInit: ActionInit): Intent {
        return this.make('intent', actionInit);
    }
    /**
     * Shorthand to generate an action of type 'primitive'.
     *
     * @param {ActionInit} actionInit
     * @returns {Primitive}
     */
    static primitive(actionInit: ActionInit): Primitive {
        return this.make('primitive', actionInit);
    }
    /**
     * Shorthand to generate an action of type 'command'.
     *
     * @param {ActionInit} actionInit
     * @returns {Command}
     */
    static command(actionInit: ActionInit): Command {
        return this.make('command', actionInit);
    }
    /**
     * Return a properly formatted Action.
     *
     * @param {ActionType} type
     * @param {ActionInit} actionInit
     * @returns {Intent|Primitive|Command}
     */
    static make<T extends Action>(type: ActionType, actionInit: ActionInit): T {
        return Object.assign(actionInit, {
            id: this._makeID(type, actionInit.name),
            type: type,
        }) as T;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    static _makeID(type, name): ActionIdentifier {
        return type + '.' + name;
    }
}
