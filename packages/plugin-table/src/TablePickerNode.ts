import { TableNode } from './TableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class TablePickerNode extends TableNode {
    constructor(rowCount: number, columnCount: number) {
        super(rowCount, columnCount);
        this.modifiers.get(Attributes).classList.add('table-picker');
    }
}
