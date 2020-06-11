import { MarkerNode } from '../../core/src/VNodes/MarkerNode';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

export interface MetadataNodeParams extends AbstractNodeParams {
    htmlTag: string;
}

export class MetadataNode extends MarkerNode {
    static readonly atomic = true;
    htmlTag: string;
    contents = '';
    constructor(params: MetadataNodeParams) {
        super(params);
        this.htmlTag = params.htmlTag;
    }
    get name(): string {
        return this.constructor.name + ': ' + this.htmlTag;
    }
}
