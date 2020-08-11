import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

export interface FontAwesomeNodeParams extends AbstractNodeParams {
    htmlTag: string;
    faClasses: string[];
}
export class FontAwesomeNode extends InlineNode {
    static readonly atomic = true;
    htmlTag: string;
    faClasses: string[];
    constructor(params: FontAwesomeNodeParams) {
        super(params);
        this.htmlTag = params.htmlTag;
        this.faClasses = params.faClasses;
    }
}
