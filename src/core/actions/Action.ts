export enum ActionType {
    INSERT,
    UPDATE,
    REMOVE,
}

export type ActionPayload = {};

export interface Action {
    type: ActionType;
    value?: ActionPayload;
    position?: Range;
    target?: DOMElement;
    origin: string;
}
