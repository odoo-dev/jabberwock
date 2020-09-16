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

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    clone(params?: {}): this {
        const defaults: ConstructorParameters<typeof MetadataNode>[0] = {
            htmlTag: this.htmlTag,
        };
        return super.clone({ ...defaults, ...params });
    }
}
