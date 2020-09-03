import { TagNode } from '../../core/src/VNodes/TagNode';

export class ParagraphNode extends TagNode {
    mayContainContainers = false;
    constructor() {
        super({ htmlTag: 'P' });
    }
}
