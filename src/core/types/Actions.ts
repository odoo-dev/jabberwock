// `ActionIdentifier` format is `${action.type}.${action.name}`
export type ActionIdentifier = string;
export type ActionType = 'intent' | 'primitive' | 'command';
export type ActionPayload = {};

export interface ActionInit {
    name: string;
    origin?: string;
    payload?: ActionPayload;
    position?: Range;
}

export interface Action extends ActionInit {
    readonly id: ActionIdentifier;
    type: ActionType;
    origin: string;
    subActions?: Action[];
    target?: Node;
}
export interface Intent extends Action {
    type: 'intent';
}
export interface Primitive extends Action {
    type: 'primitive';
}
export interface Command extends Action {
    type: 'command';
}

export type ActionHandler = (action: Action) => void;
export type CommandIdentifier = string;
export interface PluginHandlers {
    intents?: Record<string, CommandIdentifier>;
    // TODO:
    // hooks?: Record<CommandIdentifier, CommandIdentifier>;
}
export type PluginCommands = Record<CommandIdentifier, ActionHandler>;
