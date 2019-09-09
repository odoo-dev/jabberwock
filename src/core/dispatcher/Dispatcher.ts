import { Action } from '../actions/Action';

export type HandlerToken = string;
export type ActionHandler = (action: Action) => void;

export class Dispatcher {
    handlers: Record<string, ActionHandler>;

    // Dispatches a payload to all registered callbacks.
    dispatch(action: Action): void {
        console.log(action);
    }

    // Is this Dispatcher currently dispatching.
    isDispatching(): boolean {
        return false;
    }

    // Registers a callback to be invoked with every dispatched payload.
    // Returns a token that can be used with waitFor().
    register(handler: ActionHandler): HandlerToken {
        const handlerId = 'generate_a_new_id';
        this.handlers[handlerId] = handler;
        return handlerId;
    }

    // Removes a callback based on its token.
    unregister(token: HandlerToken): void {
        delete this.handlers[token];
    }

    // Waits for the callbacks specified to be invoked before continuing
    // execution of the current callback. This method should only be used by a
    // callback in response to a dispatched payload.
    waitFor(tokens: HandlerToken[]): Promise<HandlerToken[]> {
        // TODO
        return Promise.resolve(tokens);
    }
}
