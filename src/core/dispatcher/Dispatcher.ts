export type HandlerToken = string;
export type Handlers = Record<HandlerToken, ActionHandler>;
export type DispatcherRegistry = Record<ActionIdentifier, Handlers>;
export type DispatchFunction = (action: Action) => void;

export class Dispatcher {
    __nextHandlerTokenID = 0;
    el: Element;
    registry: DispatcherRegistry = {};

    constructor(el: Element) {
        this.el = el;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Dispatches a payload to all registered callbacks.
     *
     * @param {Action} action
     */
    dispatch(action: Action): void {
        const handlers: Handlers = this._getHandlers(action.id);
        Object.keys(handlers).forEach((handlerToken: HandlerToken): void => {
            handlers[handlerToken](action); // TODO: use return value to retrigger
        });
        if (!Object.keys(handlers).length) {
            console.warn(`No plugin is listening to the ${action.type} "${action.name}".`);
        }
    }
    // Is this Dispatcher currently dispatching.
    isDispatching(): boolean {
        return false;
    }
    /**
     * Register all handlers declared in a plugin, and match them with their
     * corresponding command.
     *
     * @param {PluginIntents} intents
     * @param {PluginActions} actions
     * @param {Commands} commands
     */
    register(handlers: PluginHandlers, commands: Commands): void {
        Object.keys(handlers).forEach((handlerType: string): void => {
            Object.keys(handlers[handlerType]).forEach((actionName: string): void => {
                const type = 'intent'; // todo: use handlerType (right now only one)
                const id: ActionIdentifier = type + '.' + actionName;
                const commandIdentifier: CommandIdentifier = handlers.intents[actionName];
                const command = commands[commandIdentifier];
                if (command) {
                    this._register(id, command);
                } else {
                    const info = id.split('.');
                    console.warn(
                        `Cannot register ${info[0]} "${info[1]}" with the ` +
                            `command "${commandIdentifier}": that command ` +
                            `does not exist or was not registered.`,
                    );
                }
            });
        });
    }
    // Removes a callback based on its token.
    unregister(token: HandlerToken): void {
        // TODO
        token;
        // delete this.handlers[token];
    }
    // Waits for the callbacks specified to be invoked before continuing
    // execution of the current callback. This method should only be used by a
    // callback in response to a dispatched payload.
    waitFor(tokens: HandlerToken[]): Promise<HandlerToken[]> {
        // TODO
        return Promise.resolve(tokens);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the `ActionHandler` corresponding to the given `handlerToken` in
     * the registry.
     *
     * @param {HandlerToken} handlerToken
     * @returns {ActionHandler}
     */
    _getHandler(handlerToken: HandlerToken): ActionHandler {
        const recordID: ActionIdentifier = Object.keys(this.registry).find(
            (id: ActionIdentifier): boolean => {
                const handlers = this.registry[id];
                return !!handlers[handlerToken];
            },
        );
        return this.registry[recordID][handlerToken];
    }
    /**
     * Return a copy of an action's `Handlers`. Also looks into '*' records for
     * the given action type, unless `onlyIncludeSpecific` is true.
     * '*' is a magic key used to listen to action of a given type.
     *
     * @param {ActionIdentifier} actionIdentifier
     * @param {boolean} [onlyIncludeSpecific] if true, do not include '*' records
     * @returns {Handlers}
     */
    _getHandlers(actionIdentifier: ActionIdentifier, onlyIncludeSpecific = false): Handlers {
        const record = Object.assign({}, this.registry[actionIdentifier]) || {};
        if (!onlyIncludeSpecific) {
            const type = actionIdentifier.split('.')[0];
            const allRecord = this.registry[type + '.' + '*'] || {};
            Object.keys(allRecord).forEach((key: HandlerToken): void => {
                record[key] = allRecord[key];
            });
        }
        return record;
    }
    /**
     * Generate and return a new unique identifier for a handler.
     *
     * @returns {HandlerToken}
     */
    _getNextHandlerToken(): string {
        const handlerToken = '' + this.__nextHandlerTokenID;
        this.__nextHandlerTokenID++;
        return handlerToken;
    }

    /**
     * Registers a callback to be invoked with every dispatched payload.
     * Returns a token that can be used with waitFor().
     *
     * @param {ActionIdentifier} id
     * @param {ActionHandler} handler
     * @returns {HandlerToken} the unique ID of the new handler
     */
    _register(id: ActionIdentifier, handler: ActionHandler): HandlerToken {
        const handlerToken = this._getNextHandlerToken();
        let record: Handlers = this.registry[id];
        if (!record) {
            record = this.registry[id] = {};
        }
        record[handlerToken] = handler;
        return handlerToken;
    }
}
