import { ContainerNode } from './ContainerNode';

export interface TagNodeParams {
    htmlTag: string;
}

export class TagNode extends ContainerNode {
    htmlTag: string;
    constructor(params: TagNodeParams) {
        super();
        this.htmlTag = params.htmlTag;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    clone(deepClone?: boolean, params?: {}): this {
        const defaults: ConstructorParameters<typeof TagNode>[0] = {
            htmlTag: this.htmlTag,
        };
        return super.clone(deepClone, { ...defaults, ...params });
    }
}
