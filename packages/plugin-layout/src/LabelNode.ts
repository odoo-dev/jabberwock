import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

interface LabelNodeParams extends AbstractNodeParams {
    label: string;
}

export class LabelNode extends AtomicNode {
    label: string;
    constructor(params: LabelNodeParams) {
        super();
        this.label = params.label;
    }
}
