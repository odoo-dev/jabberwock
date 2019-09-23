import { Dispatcher } from './dispatcher/Dispatcher';
import {
    PluginActions,
    PluginCommands,
    PluginIntents,
    Action,
    ActionPayload,
    ActionType,
} from './types/Flux';
import { ActionGenerator } from './actions/ActionGenerator';
import { VRange } from './stores/VRange';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    name: string;
    dispatcher: Dispatcher;
    intents: PluginIntents = {};
    actions: PluginActions = {};
    commands: PluginCommands = {};

    constructor(dispatcher: Dispatcher, options: JWPluginConfig = {}) {
        this.dispatcher = dispatcher;
        // by default the name is that of its constructor (eg.: 'JWPlugin')
        // todo: namespace
        this.name = options.name || this.constructor.name;
    }

    init(): void {
        // TODO
    }

    /**
     * Shorthand to generate an action of type `type`.
     *
     * @param {ActionType} type
     * @param {string} name
     * @param {ActionPayload} [payload]
     * @param {VRange} [position]
     * @returns {Action}
     */
    action(type: ActionType, name: string, payload?: ActionPayload, position?: VRange): Action {
        return ActionGenerator.make(type, name, this.name, payload, position);
    }
    /**
     * Shorthad to generate an action of type 'intent'.
     *
     * @param {string} name
     * @param {ActionPayload} [payload]
     * @param {VRange} [position]
     * @returns {Action}
     */
    intent(name: string, payload?: ActionPayload, position?: VRange): Action {
        return ActionGenerator.make('intent', name, this.name, payload, position);
    }
}
