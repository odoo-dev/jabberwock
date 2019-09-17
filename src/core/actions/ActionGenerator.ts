import { Dispatcher } from '../dispatcher/Dispatcher';

export class ActionGenerator {
    dispatcher: Dispatcher;
    constructor(dispatcher: Dispatcher) {
        this.dispatcher = dispatcher;
    }
    insert(value: DOMElement, position: Range): void {
        this.dispatcher.dispatch({
            id: 'primitive.insert', // todo: automize
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
            id: 'primitive.remove', // todo: automize
            name: 'remove',
            type: 'primitive',
            target: target,
            origin: arguments.callee.caller.name,
        });
    }
    update(value: DOMElement, target?: DOMElement): void {
        this.dispatcher.dispatch({
            id: 'primitive.update', // todo: automize
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
