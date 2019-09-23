import { Dispatcher } from './dispatcher/Dispatcher';
import { ActionGenerator } from './actions/ActionGenerator';

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
    commands: Commands = {};

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
     * @param {string} name
     * @param {ActionPayload} [payload]
     * @param {Range} [position]
     * @returns {Intent}
     */
    intent(name: string, payload?: ActionPayload, position?: Range): Intent {
        return ActionGenerator.intent(name, this.name, payload, position);
    }
    /**
     * Shorthand to generate an action of type 'primitive'.
     *
     * @param {string} name
     * @param {ActionPayload} [payload]
     * @param {Range} [position]
     * @returns {Primitive}
     */
    primitive(name: string, payload?: ActionPayload, position?: Range): Primitive {
        return ActionGenerator.primitive(name, this.name, payload, position);
    }
    /**
     * Shorthand to generate an action of type 'command'.
     *
     * @param {string} name
     * @param {ActionPayload} [payload]
     * @param {Range} [position]
     * @returns {Command}
     */
    command(name: string, payload?: ActionPayload, position?: Range): Command {
        return ActionGenerator.command(name, this.name, payload, position);
    }
}
