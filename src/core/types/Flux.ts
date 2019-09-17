export interface Signal {
    type: string; // ex.: 'keydown'
    params: object; // ex.: {ctrlKey: true}
    elements?: Set<HTMLElement>; // (?) see EventNormalizer
    origin: string;
}

export type ActionPayload = {};

export interface Action {
    name?: string;
    type: 'intent' | 'primitive' | 'composite';
    subActions?: Action[];
    payload?: ActionPayload;
    position?: Range;
    target?: DOMElement;
    origin: string;
}

export type ActionHandler = (action: Action) => void;

export interface PluginIntents {
    [key: string]: string;
}

export interface PluginActions {
    [key: string]: string;
}

export interface PluginCommands {
    [key: string]: ActionHandler;
}
