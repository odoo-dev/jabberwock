import { Action } from '../actions/Action';

export class Dispatcher {
    registry : [(action: Action) => Batch];

    constructor() {
        this.registry = [];
    }
    dispatch (plugin, action: Action) {
        // TODO
        //...
        // plugins.forEach((plugin)=>{
        //     plugin.
        // });
        // const newState = plugins
        // this.commitState(newState)

        // search all event for `{event -> action} => callback`
    }

    isDispatching () {
        return false;
    }

    register (callback: (action: Action) => Batch) {
        return '';
    }

    unregister (id: string) {

    }

    waitFor (ids: string[]) {

    }
}
