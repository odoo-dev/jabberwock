import { Dispatcher } from './dispatcher/Dispatcher.js';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    name: string;
    dispatcher: Dispatcher;

    constructor(dispatcher: Dispatcher, options: JWPluginConfig = {}) {
        this.dispatcher = dispatcher;
        this.name = options.name;
    }

    init(): void {
        // TODO
    }
}
