import { Dispatcher, CommandIdentifier, ActionHandler } from './dispatcher/Dispatcher';
import { ActionGenerator } from './actions/ActionGenerator';
import { ActionInit, Intent, Command, Primitive } from './types/Actions';

// Plugins define the intents that are handled by one of their commands.
export interface PluginHandlers {
    intents?: Record<string, CommandIdentifier>;
}
// Plugins define the commands they implement.
export type PluginCommands = Record<CommandIdentifier, ActionHandler>;

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    name: string;
    dispatcher: Dispatcher;
    handlers: PluginHandlers = {
        intents: {},
        // TODO:
        // preCommands: {},
        // postCommands: {},
    };
    commands: PluginCommands = {};

    constructor(dispatcher: Dispatcher, options: JWPluginConfig = {}) {
        this.dispatcher = dispatcher;
        // by default the name is that of its constructor (eg.: 'JWPlugin')
        // todo: namespace
        this.name = options.name || this.constructor.name;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Shorthand to generate an action of type 'intent'.
     *
     * @param {actionInit} ActionInit
     * @returns {Intent}
     */
    intent(actionInit: ActionInit): Intent {
        actionInit.origin = this.name;
        return ActionGenerator.intent(actionInit);
    }
    /**
     * Shorthand to generate an action of type 'primitive'.
     *
     * @param {actionInit} ActionInit
     * @returns {Primitive}
     */
    primitive(actionInit: ActionInit): Primitive {
        actionInit.origin = this.name;
        return ActionGenerator.primitive(actionInit);
    }
    /**
     * Shorthand to generate an action of type 'command'.
     *
     * @param {actionInit} ActionInit
     * @returns {Command}
     */
    command(actionInit: ActionInit): Command {
        actionInit.origin = this.name;
        return ActionGenerator.command(actionInit);
    }
}
