import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

export interface OdooVideoNodeParams extends AbstractNodeParams {
    src: string;
}
export class OdooVideoNode extends AtomicNode {
    src: string;
    constructor(params: OdooVideoNodeParams) {
        super(params);
        this.src = params.src;
    }
}
