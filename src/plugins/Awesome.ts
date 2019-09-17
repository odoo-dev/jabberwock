import { Action } from '../core/types/Flux';
import { Dispatcher } from '../core/dispatcher/Dispatcher';
import { JWPlugin, JWPluginConfig } from '../core/JWPlugin';
import { VDocument } from '../core/stores/VDocument';

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
            type: 'primitive',
            name: 'insert',
            payload: {
                value: 42,
            },
            origin: '',
        };
    }
}
