import { Action, ActionType } from '../core/actions/Action';
import { JWPlugin, JWPluginConfiguration } from '../core/JWPlugin';
import { ActionBatch } from '../core/actions/ActionBatch';
import { Dispatcher } from '../core/dispatcher/Dispatcher';

interface AwesomeConfiguration extends JWPluginConfiguration {
    brol: boolean;
}

export class Awesome extends JWPlugin {
    constructor (dispatcher, options: AwesomeConfiguration) {
        super(dispatcher : Dispatcher, options);
        dispatcher.on({
            type: ActionType.INSERT,
        }, (previousChanges: ActionBatch) => {
            const action : ActionBatch = [
                {
                    type: 
                }
            ]
            return action;
        })
    }

    init (): Action {
        super.init();
        return {
            type: ActionType.INSERT,
            value: 42,
            position: 8,
            origin: {},
        };
    }
};
