import { ContainerNode } from './ContainerNode';

export class VElement extends ContainerNode {
    htmlTag: string;
    constructor(params: { htmlTag: string }) {
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
        const defaults: ConstructorParameters<typeof VElement>[0] = {
            htmlTag: this.htmlTag,
        };
        return super.clone(deepClone, { ...defaults, ...params });
    }
}
