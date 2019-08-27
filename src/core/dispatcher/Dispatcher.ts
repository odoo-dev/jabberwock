import { Action } from '../actions/Action';

export class Dispatcher<TPayload> {
    dispatch (action: Action) {
        // TODO
    }

    isDispatching () {
        return false;
    }

    register (callback: (payload: TPayload) => void) {
        return '';
    }

    unregister (id: string) {

    }

    waitFor (ids: string[]) {

    }
}
