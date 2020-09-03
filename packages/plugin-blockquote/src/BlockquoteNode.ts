import { TagNode } from '../../core/src/VNodes/TagNode';

export class BlockquoteNode extends TagNode {
    constructor() {
        super({ htmlTag: 'BLOCKQUOTE' });
    }
}
