// `ActionIdentifier` format is `${action.type}.${action.name}`
type ActionIdentifier = string;
type ActionType = 'intent' | 'primitive' | 'command';
type ActionPayload = {};

interface ActionInit {
    name: string;
    origin?: string;
    payload?: ActionPayload;
    position?: Range;
}

interface Action extends ActionInit {
    readonly id: ActionIdentifier;
    type: ActionType;
    origin: string;
    subActions?: Action[];
    target?: Node;
}
interface Intent extends Action {
    type: 'intent';
}
interface Primitive extends Action {
    type: 'primitive';
}
interface Command extends Action {
    type: 'command';
}

type ActionHandler = (action: Action) => void;
type CommandIdentifier = string;
interface PluginHandlers {
    intents?: Record<string, CommandIdentifier>;
    // TODO:
    // hooks?: Record<CommandIdentifier, CommandIdentifier>;
}
type PluginCommands = Record<CommandIdentifier, ActionHandler>;
