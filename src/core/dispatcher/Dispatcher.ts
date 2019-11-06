import JWEditor from '../JWEditor';
import { PluginHandlers, PluginCommands } from '../JWPlugin';

export type ActionHandler = (action: Action) => void;
export type CommandIdentifier = string;
export type HandlerToken = string;
export type Handlers = Record<HandlerToken, ActionHandler>;
export type DispatcherRegistry = Record<ActionIdentifier, Handlers>;
export type DispatchFunction = (action: Action) => void;

const unhandledActions = ['render', 'keyboard', 'pointer', 'composition'];
export class Dispatcher {
    __nextHandlerTokenID = 0;
    editor: JWEditor;
    el: Element;
    handlers: Handlers = {};
    registry: DispatcherRegistry = {};

    constructor(editor: JWEditor) {
        this.editor = editor;
        this.el = editor.el;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Dispatches a payload to all registered callbacks. Return the callbacks
     * that were called.
     *
     * @param action
     * @returns return the callbacks that were called to handle the action
     */
    dispatch(action: Action): ActionHandler[] {
        // Fetch proper handlers.
        const properHandlers: Handlers = this.registry[action.id];

        // Fetch wildcard handlers.
        const wildcardActionIdentifier = action.id.split('.')[0] + '.*';
        const wildcardHandlers = this.registry[wildcardActionIdentifier];

        // Actually trigger the handlers.
        const handlers = Object.assign({}, properHandlers, wildcardHandlers);
        Object.keys(handlers).forEach((handlerToken: HandlerToken): void => {
            handlers[handlerToken](action); // TODO: use return value to retrigger
        });

        if (!properHandlers && !unhandledActions.includes(action.name)) {
            console.warn(`No plugin is listening to the ${action.type} "${action.name}".`);
        }
        return Object.values(handlers);
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
     * @param {PluginCommands} commands
     */
    register(handlers: PluginHandlers, commands: PluginCommands): void {
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
        return this.handlers[handlerToken];
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
        let handlers: Handlers = this.registry[id];
        if (!handlers) {
            handlers = this.registry[id] = {};
        }
        handlers[handlerToken] = handler;
        this.handlers[handlerToken] = handler;
        return handlerToken;
    }
}
