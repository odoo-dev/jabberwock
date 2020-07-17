import { VElement } from '../../core/src/VNodes/VElement';
import { TableNode } from './TableNode';
import { ancestorNodeTemp } from '../../core/src/VNodes/AbstractNode';

export class TableRowNode extends VElement {
    breakable = false;
    header: boolean;
    constructor(params?: { header: boolean }) {
        super({ htmlTag: 'TR' });
        this.header = params?.header || false;
    }

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    /**
     * Return a new VNode with the same type and attributes as this VNode.
     *
     *  @override
     */
    clone(deepClone?: boolean, params?: {}): this {
        const defaults: ConstructorParameters<typeof TableRowNode>[0] = {
            header: this.header,
        };
        return super.clone(deepClone, { ...defaults, ...params });
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
        return ancestorNodeTemp(this, TableNode)
            .children(TableRowNode)
            .indexOf(this);
    }
}
