import { VElement } from '../core/src/VNodes/VElement';

export class DividerNode extends VElement {
    constructor() {
        super('DIV');
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     */
    clone(): this {
        const clone = new this.constructor<typeof DividerNode>();
        clone.attributes = { ...this.attributes };
        return clone;
    }
}
