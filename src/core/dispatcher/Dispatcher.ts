import { Action } from '../actions/Action';

export class Dispatcher<Action> {
    dispatch (action: Action) {
        // TODO
    }

    isDispatching () {
        return false;
    }

    register (callback: (action: Action) => void) {
        return '';
    }

    unregister (id: string) {

    }

    waitFor (ids: string[]) {

    }
}
