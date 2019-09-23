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
        // Get the handlers
        const preHandlers: Handlers = this._getHandlers('pre-' + action.id) || {};
        const handlers: Handlers = this._getHandlers(action.id);
        const postHandlers: Handlers = this._getHandlers('post-' + action.id) || {};

        // Call the pre handlers and the handlers
        let followUpActions: Action[] = this._callHandlers(preHandlers, action).concat(
            this._callHandlers(handlers, action),
        );

        if (
            !Object.keys(preHandlers).length &&
            !Object.keys(handlers).length &&
            !Object.keys(postHandlers).length
        ) {
            console.warn(`No plugin is listening to the ${action.type} "${action.name}".`);
        }

        // Dispatch sub actions
        action.subActions.forEach((subAction: Action): void => {
            this.dispatch(subAction);
        });

        // Call the post handlers (after sub actions)
        followUpActions = followUpActions.concat(this._callHandlers(postHandlers, action));

        // Dispatch actions resulting from all the dispatched actions
        followUpActions.forEach((followUpAction: Action): void => {
            this.dispatch(followUpAction);
        });
    }
    // Is this Dispatcher currently dispatching.
    isDispatching(): boolean {
        return false;
    }
    /**
     * Register all handlers declared in a plugin, and match them with their
     * corresponding command.
     *
     * @param {PluginHandlers} handlers
     * @param {Commands} commands
     */
    register(handlers: PluginHandlers, commands: Commands): void {
        Object.keys(handlers).forEach((handlerType: string): void => {
            Object.keys(handlers[handlerType]).forEach((actionName: string): void => {
                let type: string;
                switch (handlerType) {
                    case 'intents':
                        type = 'intent';
                        break;
                    case 'preCommands':
                        type = 'pre-command';
                        break;
                    case 'postCommands':
                        type = 'post-command';
                        break;
                }
                const id: ActionIdentifier = type + '.' + actionName;
                const commandIdentifier: CommandIdentifier = handlers[handlerType][actionName];
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

    _callHandlers(handlers: Handlers = {}, action: Action) {
        const followUpActions: Action[] = [];
        Object.keys(handlers).forEach((handlerToken: HandlerToken): void => {
            const handler: ActionHandler = handlers[handlerToken];
            const newAction: Action | void = handler(action);
            if (newAction) {
                followUpActions.push(newAction);
            }
        });
        return followUpActions;
    }
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
