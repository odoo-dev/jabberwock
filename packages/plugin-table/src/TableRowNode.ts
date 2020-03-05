import { VElement } from '../../core/src/VNodes/VElement';
import { TableNode } from './TableNode';

export class TableRowNode extends VElement {
    header: boolean;
    constructor(header = false) {
        super('TR');
        this.header = header;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     *  @override
     */
    clone(): this {
        const clone = new this.constructor<typeof TableRowNode>(this.header);
        clone.attributes = { ...this.attributes };
        return clone;
    }

    //--------------------------------------------------------------------------
    // Getters
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    get name(): string {
        return super.name + (this.header ? ': header' : '');
    }
    /**
     * Return the index of this row in the table.
     */
    get rowIndex(): number {
        return this.ancestor(TableNode)
            .children(TableRowNode)
            .indexOf(this);
    }
}
