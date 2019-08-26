import ActionID from './ActionID';
import DispatcherModule from '../dispatcher/Dispatcher';

const Dispatcher = DispatcherModule();

export interface Action {
    type: number,
    value?: any,
    position?: any,
    target?: any,
    origin: object,
};

export default function Actions() {
    return {
        insert: (value: any, position: any, origin: object): void => {
            Dispatcher.dispatch({
                type: ActionID.INSERT,
                value: value,
                position: position,
                origin: origin,
            });
        },
        remove: (origin: object, target?: any): void => {
            Dispatcher.dispatch({
                type: ActionID.REMOVE,
                target: target,
                origin: origin,
            });
        },
        update: (value: any, origin: object, target?: any): void => {
            Dispatcher.dispatch({
                type: ActionID.UPDATE,
                value: value,
                target: target,
                origin: origin,
            });
        }
    }
}
