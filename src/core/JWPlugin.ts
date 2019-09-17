import { Dispatcher } from './dispatcher/Dispatcher';

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
        this.name = options.name;
    }

    init(): void {
        // TODO
    }
}
