import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

export class ActionableGroupNode extends ContainerNode {
    groupName: string;

    constructor(params?: { name?: string }) {
        super();
        params = params || {};
        this.groupName = params.name;
    }
}
