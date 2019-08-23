import { ActionType } from './Action.js';
import { Dispatcher } from '../dispatcher/Dispatcher.js';
import { DOMElement } from '../types/DOMElement.js';

export class ActionGenerator {
    dispatcher: Dispatcher;
    constructor(dispatcher: Dispatcher) {
        this.dispatcher = dispatcher;
    }
    insert(value: DOMElement, position: Range): void {
        this.dispatcher.dispatch({
            type: ActionType.INSERT,
            value: value,
            position: position,
            origin: arguments.callee.caller.name,
        });
    }
    remove(target?: DOMElement): void {
        this.dispatcher.dispatch({
            type: ActionType.REMOVE,
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
    update(value: DOMElement, target?: DOMElement): void {
        this.dispatcher.dispatch({
            type: ActionType.UPDATE,
            value: value,
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
}
