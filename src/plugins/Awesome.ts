import { Action, ActionType } from '../core/actions/Action.js';
import VDocument from '../core/stores/VDocument.js';
import { Dispatcher } from '../core/dispatcher/Dispatcher.js';
import { JWPlugin, JWPluginConfiguration } from '../core/JWPlugin.js';

interface AwesomeConfiguration extends JWPluginConfiguration {
    brol: boolean;
}

export class Awesome extends JWPlugin {
    constructor(dispatcher: Dispatcher<Action>, vDocument: VDocument, options?: AwesomeConfiguration) {
        super(dispatcher, vDocument, options);
    }

    init (): Action {
        super.init();
        return {
            type: ActionType.INSERT,
            value: 42,
            position: 8,
            origin: '',
        };
    }
};
