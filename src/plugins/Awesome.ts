import { Action, ActionType } from '../core/actions/Action.js';
import { Dispatcher } from '../core/dispatcher/Dispatcher.js';
import { JWPlugin, JWPluginConfig } from '../core/JWPlugin.js';

interface AwesomeConfig extends JWPluginConfig {
    brol: boolean;
}

export class Awesome extends JWPlugin {
    constructor(dispatcher: Dispatcher, options?: AwesomeConfig) {
        super(dispatcher, options);
    }

    init(): Action {
        super.init();
        return {
            type: ActionType.INSERT,
            value: 42,
            origin: '',
        };
    }
}
