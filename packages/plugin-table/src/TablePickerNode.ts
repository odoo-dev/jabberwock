import { TableNode } from './TableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class TablePickerNode extends TableNode {
    constructor(params?: { rowCount?: number; columnCount?: number }) {
        super(params);
        this.modifiers.get(Attributes).classList.add('table-picker');
    }
}
