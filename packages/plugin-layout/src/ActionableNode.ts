import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { CommandParams } from '../../core/src/Dispatcher';
import JWEditor from '../../core/src/JWEditor';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

interface ActionableNodeParams extends AbstractNodeParams {
    name: string;
    label: string;
    commandId?: string;
    commandArgs?: CommandParams;
    selected?: (editor: JWEditor) => boolean;
    enabled?: (editor: JWEditor) => boolean;
}

export class ActionableNode extends AtomicNode {
    actionName: string;
    label: string;
    commandId?: string;
    commandArgs?: CommandParams;

    constructor(params: ActionableNodeParams) {
        super(params);
        this.actionName = params.name;
        this.label = params.label;
        this.commandId = params.commandId;
        this.commandArgs = params.commandArgs;
        if (params.selected) {
            this.selected = params.selected;
        }
        if (params.enabled) {
            this.enabled = params.enabled;
        }
    }

    get name(): string {
        return super.name + ': ' + this.actionName;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selected(editor: JWEditor): boolean {
        return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enabled(editor: JWEditor): boolean {
        return true;
    }
}
