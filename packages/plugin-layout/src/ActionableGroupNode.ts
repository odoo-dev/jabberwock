import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';
import JWEditor from '../../core/src/JWEditor';
import { ActionableNode } from './ActionableNode';

export interface ActionableGroupNodeParams extends AbstractNodeParams {
    name?: string;
    label?: string;
    visible?: (editor: JWEditor) => boolean;
}

export class ActionableGroupNode extends ContainerNode {
    groupName: string;
    label: string;

    constructor(params?: ActionableGroupNodeParams) {
        super(params);
        this.groupName = params?.name;
        this.label = params?.label;
        if (params?.visible) {
            this.visible = params.visible;
        }
    }

    visible(editor: JWEditor): boolean {
        // The group is visible if at least one children in visible.
        for (const actionable of this.descendants(ActionableNode)) {
            if (actionable.visible(editor)) {
                return true;
            }
        }
        return false;
    }
}
