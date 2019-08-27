export enum ActionType {
    INSERT,
    UPDATE,
    REMOVE,
};

export interface Action {
    type: ActionType;
    value?: any;
    position?: any;
    target?: any;
    origin: string;
}
