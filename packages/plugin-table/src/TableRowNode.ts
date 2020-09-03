import { TagNode } from '../../core/src/VNodes/TagNode';
import { TableNode } from './TableNode';
import { TableCellNode } from './TableCellNode';

export class TableRowNode extends TagNode {
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
        return this.ancestor(TableNode)
            .children(TableRowNode)
            .indexOf(this);
    }
    /**
     * Remove managment of colspan & rowspan for the remove cell.
     *
     * @override
     */
    _removeAtIndex(index: number): void {
        const cell = this.childVNodes[index];
        if (cell instanceof TableCellNode) {
            cell.unmerge();
        }
        super._removeAtIndex(index);
    }
}
