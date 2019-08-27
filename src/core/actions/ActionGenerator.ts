import { ActionType } from './Action'

const Dispatcher = JWEditor.Dispatcher;

export default class ActionGenerator {
    insert (value: any, position: any): void {
        Dispatcher.dispatch({
            type: ActionType.INSERT,
            value: value,
            position: position,
            origin: arguments.callee.caller.name,
        });
    }
    remove (target?: any): void {
        Dispatcher.dispatch({
            type: ActionType.REMOVE,
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
    update (value: any, target?: any): void {
        Dispatcher.dispatch({
            type: ActionType.UPDATE,
            value: value,
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
}
