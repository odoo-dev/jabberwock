import { AtomicNode } from '../../core/src/VNodes/AtomicNode';

export interface OdooVideoNodeParams {
    src: string;
}
export class OdooVideoNode extends AtomicNode {
    src: string;
    constructor(params: OdooVideoNodeParams) {
        super();
        this.src = params.src;
    }
}
