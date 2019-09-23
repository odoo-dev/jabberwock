import { VRange } from '../stores/VRange';

export interface Signal {
    type: string; // ex.: 'keydown'
    params: object; // ex.: {ctrlKey: true}
    elements?: Set<HTMLElement>; // (?) see EventNormalizer
    origin: string;
}

export type ActionType = 'intent' | 'primitive' | 'composite';
export type ActionPayload = {};

export interface Action {
    name: string;
    type: ActionType;
    subActions?: Action[];
    payload?: ActionPayload;
    position?: VRange;
    target?: DOMElement;
    origin: string;
}

export type ActionHandler = (action?: Action, intent?: Action) => Action | void;

export interface PluginIntents {
    [key: string]: string;
}

export interface PluginActions {
    [key: string]: string;
}

export interface PluginCommands {
    [key: string]: ActionHandler;
}
