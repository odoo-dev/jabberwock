import { Action } from '../core/actions/Action';
import { InsertAction } from '../core/actions/InsertAction';
import { Dispatcher } from '../core/dispatcher/Dispatcher';
import { JWPlugin, JWPluginConfiguration } from '../core/JWPlugin';

interface AwesomeConfiguration extends JWPluginConfiguration {
    brol: boolean;
}

export class Awesome extends JWPlugin {
    constructor (dispatcher: Dispatcher<Action>, options: AwesomeConfiguration) {
        super(dispatcher, options);
    }

    init () {
        super.init();
        return new InsertAction(null, null, {});
    }
};
