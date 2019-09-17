// `ActionIdentifier` format is `${action.type}.${action.name}`
type ActionIdentifier = string;
type ActionType = 'intent' | 'primitive' | 'command';
type ActionPayload = {};

interface Action {
    readonly id: ActionIdentifier;
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
    // hooks?: Record<CommandIdentifier, CommandIdentifier>;
}
type PluginCommands = Record<CommandIdentifier, ActionHandler>;
