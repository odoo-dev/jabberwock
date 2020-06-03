import { AtomicNode } from '../../core/src/VNodes/AtomicNode';

export class LabelNode extends AtomicNode {
    label: string;
    constructor(params: { label: string }) {
        super();
        this.label = params.label;
    }
}
