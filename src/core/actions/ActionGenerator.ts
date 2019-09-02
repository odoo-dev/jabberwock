import { Dispatcher } from '../dispatcher/Dispatcher.js';
import { Action, ActionType } from './Action.js';

export class ActionGenerator {
    dispatcher: Dispatcher<Action>;
    constructor(dispatcher: Dispatcher<Action>) {
        this.dispatcher = dispatcher;
    }
    insert(value: any, position: any): void {
        this.dispatcher.dispatch({
            type: ActionType.INSERT,
            value: value,
            position: position,
            origin: arguments.callee.caller.name,
        });
    }
    remove(target?: any): void {
        this.dispatcher.dispatch({
            type: ActionType.REMOVE,
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
    update(value: any, target?: any): void {
        this.dispatcher.dispatch({
            type: ActionType.UPDATE,
            value: value,
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
}
