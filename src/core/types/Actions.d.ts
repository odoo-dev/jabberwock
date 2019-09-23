type ActionIdentifier = string; // = type.name
type ActionType = 'intent' | 'primitive' | 'command';
type ActionPayload = {};

interface Action {
    readonly id: ActionIdentifier; // = type.name
    name?: string;
    type: ActionType;
    subActions?: Action[];
    payload?: ActionPayload;
    position?: Range;
    target?: DOMElement;
    origin: string;
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
    // preCommands?: Record<CommandIdentifier, CommandIdentifier>;
    // postCommands?: Record<CommandIdentifier, CommandIdentifier>;
}
type Commands = Record<CommandIdentifier, ActionHandler>;
