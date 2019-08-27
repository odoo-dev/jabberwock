import { Action } from './actions/Action';
import { Dispatcher } from './dispatcher/Dispatcher';

export interface JWPluginConfiguration {
    name: string,
};

export class JWPlugin {
    dispatcher: Dispatcher<Action>;

    constructor (dispatcher: Dispatcher<Action>, options?: JWPluginConfiguration) {
        this.dispatcher = dispatcher;
    }

    init () {
        // TODO
    }
};
