import { ActionType } from './Action';
import { Action } from './Action';

export class InsertAction extends Action {
    constructor (value: any, origin: object, target?: any) {
        super({
            type: ActionType.UPDATE,
            value: value,
            target: target,
            origin: origin,
        });
    }
};