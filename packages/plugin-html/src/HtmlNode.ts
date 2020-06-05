import { AtomicNode } from '../../core/src/VNodes/AtomicNode';

export interface HtmlNodeParams {
    domNode: Node;
}

export class HtmlNode extends AtomicNode {
    domNode: Node;
    constructor(params: HtmlNodeParams) {
        super();
        this.domNode = params.domNode;
    }
}
