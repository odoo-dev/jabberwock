import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

export interface IconNodeParams extends AbstractNodeParams {
    htmlTag: string;
    iconClasses: string[];
    title?: string;
}
export class IconNode extends InlineNode {
    static readonly atomic = true;
    htmlTag: string;
    iconClasses: string[];
    title?: string;
    constructor(params: IconNodeParams) {
        super(params);
        this.htmlTag = params.htmlTag;
        this.iconClasses = params.iconClasses;
        this.title = params.title;
    }
}
