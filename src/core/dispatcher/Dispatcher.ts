import { Action, ActionHandler, PluginIntents, PluginActions, PluginCommands } from '../types/Flux';

export type HandlerToken = string;

export interface DispatcherRegistryRecord {
    type: string;
    name: string;
    handlers: Record<HandlerToken, ActionHandler>;
}

export class Dispatcher {
    __id = 0;
    el: Element;
    registry: DispatcherRegistryRecord[] = [];

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
        const followUpActions: Action[] = [];
        // TODO: manage the 3 types of action (intent/primitive/composite instead of intent/action)
        const type =
            action.type === 'composite' || action.type === 'primitive' ? 'action' : 'intent';
        const records: DispatcherRegistryRecord[] = [this._getRecord(type, action.name)]
            .concat(this._getRecord(type, '*')) // magic key '*' to listen to everything
            .filter((item: DispatcherRegistryRecord): boolean => !!item); // remove undefined items
        records.forEach((record: DispatcherRegistryRecord): void => {
            Object.keys(record.handlers).forEach((handlerToken: HandlerToken): void => {
                const handler: ActionHandler = record.handlers[handlerToken];
                const newAction: Action | void = handler(action);
                if (newAction) {
                    followUpActions.push(newAction);
                }
            });
        });
        if (!records.length) {
            console.warn('No plugin is listening to the ' + type + ' "' + action.name + '".');
        }
        followUpActions.forEach((followUpAction: Action): void => {
            this.dispatch(followUpAction);
        });
    }

    // Is this Dispatcher currently dispatching.
    isDispatching(): boolean {
        return false;
    }

    /**
     * Registers a callback to be invoked with every dispatched payload.
     * Returns a token that can be used with waitFor().
     *
     * @param {'intent'|'action'} type
     * @param {string} name
     * @param {ActionHandler} handler
     * @returns {HandlerToken} the unique ID of the new handler
     */
    register(type: 'intent' | 'action', name: string, handler: ActionHandler): HandlerToken {
        const handlerToken = this._getHandlerToken();
        let record = this._getRecord(type, name);
        if (!record) {
            record = {
                type: type,
                name: name,
                handlers: {},
            };
            this.registry.push(record);
        }
        record.handlers[handlerToken] = handler;
        return handlerToken;
    }

    /**
     * Register all actions, intents and commands declared in a plugin.
     *
     * @param {PluginActions} actions
     * @param {PluginIntents} intents
     * @param {PluginCommands} commands
     */
    registerFromPlugin(
        actions: PluginActions,
        intents: PluginIntents,
        commands: PluginCommands,
    ): void {
        Object.keys(actions).forEach((name: string): void => {
            this._registerOneFromPlugin('action', name, actions[name], commands);
        });
        Object.keys(intents).forEach((name: string): void => {
            this._registerOneFromPlugin('intent', name, intents[name], commands);
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
        const record = this.registry.find((record: DispatcherRegistryRecord) => {
            return !!record.handlers[handlerToken];
        });
        return record && record.handlers[handlerToken];
    }
    /**
     * Find a `DispatcherRegistryRecord` by type and name.
     *
     * @param {'intent'|'action'} type
     * @param {string} name
     * @returns {DispatcherRegistryRecord}
     */
    _getRecord(type: 'intent' | 'action', name: string): DispatcherRegistryRecord {
        const record = this.registry.find((record: DispatcherRegistryRecord): boolean => {
            return record.type === type && record.name === name;
        });
        return record;
    }
    /**
     * TODO: this is only a stub for ID generation
     */
    _getHandlerToken(): string {
        const handlerToken = '' + this.__id;
        this.__id++;
        return handlerToken;
    }
    /**
     * Register one intent or action from a plugin.
     *
     * @param {'intent'|'action'} type
     * @param {string} name
     * @param {string} commandName
     * @param {PluginCommands} commands the plugin's registered commands
     */
    _registerOneFromPlugin(
        type: 'intent' | 'action',
        name: string,
        commandName: string,
        commands: PluginCommands,
    ): void {
        const command = commands[commandName];
        if (command) {
            this.register(type, name, command);
        } else {
            console.warn(
                'Cannot register ' +
                    type +
                    ' "' +
                    name +
                    '" with the command "' +
                    commandName +
                    '": that command does not exist or was not registered.',
            );
        }
    }
}
