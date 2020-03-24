import { InlineNode } from '../../plugin-inline/src/InlineNode';

export class FontawesomeNode extends InlineNode {
    static readonly atomic = true;
    constructor(public htmlTag = 'SPAN') {
        super();
    }
}
