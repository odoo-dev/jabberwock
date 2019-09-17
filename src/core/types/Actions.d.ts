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

type ActionHandler = (action: Action) => void;
type CommandIdentifier = string;
interface PluginHandlers {
    intents?: Record<string, CommandIdentifier>;
    // TODO:
    // preCommands?: Record<CommandIdentifier, CommandIdentifier>;
    // postCommands?: Record<CommandIdentifier, CommandIdentifier>;
}
type Commands = Record<CommandIdentifier, ActionHandler>;
