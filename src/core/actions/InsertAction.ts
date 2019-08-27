import { ActionType } from './Action';
import { Action } from './Action';

export class InsertAction extends Action {
    constructor (value: any, position: any, origin: object) {
        super({
            type: ActionType.INSERT,
            value: value,
            position: position,
            origin: origin,
        })
    }
};