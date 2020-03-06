import { MarkerNode } from '../../core/src/VNodes/MarkerNode';

export class MetadataNode extends MarkerNode {
    static readonly atomic = true;
    htmlTag: string;
    contents = '';
    constructor(htmlTag: string) {
        super();
        this.htmlTag = htmlTag;
    }
    get name(): string {
        return this.constructor.name + ': ' + this.htmlTag;
    }
}
