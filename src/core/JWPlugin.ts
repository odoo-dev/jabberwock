import { Action } from './actions/Action.js';
import { Dispatcher } from './dispatcher/Dispatcher.js';
import VDocument from './stores/VDocument.js'; // todo: use state

export interface JWPluginConfiguration {
    name: string;
}

export class JWPlugin {
    dispatcher: Dispatcher<Action>;
    vDocument: VDocument;
    options: JWPluginConfiguration;

    constructor(dispatcher: Dispatcher<Action>, vDocument: VDocument, options?: JWPluginConfiguration) {
        this.dispatcher = dispatcher;
        this.vDocument = vDocument;
        this.options = options;
    }

    init(): void {
        // TODO
    }
}
