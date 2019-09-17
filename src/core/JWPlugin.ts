import { Dispatcher } from './dispatcher/Dispatcher';
import { PluginActions, PluginCommands, PluginIntents } from './types/Flux';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    name: string;
    dispatcher: Dispatcher;
    intents: PluginIntents = {};
    actions: PluginActions = {};
    commands: PluginCommands = {};

    constructor(dispatcher: Dispatcher, options: JWPluginConfig = {}) {
        this.dispatcher = dispatcher;
        this.name = options.name;
    }

    init(): void {
        // TODO
    }
}
