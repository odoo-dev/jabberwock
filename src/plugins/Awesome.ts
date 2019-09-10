import { Action, ActionType } from '../core/actions/Action';
import { Dispatcher } from '../core/dispatcher/Dispatcher';
import { JWPlugin, JWPluginConfig } from '../core/JWPlugin';
import { VDocument } from '../core/stores/VDocument';

interface AwesomeConfig extends JWPluginConfig {
    brol: boolean;
}

export class Awesome extends JWPlugin {
    constructor(dispatcher: Dispatcher, vDocument: VDocument, options?: AwesomeConfig) {
        super(dispatcher, vDocument, options);
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
