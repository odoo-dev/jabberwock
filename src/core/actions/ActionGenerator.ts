import { Dispatcher } from '../dispatcher/Dispatcher';

export class ActionGenerator {
    dispatcher: Dispatcher;
    constructor(dispatcher: Dispatcher) {
        this.dispatcher = dispatcher;
    }
    insert(value: DOMElement, position: Range): void {
        this.dispatcher.dispatch({
            name: 'insert',
            type: 'primitive',
            payload: {
                element: value,
            },
            position: position,
            origin: arguments.callee.caller.name,
        });
    }
    remove(target?: DOMElement): void {
        this.dispatcher.dispatch({
            name: 'remove',
            type: 'primitive',
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
    update(value: DOMElement, target?: DOMElement): void {
        this.dispatcher.dispatch({
            name: 'update',
            type: 'primitive',
            payload: {
                element: value,
            },
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
}
