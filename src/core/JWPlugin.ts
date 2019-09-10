import { Dispatcher } from './dispatcher/Dispatcher';
import { VDocument } from './stores/VDocument'; // todo: use state

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    name: string;
    dispatcher: Dispatcher;
    vDocument: VDocument;

    constructor(dispatcher: Dispatcher, vDocument: VDocument, options: JWPluginConfig = {}) {
        this.dispatcher = dispatcher;
        this.vDocument = vDocument;
        this.name = options.name;
    }

    init(): void {
        // TODO
    }
}
