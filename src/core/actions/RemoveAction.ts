import { ActionType } from './Action';
import { Action } from './Action';

export class RemoveAction extends Action {
    constructor (origin: object, target?: any) {
        super({
            type: ActionType.REMOVE,
            target: target,
            origin: origin,
        });
    }
};