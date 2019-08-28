import { Action } from './actions/Action';
import { Dispatcher } from './dispatcher/Dispatcher';
import VDocument from './stores/VDocument'; // todo: use state

export interface JWPluginConfiguration {
    name: string;
}

export class JWPlugin {
    dispatcher: Dispatcher<Action>;
    vDocument: VDocument;

    constructor (dispatcher: Dispatcher<Action>, vDocument: VDocument, options?: JWPluginConfiguration) {
        this.dispatcher = dispatcher;
        this.vDocument = vDocument;
    }

    init(): void {
        // TODO
    }
}
