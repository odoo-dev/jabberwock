import { AtomicNode } from './AtomicNode';

export interface AtomicTagNodeParams {
    htmlTag: string;
}

export class AtomicTagNode extends AtomicNode {
    htmlTag: string;
    constructor(params: AtomicTagNodeParams) {
        super();
        this.htmlTag = params.htmlTag;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    clone(params?: {}): this {
        const defaults: ConstructorParameters<typeof AtomicTagNode>[0] = {
            htmlTag: this.htmlTag,
        };
        return super.clone({ ...defaults, ...params });
    }
}
