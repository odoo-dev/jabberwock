import { Action } from './actions/Action.js';
import { Dispatcher } from './dispatcher/Dispatcher.js';

export interface JWPluginConfiguration {
    name: string;
}

export class JWPlugin {
    dispatcher: Dispatcher<Action>;

    constructor (dispatcher: Dispatcher<Action>, options?: JWPluginConfiguration) {
        this.dispatcher = dispatcher;
    }

    init() {
        // TODO
    }
}
