export enum ActionType {
    INSERT,
    UPDATE,
    REMOVE,
};

export class Action {
    type: ActionType;
    value?: any;
    position?: any;
    target?: any;
    origin: object;

    constructor (action: ActionInterface) {
        this.type = action.type;
        this.value = action.value;
        this.position = action.position;
        this.target = action.target;
        this.origin = action.origin;
    }
}

export interface ActionInterface extends Action { };