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
    source?: string;
    subActions?: Action[];
    target?: Node;
    elements?: Set<HTMLElement>;
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
