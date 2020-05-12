import { expect } from 'chai';
import { TableCellNode } from '../src/TableCellNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export function withSelectedCell(element: Element, rowIndex: number, columnIndex: number): string {
    const domTable = element.querySelector('table');
    const domRow = domTable.querySelectorAll('tr')[rowIndex];
    const domCell = domRow.querySelectorAll('th, td')[columnIndex];
    domCell.textContent = '[]' + domCell.textContent;
    return element.innerHTML;
}
export function testActive(cells: TableCellNode[], expected: boolean[]): void {
    for (let i = 0; i < cells.length; i += 1) {
        const desc = `${i}th cell is${expected[i] ? ' ' : ' not '}active`;
        expect(cells[i].isActive()).to.equal(expected[i], desc);
    }
}
export function testHeader(cells: TableCellNode[], expected: boolean[]): void {
    for (let i = 0; i < cells.length; i += 1) {
        const desc = `${i}th cell is${expected[i] ? ' ' : ' not '}a header`;
        expect(cells[i].header).to.equal(expected[i], desc);
    }
}
export function testColspan(cells: TableCellNode[], expected: number[]): void {
    for (let i = 0; i < cells.length; i += 1) {
        const desc = `${i}th cell has same colspan as copied cell`;
        expect(cells[i].colspan).to.equal(expected[i], desc);
    }
}
export function testRowspan(cells: TableCellNode[], expected: number[]): void {
    for (let i = 0; i < cells.length; i += 1) {
        const desc = `${i}th cell has same rowspan as copied cell`;
        expect(cells[i].rowspan).to.equal(expected[i], desc);
    }
}
export function testStyles(cells: TableCellNode[], expected: string[]): void {
    for (let i = 0; i < cells.length; i += 1) {
        const desc = `${i}th cell preserved style`;
        const attributes = cells[i].modifiers.find(Attributes);
        expect(attributes?.get('style')).to.equal(expected[i], desc);
    }
}
export function testManagers(
    cells: TableCellNode[],
    expected: Array<number | TableCellNode>,
): void {
    for (let i = 0; i < cells.length; i += 1) {
        let desc: string;
        const exp = expected[i];
        if (typeof exp === 'undefined') {
            desc = `${i}th cell has no manager`;
        } else {
            desc = `${i}th cell is managed by ${expected[i]}th cell`;
        }
        const expectedCell = typeof exp === 'number' ? cells[exp] : exp;
        expect(cells[i].managerCell).to.equal(expectedCell, desc);
    }
}
export function testManagedCells(cells: TableCellNode[], expected: number[][]): void {
    for (let i = 0; i < cells.length; i += 1) {
        let desc: string;
        if (expected[i].length) {
            desc = `${i}th cell manages cells ${expected[i].join(', ')}`;
        } else {
            desc = `${i}th cell doesn't manage other cells`;
        }
        expect(Array.from(cells[i].managedCells)).to.deep.equal(
            expected[i].map(cellIndex => cells[cellIndex]),
            desc,
        );
    }
}
