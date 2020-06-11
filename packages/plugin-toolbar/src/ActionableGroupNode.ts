import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

export interface ActionableGroupNodeParams extends AbstractNodeParams {
    name: string;
}

export class ActionableGroupNode extends ContainerNode {
    groupName: string;

    constructor(params?: ActionableGroupNodeParams) {
        super(params);
        this.groupName = params?.name;
    }
}
