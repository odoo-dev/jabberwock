import { expect } from 'chai';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { TableNode } from '../src/TableNode';
import { Table } from '../src/Table';
import { TableRowNode } from '../src/TableRowNode';
import { describePlugin } from '../../utils/src/testUtils';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import {
    withSelectedCell,
    testActive,
    testHeader,
    testColspan,
    testRowspan,
    testStyles,
    testManagers,
    testManagedCells,
} from './tableTestUtils';
import template from './tableTestTemplate.xml';
import { TableCellNode } from '../src/TableCellNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { TableSectionAttributes } from '../src/TableRowXmlDomParser';
import { Attributes } from '../../plugin-xml/src/Attributes';

let element: Element;
describePlugin(Table, testEditor => {
    describe('parse and render in the DOM', () => {
        it('should parse a simple table', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<thead>',
                            '<tr>',
                                '<th>ab</th>',
                                '<td>cd</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr>',
                                '<td>e[f]g</td>',
                                '<td>hi</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                contentAfter: [
                    '<table>',
                        '<thead>',
                            '<tr>',
                                '<th>ab</th>',
                                '<td>cd</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr>',
                                '<td>e[f]g</td>',
                                '<td>hi</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a tbody to a table without tbody', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<thead>',
                            '<tr>',
                                '<td>ab</td>',
                            '</tr>',
                        '</thead>',
                        '<tr>',
                            '<td>c[d]e</td>',
                        '</tr>',
                    '</table>',
                ].join(''),
                contentAfter: [
                    '<table>',
                        '<thead>',
                            '<tr>',
                                '<td>ab</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr>',
                                '<td>c[d]e</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should parse a nested table', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>ab</td>',
                                '<td>cd</td>',
                            '</tr>',
                            '<tr>',
                                '<td>',
                                    '<table>',
                                        '<thead>',
                                            '<tr>',
                                                '<td>ef</td>',
                                                '<td>gh</td>',
                                                '<td>ij</td>',
                                            '</tr>',
                                        '</thead>',
                                        '<tbody>',
                                            '<tr>',
                                                '<td>kl</td>',
                                                '<td>mn</td>',
                                                '<td>op</td>',
                                            '</tr>',
                                        '</tbody>',
                                    '</table>',
                                '</td>',
                                '<td>qr</td>',
                            '</tr>',
                            '<tr>',
                                '<td>st</td>',
                                '<td>uv</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>ab</td>',
                                '<td>cd</td>',
                            '</tr>',
                            '<tr>',
                                '<td>',
                                    '<table>',
                                        '<thead>',
                                            '<tr>',
                                                '<td>ef</td>',
                                                '<td>gh</td>',
                                                '<td>ij</td>',
                                            '</tr>',
                                        '</thead>',
                                        '<tbody>',
                                            '<tr>',
                                                '<td>kl</td>',
                                                '<td>mn</td>',
                                                '<td>op</td>',
                                            '</tr>',
                                        '</tbody>',
                                    '</table>',
                                '</td>',
                                '<td>qr</td>',
                            '</tr>',
                            '<tr>',
                                '<td>st</td>',
                                '<td>uv</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should parse all attributes in a table in the right places', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table class="a">',
                        '<thead class="b">',
                            '<tr class="c">',
                                '<td class="d">ab</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody class="e">',
                            '<tr class="f">',
                                '<td class="g">c[d]e</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                contentAfter: [
                    '<table class="a">',
                        '<thead class="b">',
                            '<tr class="c">',
                                '<td class="d">ab</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody class="e">',
                            '<tr class="f">',
                                '<td class="g">c[d]e</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should parse complex combinations of colpsans and rowspans in a table', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<thead>',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tr>',
                            '<td>(1, 0)</td>',
                            '<td>(1, 1)</td>',
                            '<td>(1, 2)</td>',
                            '<td>(1, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<th>(2, 0)</th>',
                            '<td>(2, 1)</td>',
                            '<td>(2, 2)</td>',
                            '<td>(2, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td colspan="2">(3, 0)</td>',
                            '<td rowspan="3">(3, 2)</td>',
                            '<td>(3, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(4, 0)</td>',
                            '<td rowspan="3">(4, 1)</td>',
                            '<td>(4, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(5, 0)</td>',
                            '<td>(5, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(6, 0)</td>',
                            '<td>(6, 2)</td>',
                            '<td>(6, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(7, 0)</td>',
                            '<td colspan="2" rowspan="2">(7, 1)</td>',
                            '<td>(7, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(8, 0)</td>',
                            '<td>(8, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td colspan="2" rowspan="2">(9, 0)</td>',
                            '<td>(9, 2)</td>',
                            '<td>(9, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(10, 2)</td>',
                            '<td>(10, 3)</td>',
                        '</tr>',
                    '</table>',
                ].join(''),
                contentAfter: [
                    '<table>',
                        '<thead>',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should split a tbody to parse a non-tr element within a table', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<thead>',
                            '<tr>',
                                '<td>ab</td>',
                            '</tr>',
                        '</thead>',
                        '<tr>',
                            '<td>cd</td>',
                        '</tr>',
                        '<caption>e[f]g</caption>',
                        '<tr>',
                            '<td>hi</td>',
                        '</tr>',
                    '</table>',
                ].join(''),
                contentAfter: [
                    '<table>',
                        '<thead>',
                            '<tr>',
                                '<td>ab</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr>',
                                '<td>cd</td>',
                            '</tr>',
                        '</tbody>',
                        '<caption>e[f]g</caption>',
                        '<tbody>',
                            '<tr>',
                                '<td>hi</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
    });
    describe('parse string and render in the DOM', () => {
        let editor: BasicEditor;
        beforeEach(async () => {
            editor = new BasicEditor();
            await editor.start();
        });
        afterEach(async () => {
            await editor.stop();
        });

        it('should parse a simple table', async () => {
            /* eslint-disable prettier/prettier */
            const vNodes = await editor.plugins.get(Parser).parse('text/html', [
                '<table>',
                    '<thead>',
                        '<tr>',
                            '<th>ab</th>',
                            '<td>cd</td>',
                        '</tr>',
                    '</thead>',
                    '<tbody>',
                        '<tr>',
                            '<td>e[f]g</td>',
                            '<td>hi</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
            expect(vNodes.length).to.equal(1);

            expect(vNodes[0]._repr().replace(/ \([0-9]+\)|\s+$/g, '')).to.equal(
                [
                    'TableNode: 2x2',
                    '    TableRowNode: header',
                    '        TableCellNode <(0, 0)>: header',
                    '            a',
                    '            b',
                    '        TableCellNode <(0, 1)>',
                    '            c',
                    '            d',
                    '    TableRowNode',
                    '        TableCellNode <(1, 0)>',
                    '            e',
                    '            [',
                    '            f',
                    '            ]',
                    '            g',
                    '        TableCellNode <(1, 1)>',
                    '            h',
                    '            i',
                ].join('\n'),
            );

            const renderer = editor.plugins.get(Renderer);
            const domNodes = await renderer.render('dom/html', vNodes[0]);
            const table = domNodes[0] as HTMLTableElement;
            /* eslint-disable prettier/prettier */
            expect(table.outerHTML).to.equal([
                '<table>',
                    '<thead>',
                        '<tr>',
                            '<th>ab</th>',
                            '<td>cd</td>',
                        '</tr>',
                    '</thead>',
                    '<tbody>',
                        '<tr>',
                            '<td>e[f]g</td>',
                            '<td>hi</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
        });
        it('should add a tbody to a table without tbody', async () => {
            /* eslint-disable prettier/prettier */
            const vNodes = await editor.plugins.get(Parser).parse('text/html', [
                '<table>',
                    '<thead>',
                        '<tr>',
                            '<td>ab</td>',
                        '</tr>',
                    '</thead>',
                    '<tr>',
                        '<td>c[d]e</td>',
                    '</tr>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
            expect(vNodes.length).to.equal(1);

            const renderer = editor.plugins.get(Renderer);
            const domNodes = await renderer.render('dom/html', vNodes[0]);
            const table = domNodes[0] as HTMLTableElement;
            /* eslint-disable prettier/prettier */
            expect(table.outerHTML).to.equal([
                '<table>',
                    '<thead>',
                        '<tr>',
                            '<td>ab</td>',
                        '</tr>',
                    '</thead>',
                    '<tbody>',
                        '<tr>',
                            '<td>c[d]e</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
        });
        it('should parse a nested table', async () => {
            /* eslint-disable prettier/prettier */
            const vNodes = await editor.plugins.get(Parser).parse('text/html', [
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td>ab</td>',
                            '<td>cd</td>',
                        '</tr>',
                        '<tr>',
                            '<td>',
                                '<table>',
                                    '<thead>',
                                        '<tr>',
                                            '<td>ef</td>',
                                            '<td>gh</td>',
                                            '<td>ij</td>',
                                        '</tr>',
                                    '</thead>',
                                    '<tbody>',
                                        '<tr>',
                                            '<td>kl</td>',
                                            '<td>mn</td>',
                                            '<td>op</td>',
                                        '</tr>',
                                    '</tbody>',
                                '</table>',
                            '</td>',
                            '<td>qr</td>',
                        '</tr>',
                        '<tr>',
                            '<td>st</td>',
                            '<td>uv</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
            expect(vNodes.length).to.equal(1);

            const renderer = editor.plugins.get(Renderer);
            const domNodes = await renderer.render('dom/html', vNodes[0]);
            const table = domNodes[0] as HTMLTableElement;
            /* eslint-disable prettier/prettier */
            expect(table.outerHTML).to.equal([
                '<table>',
                    '<tbody>',
                        '<tr>',
                            '<td>ab</td>',
                            '<td>cd</td>',
                        '</tr>',
                        '<tr>',
                            '<td>',
                                '<table>',
                                    '<thead>',
                                        '<tr>',
                                            '<td>ef</td>',
                                            '<td>gh</td>',
                                            '<td>ij</td>',
                                        '</tr>',
                                    '</thead>',
                                    '<tbody>',
                                        '<tr>',
                                            '<td>kl</td>',
                                            '<td>mn</td>',
                                            '<td>op</td>',
                                        '</tr>',
                                    '</tbody>',
                                '</table>',
                            '</td>',
                            '<td>qr</td>',
                        '</tr>',
                        '<tr>',
                            '<td>st</td>',
                            '<td>uv</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
        });
        it('should parse all attributes in a table in the right places', async () => {
            /* eslint-disable prettier/prettier */
            const vNodes = await editor.plugins.get(Parser).parse('text/html', [
                '<table class="a">',
                    '<thead class="b">',
                        '<tr class="c">',
                            '<td class="d">ab</td>',
                        '</tr>',
                    '</thead>',
                    '<tbody class="e">',
                        '<tr class="f">',
                            '<td class="g">c[d]e</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
            expect(vNodes.length).to.equal(1);

            const renderer = editor.plugins.get(Renderer);
            const domNodes = await renderer.render('dom/html', vNodes[0]);
            const table = domNodes[0] as HTMLTableElement;
            /* eslint-disable prettier/prettier */
            expect(table.outerHTML).to.equal([
                '<table class="a">',
                    '<thead class="b">',
                        '<tr class="c">',
                            '<td class="d">ab</td>',
                        '</tr>',
                    '</thead>',
                    '<tbody class="e">',
                        '<tr class="f">',
                            '<td class="g">c[d]e</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
        });
        it('should parse complex combinations of colpsans and rowspans in a table', async () => {
            /* eslint-disable prettier/prettier */
            const vNodes = await editor.plugins.get(Parser).parse('text/html', [
                '<table>',
                    '<thead>',
                        '<tr>',
                            '<th>(0, 0)</th>',
                            '<td colspan="3">(0, 1)</td>',
                        '</tr>',
                    '</thead>',
                    '<tr>',
                        '<td>(1, 0)</td>',
                        '<td>(1, 1)</td>',
                        '<td>(1, 2)</td>',
                        '<td>(1, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<th>(2, 0)</th>',
                        '<td>(2, 1)</td>',
                        '<td>(2, 2)</td>',
                        '<td>(2, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<td colspan="2">(3, 0)</td>',
                        '<td rowspan="3">(3, 2)</td>',
                        '<td>(3, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<td>(4, 0)</td>',
                        '<td rowspan="3">(4, 1)</td>',
                        '<td>(4, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<td>(5, 0)</td>',
                        '<td>(5, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<td>(6, 0)</td>',
                        '<td>(6, 2)</td>',
                        '<td>(6, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<td>(7, 0)</td>',
                        '<td colspan="2" rowspan="2">(7, 1)</td>',
                        '<td>(7, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<td>(8, 0)</td>',
                        '<td>(8, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<td colspan="2" rowspan="2">(9, 0)</td>',
                        '<td>(9, 2)</td>',
                        '<td>(9, 3)</td>',
                    '</tr>',
                    '<tr>',
                        '<td>(10, 2)</td>',
                        '<td>(10, 3)</td>',
                    '</tr>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
            expect(vNodes.length).to.equal(1);

            const renderer = editor.plugins.get(Renderer);
            const domNodes = await renderer.render('dom/html', vNodes[0]);
            const table = domNodes[0] as HTMLTableElement;
            /* eslint-disable prettier/prettier */
            expect(table.outerHTML).to.equal([
                '<table>',
                    '<thead>',
                        '<tr>',
                            '<th>(0, 0)</th>',
                            '<td colspan="3">(0, 1)</td>',
                        '</tr>',
                    '</thead>',
                    '<tbody>',
                        '<tr>',
                            '<td>(1, 0)</td>',
                            '<td>(1, 1)</td>',
                            '<td>(1, 2)</td>',
                            '<td>(1, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<th>(2, 0)</th>',
                            '<td>(2, 1)</td>',
                            '<td>(2, 2)</td>',
                            '<td>(2, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td colspan="2">(3, 0)</td>',
                            '<td rowspan="3">(3, 2)</td>',
                            '<td>(3, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(4, 0)</td>',
                            '<td rowspan="3">(4, 1)</td>',
                            '<td>(4, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(5, 0)</td>',
                            '<td>(5, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(6, 0)</td>',
                            '<td>(6, 2)</td>',
                            '<td>(6, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(7, 0)</td>',
                            '<td colspan="2" rowspan="2">(7, 1)</td>',
                            '<td>(7, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(8, 0)</td>',
                            '<td>(8, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td colspan="2" rowspan="2">(9, 0)</td>',
                            '<td>(9, 2)</td>',
                            '<td>(9, 3)</td>',
                        '</tr>',
                        '<tr>',
                            '<td>(10, 2)</td>',
                            '<td>(10, 3)</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
        });
        it('should split a tbody to parse a non-tr element within a table', async () => {
            /* eslint-disable prettier/prettier */
            const vNodes = await editor.plugins.get(Parser).parse('text/html', [
                '<table>',
                    '<thead>',
                        '<tr>',
                            '<td>ab</td>',
                        '</tr>',
                    '</thead>',
                    '<tr>',
                        '<td>cd</td>',
                    '</tr>',
                    '<caption>e[f]g</caption>',
                    '<tr>',
                        '<td>hi</td>',
                    '</tr>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
            expect(vNodes.length).to.equal(1);

            const renderer = editor.plugins.get(Renderer);
            const domNodes = await renderer.render('dom/html', vNodes[0]);
            const table = domNodes[0] as HTMLTableElement;
            /* eslint-disable prettier/prettier */
            expect(table.outerHTML).to.equal([
                '<table>',
                    '<thead>',
                        '<tr>',
                            '<td>ab</td>',
                        '</tr>',
                    '</thead>',
                    '<tbody>',
                        '<tr>',
                            '<td>cd</td>',
                        '</tr>',
                    '</tbody>',
                    '<caption>e[f]g</caption>',
                    '<tbody>',
                        '<tr>',
                            '<td>hi</td>',
                        '</tr>',
                    '</tbody>',
                '</table>',
            ].join(''));
            /* eslint-enable prettier/prettier */
        });
    });
    describe('addRowAbove', () => {
        beforeEach(async () => {
            element = document.createElement('div');
            element.innerHTML = template;
        });
        it('should add a row above the 0th (header) row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 0, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row0 = table.children(TableRowNode)[0];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[0];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row0, '0th row is a new row');
                    expect(table.children(TableRowNode)[1]).to.equal(
                        row0,
                        '1th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(true, 'new row is a header row');
                    expect(insertedRow.modifiers.find(TableSectionAttributes)).not.to.equal(
                        undefined,
                        'new row has table container attributes',
                    );
                    expect(
                        insertedRow.modifiers.find(TableSectionAttributes)?.style.cssText,
                    ).to.equal('background-color: red;', 'new row preserved styles of thead');

                    // Test individual cells
                    testActive(insertedCells, [true, true, false, false]);
                    testHeader(insertedCells, [true, false, false, false]);
                    testColspan(insertedCells, [1, 3, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, undefined, 1, 1]);
                    testManagedCells(insertedCells, [[], [2, 3], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th><br></th>',
                                '<td colspan="3"><br></td>',
                            '</tr>',
                            '<tr>',
                                '<th>[](0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 1th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 1, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row1 = table.children(TableRowNode)[1];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[1];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row1, '1th row is a new row');
                    expect(table.children(TableRowNode)[2]).to.equal(
                        row1,
                        '2th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        'background-color: green;',
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, true, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [
                        'background-color: blue;',
                        undefined,
                        undefined,
                        undefined,
                    ]);
                    testManagers(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagedCells(insertedCells, [[], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;"><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">[](1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 2th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 2, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row2 = table.children(TableRowNode)[2];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[2];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row2, '2th row is a new row');
                    expect(table.children(TableRowNode)[3]).to.equal(
                        row2,
                        '3th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, true, true, true]);
                    testHeader(insertedCells, [true, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagedCells(insertedCells, [[], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th><br></th>',
                                '<td><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<th>[](2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 3th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 3, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row3 = table.children(TableRowNode)[3];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[3];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row3, '3th row is a new row');
                    expect(table.children(TableRowNode)[4]).to.equal(
                        row3,
                        '4th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [2, 1, 1, 1]);
                    testStyles(insertedCells, [
                        undefined,
                        undefined,
                        'background-color: yellow;',
                        undefined,
                    ]);
                    testManagers(insertedCells, [undefined, 0, undefined, undefined]);
                    testManagedCells(insertedCells, [[1], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2"><br></td>',
                                '<td style="background-color: yellow;"><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">[](3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 4th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 4, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row4 = table.children(TableRowNode)[4];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[4];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row4, '4th row is a new row');
                    expect(table.children(TableRowNode)[5]).to.equal(
                        row4,
                        '5th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, true, false, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [
                        undefined,
                        undefined,
                        'background-color: yellow;',
                        undefined,
                    ]);
                    testManagers(insertedCells, [
                        undefined,
                        undefined,
                        table.children(TableRowNode)[3].children(TableCellNode)[2],
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);

                    // Extend traversed rowspan
                    expect(
                        table.children(TableRowNode)[3].children(TableCellNode)[2].rowspan,
                    ).to.equal(4, 'traversed rowspan was extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="4">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 5th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 5, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row5 = table.children(TableRowNode)[5];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[5];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row5, '5th row is a new row');
                    expect(table.children(TableRowNode)[6]).to.equal(
                        row5,
                        '6th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, false, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [
                        undefined,
                        undefined,
                        'background-color: yellow;',
                        undefined,
                    ]);
                    testManagers(insertedCells, [
                        undefined,
                        table.children(TableRowNode)[4].children(TableCellNode)[1],
                        table.children(TableRowNode)[3].children(TableCellNode)[2],
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);

                    // Extend traversed rowspan
                    expect(
                        table.children(TableRowNode)[4].children(TableCellNode)[1].rowspan,
                    ).to.equal(4, 'traversed rowspan was extended');
                    expect(
                        table.children(TableRowNode)[3].children(TableCellNode)[2].rowspan,
                    ).to.equal(4, 'second traversed rowspan was extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="4">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="4">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 6th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 6, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row6 = table.children(TableRowNode)[6];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[6];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row6, '6th row is a new row');
                    expect(table.children(TableRowNode)[7]).to.equal(
                        row6,
                        '7th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [
                        undefined,
                        table.children(TableRowNode)[4].children(TableCellNode)[1],
                        undefined,
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);

                    // Extend traversed rowspan
                    expect(
                        table.children(TableRowNode)[4].children(TableCellNode)[1].rowspan,
                    ).to.equal(4, 'traversed rowspan was extended');
                    expect(
                        table.children(TableRowNode)[3].children(TableCellNode)[2].rowspan,
                    ).to.equal(3, 'ended rowspan was not extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="4">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 7th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 7, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row7 = table.children(TableRowNode)[7];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[7];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row7, '7th row is a new row');
                    expect(table.children(TableRowNode)[8]).to.equal(
                        row7,
                        '8th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, true, false, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 2, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, undefined, 1, undefined]);
                    testManagedCells(insertedCells, [[], [2], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td colspan="2"><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 8th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 8, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row8 = table.children(TableRowNode)[8];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[8];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row8, '8th row is a new row');
                    expect(table.children(TableRowNode)[9]).to.equal(
                        row8,
                        '9th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, false, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [
                        undefined,
                        table.children(TableRowNode)[7].children(TableCellNode)[1],
                        table.children(TableRowNode)[7].children(TableCellNode)[1],
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);

                    // Extend traversed rowspan
                    expect(
                        table.children(TableRowNode)[7].children(TableCellNode)[1].rowspan,
                    ).to.equal(3, 'traversed rowspan was extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="3">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 9th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 9, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row9 = table.children(TableRowNode)[9];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[9];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row9, '9th row is a new row');
                    expect(table.children(TableRowNode)[10]).to.equal(
                        row9,
                        '10th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [2, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, 0, undefined, undefined]);
                    testManagedCells(insertedCells, [[1], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2"><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">[](9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row above the 10th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 10, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row10 = table.children(TableRowNode)[10];
                    await editor.execCommand('addRowAbove');
                    const insertedRow = table.children(TableRowNode)[10];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(insertedRow).to.not.equal(row10, '10th row is a new row');
                    expect(table.children(TableRowNode)[11]).to.equal(
                        row10,
                        '11th row is the old row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [false, false, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [
                        table.children(TableRowNode)[9].children(TableCellNode)[0],
                        table.children(TableRowNode)[9].children(TableCellNode)[0],
                        undefined,
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);

                    // Extend traversed rowspan
                    expect(
                        table.children(TableRowNode)[9].children(TableCellNode)[0].rowspan,
                    ).to.equal(3, 'traversed rowspan was extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="3">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
    });
    describe('addRowBelow', () => {
        beforeEach(async () => {
            element = document.createElement('div');
            element.innerHTML = template;
        });
        it('should add a row below the 0th (header) row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 0, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row0 = table.children(TableRowNode)[0];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[1];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[0]).to.equal(
                        row0,
                        '0th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row0, '1th row is a new row');
                    expect(insertedRow.header).to.equal(true, 'new row is a header row');
                    expect(insertedRow.modifiers.find(TableSectionAttributes)).not.to.equal(
                        undefined,
                        'new row has table container attributes',
                    );
                    expect(
                        insertedRow.modifiers.find(TableSectionAttributes)?.style.cssText,
                    ).to.equal('background-color: red;', 'new row preserved styles of thead');

                    // Test individual cells
                    testActive(insertedCells, [true, true, false, false]);
                    testHeader(insertedCells, [true, false, false, false]);
                    testColspan(insertedCells, [1, 3, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, undefined, 1, 1]);
                    testManagedCells(insertedCells, [[], [2, 3], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>[](0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                            '<tr>',
                                '<th><br></th>',
                                '<td colspan="3"><br></td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 1th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 1, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row1 = table.children(TableRowNode)[1];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[2];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[1]).to.equal(
                        row1,
                        '1th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row1, '2th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        'background-color: green;',
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, true, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [
                        'background-color: blue;',
                        undefined,
                        undefined,
                        undefined,
                    ]);
                    testManagers(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagedCells(insertedCells, [[], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">[](1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;"><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 2th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 2, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row2 = table.children(TableRowNode)[2];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[3];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[2]).to.equal(
                        row2,
                        '2th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row2, '3th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, true, true, true]);
                    testHeader(insertedCells, [true, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagedCells(insertedCells, [[], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>[](2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th><br></th>',
                                '<td><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 3th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 3, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row3 = table.children(TableRowNode)[3];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[4];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[3]).to.equal(
                        row3,
                        '3th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row3, '4th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, false, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [2, 1, 1, 1]);
                    testStyles(insertedCells, [
                        undefined,
                        undefined,
                        'background-color: yellow;',
                        undefined,
                    ]);
                    testManagers(insertedCells, [
                        undefined,
                        0,
                        row3.children(TableCellNode)[2],
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[1], [], [], []]);

                    // Extend traversed rowspan
                    expect(row3.children(TableCellNode)[2].rowspan).to.equal(
                        4,
                        'traversed rowspan was extended',
                    );
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">[](3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="4">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2"><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 4th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 4, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row4 = table.children(TableRowNode)[4];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[5];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[4]).to.equal(
                        row4,
                        '4th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row4, '5th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, false, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [
                        undefined,
                        undefined,
                        'background-color: yellow;',
                        undefined,
                    ]);
                    testManagers(insertedCells, [
                        undefined,
                        row4.children(TableCellNode)[1],
                        table.children(TableRowNode)[3].children(TableCellNode)[2],
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);

                    // Extend traversed rowspan
                    expect(row4.children(TableCellNode)[1].rowspan).to.equal(
                        4,
                        'traversed rowspan was extended',
                    );
                    expect(
                        table.children(TableRowNode)[3].children(TableCellNode)[2].rowspan,
                    ).to.equal(4, 'second traversed rowspan was extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="4">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](4, 0)</td>',
                                '<td rowspan="4">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 5th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 5, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row5 = table.children(TableRowNode)[5];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[6];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[5]).to.equal(
                        row5,
                        '5th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row5, '6th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [
                        undefined,
                        undefined,
                        'background-color: yellow;',
                        undefined,
                    ]);
                    testManagers(insertedCells, [
                        undefined,
                        table.children(TableRowNode)[4].children(TableCellNode)[1],
                        undefined,
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="4">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td style="background-color: yellow;"><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 6th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 6, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row6 = table.children(TableRowNode)[6];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[7];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[6]).to.equal(
                        row6,
                        '6th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row6, '7th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, true, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagedCells(insertedCells, [[], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 7th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 7, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row7 = table.children(TableRowNode)[7];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[8];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[7]).to.equal(
                        row7,
                        '7th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row7, '8th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, false, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [
                        undefined,
                        row7.children(TableCellNode)[1],
                        row7.children(TableCellNode)[1],
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);

                    // Extend traversed rowspan
                    expect(row7.children(TableCellNode)[1].rowspan).to.equal(
                        3,
                        'traversed rowspan was extended',
                    );
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](7, 0)</td>',
                                '<td colspan="2" rowspan="3">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 8th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 8, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row8 = table.children(TableRowNode)[8];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[9];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[8]).to.equal(
                        row8,
                        '8th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row8, '9th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, true, false, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 2, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, undefined, 1, undefined]);
                    testManagedCells(insertedCells, [[], [2], [], []]);

                    // Extend traversed rowspan
                    expect(
                        table.children(TableRowNode)[7].children(TableCellNode)[1].rowspan,
                    ).to.equal(2, 'ended rowspan was not extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td colspan="2"><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 9th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 9, 2),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row9 = table.children(TableRowNode)[9];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[10];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[9]).to.equal(
                        row9,
                        '9th row is still the old row',
                    );
                    expect(insertedRow).to.not.equal(row9, '10th row is a new row');
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [false, false, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [1, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [
                        row9.children(TableCellNode)[0],
                        row9.children(TableCellNode)[0],
                        undefined,
                        undefined,
                    ]);
                    testManagedCells(insertedCells, [[], [], [], []]);

                    // Extend traversed rowspan
                    expect(row9.children(TableCellNode)[0].rowspan).to.equal(
                        3,
                        'traversing rowspan was extended',
                    );
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="3">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>[](9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 10th row (within cell with rowspan in 9th row)', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 9, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const row9 = table.children(TableRowNode)[9];
                    const row10 = table.children(TableRowNode)[10];
                    await editor.execCommand('addRowBelow');
                    const insertedRow = table.children(TableRowNode)[11];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[9]).to.equal(
                        row9,
                        "9th row hasn't changed",
                    );
                    expect(table.children(TableRowNode)[10]).to.equal(
                        row10,
                        "10th row hasn't changed",
                    );
                    expect(insertedRow !== row9 && insertedRow !== row10).to.equal(
                        true,
                        '11th row is a new row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [2, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, 0, undefined, undefined]);
                    testManagedCells(insertedCells, [[1], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">[](9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2"><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a row below the 10th row', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 10, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    await editor.execCommand('addRowBelow');
                    const row10 = table.children(TableRowNode)[10];
                    table.addRowBelow(row10.children(TableCellNode)[0]);
                    const insertedRow = table.children(TableRowNode)[11];
                    const insertedCells = insertedRow.children(TableCellNode);

                    // Test the row
                    expect(table.children(TableRowNode)[10]).to.equal(
                        row10,
                        "10th row hasn't changed",
                    );
                    expect(table.children(TableRowNode)[11]).to.not.equal(
                        row10,
                        '11th row is a new row',
                    );
                    expect(insertedRow.header).to.equal(false, 'new row is not a header row');
                    expect(insertedRow.modifiers.find(Attributes)?.style.cssText).to.equal(
                        undefined,
                        'row preserved style',
                    );

                    // Test individual cells
                    testActive(insertedCells, [true, false, true, true]);
                    testHeader(insertedCells, [false, false, false, false]);
                    testColspan(insertedCells, [2, 1, 1, 1]);
                    testStyles(insertedCells, [undefined, undefined, undefined, undefined]);
                    testManagers(insertedCells, [undefined, 0, undefined, undefined]);
                    testManagedCells(insertedCells, [[1], [], [], []]);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2"><br></td>',
                                '<td><br></td>',
                                '<td><br></td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
    });
    describe('addColumnBefore', () => {
        beforeEach(async () => {
            element = document.createElement('div');
            element.innerHTML = template;
        });
        it('should add a column before the 0th column', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 0, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const col0 = table.columns[0];
                    await editor.execCommand('addColumnBefore');
                    const insertedCells = table.columns[0].filter(cell => cell);

                    // Test the column
                    expect(table.columns[0]).to.not.deep.equal(col0, '0th column is a new column');
                    expect(table.columns[1]).to.deep.equal(col0, '1th column is the old column');

                    // Test individual cells
                    const active = new Array(11).fill(true);
                    active[10] = false;
                    testActive(insertedCells, active);
                    const header = new Array(11).fill(false);
                    header[0] = header[2] = true;
                    testHeader(insertedCells, header);
                    const rowspan = new Array(11).fill(1);
                    rowspan[9] = 2;
                    testRowspan(insertedCells, rowspan);
                    const styles = new Array(11);
                    styles[1] = 'background-color: blue;';
                    testStyles(insertedCells, styles);
                    const managers = new Array(11);
                    managers[10] = 9;
                    testManagers(insertedCells, managers);
                    const managed = new Array(11).fill([]);
                    managed[9] = [10];
                    testManagedCells(insertedCells, managed);
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th><br></th>',
                                '<th>[](0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;"><br></td>',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th><br></th>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td rowspan="2"><br></td>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a column before the 1th', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 0, 1),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;

                    const col1 = table.columns[1];
                    await editor.execCommand('addColumnBefore');
                    const insertedCells = table.columns[1].filter(cell => cell);

                    // Test the row
                    expect(table.columns[1]).to.not.deep.equal(col1, '1th column is a new column');
                    expect(table.columns[2]).to.deep.equal(col1, '2th column is the old column');

                    // Test individual cells
                    const active = new Array(11).fill(true);
                    [3, 5, 6, 8, 9, 10].forEach(index => (active[index] = false));
                    testActive(insertedCells, active);
                    testHeader(insertedCells, new Array(11).fill(false));
                    const rowspan = new Array(11).fill(1);
                    rowspan[4] = 3;
                    rowspan[7] = 2;
                    testRowspan(insertedCells, rowspan);
                    testStyles(insertedCells, new Array(11));
                    const managers = new Array(11);
                    managers[3] = table.children(TableRowNode)[3].children(TableCellNode)[0];
                    managers[5] = managers[6] = 4;
                    managers[8] = 7;
                    managers[9] = managers[10] = table
                        .children(TableRowNode)[9]
                        .children(TableCellNode)[0];
                    testManagers(insertedCells, managers);
                    const managed = new Array(11).fill([]);
                    managed[4] = [5, 6];
                    managed[7] = [8];
                    testManagedCells(insertedCells, managed);

                    // Extend traversed colspan
                    expect(
                        table.children(TableRowNode)[3].children(TableCellNode)[0].colspan,
                    ).to.equal(3, 'traversed colspan was extended');
                    expect(
                        table.children(TableRowNode)[9].children(TableCellNode)[0].colspan,
                    ).to.equal(3, 'second traversed colspan was extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td><br></td>',
                                '<td colspan="3">[](0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td><br></td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td><br></td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="3">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3"><br></td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td rowspan="2"><br></td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="3" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a column before the 2th', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 1, 2),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const col2 = table.columns[2];
                    await editor.execCommand('addColumnBefore');
                    const insertedCells = table.columns[2].filter(cell => cell);

                    // Test the row
                    expect(table.columns[2]).to.not.deep.equal(col2, '2th column is a new column');
                    expect(table.columns[3]).to.deep.equal(col2, '3th column is the old column');

                    // Test individual cells
                    const active = new Array(11).fill(true);
                    [0, 4, 5, 7, 8].forEach(index => (active[index] = false));
                    testActive(insertedCells, active);
                    testHeader(insertedCells, new Array(11).fill(false));
                    const rowspan = new Array(11).fill(1);
                    rowspan[3] = 3;
                    testRowspan(insertedCells, rowspan);
                    const styles = new Array(11);
                    styles[3] = styles[4] = styles[5] = 'background-color: yellow;';
                    testStyles(insertedCells, styles);
                    const managers = new Array(11);
                    managers[0] = table.children(TableRowNode)[0].children(TableCellNode)[1];
                    managers[4] = managers[5] = 3;
                    managers[7] = managers[8] = table
                        .children(TableRowNode)[7]
                        .children(TableCellNode)[1];
                    testManagers(insertedCells, managers);
                    const managed = new Array(11).fill([]);
                    managed[3] = [4, 5];
                    testManagedCells(insertedCells, managed);

                    // Extend traversed colspan
                    expect(
                        table.children(TableRowNode)[3].children(TableCellNode)[0].colspan,
                    ).to.equal(2, 'ended colspan was not extended');
                    expect(
                        table.children(TableRowNode)[7].children(TableCellNode)[1].colspan,
                    ).to.equal(3, 'traversed colspan was extended');
                    expect(
                        table.children(TableRowNode)[9].children(TableCellNode)[0].colspan,
                    ).to.equal(2, 'second ended colspan was not extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="4">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td><br></td>',
                                '<td>[](1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td><br></td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3"><br></td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td><br></td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="3" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td><br></td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td><br></td>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a column before the 3th', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 1, 3),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const col3 = table.columns[3];
                    await editor.execCommand('addColumnBefore');
                    const insertedCells = table.columns[3].filter(cell => cell);

                    // Test the row
                    expect(table.columns[3]).to.not.deep.equal(col3, '3th column is a new column');
                    expect(table.columns[4]).to.deep.equal(col3, '4th column is the old column');

                    // Test individual cells
                    const active = new Array(11).fill(true);
                    active[0] = false;
                    testActive(insertedCells, active);
                    testHeader(insertedCells, new Array(11).fill(false));
                    testRowspan(insertedCells, new Array(11).fill(1));
                    testStyles(insertedCells, new Array(11));
                    const managers = new Array(11);
                    managers[0] = table.children(TableRowNode)[0].children(TableCellNode)[1];
                    testManagers(insertedCells, managers);
                    testManagedCells(insertedCells, new Array(11).fill([]));

                    // Extend traversed colspan
                    expect(
                        table.children(TableRowNode)[7].children(TableCellNode)[1].colspan,
                    ).to.equal(2, 'ended colspan was not extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="4">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td><br></td>',
                                '<td>[](1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td><br></td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td><br></td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td><br></td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td><br></td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td><br></td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td><br></td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td><br></td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td><br></td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td><br></td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
    });
    describe('addColumnAfter', () => {
        beforeEach(async () => {
            element = document.createElement('div');
            element.innerHTML = template;
        });
        it('should add a column after the 0th', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 0, 0),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const col0 = table.columns[0];
                    await editor.execCommand('addColumnAfter');
                    const insertedCells = table.columns[1].filter(cell => cell);
                    // Test the row
                    expect(table.columns[0]).to.deep.equal(
                        col0,
                        '0th column is still the old column',
                    );
                    expect(table.columns[1]).to.not.deep.equal(col0, '1th column is a new column');

                    // Test individual cells
                    const active = new Array(11).fill(true);
                    [3, 9, 10].forEach(index => (active[index] = false));
                    testActive(insertedCells, active);
                    const header = new Array(11).fill(false);
                    header[0] = header[2] = true;
                    testHeader(insertedCells, header);
                    testRowspan(insertedCells, new Array(11).fill(1));
                    const styles = new Array(11);
                    styles[1] = 'background-color: blue;';
                    testStyles(insertedCells, styles);
                    const managers = new Array(11);
                    managers[3] = table.children(TableRowNode)[3].children(TableCellNode)[0];
                    managers[9] = managers[10] = table
                        .children(TableRowNode)[9]
                        .children(TableCellNode)[0];
                    testManagers(insertedCells, managers);
                    testManagedCells(insertedCells, new Array(11).fill([]));

                    // Extend traversed colspan
                    expect(
                        table.children(TableRowNode)[3].children(TableCellNode)[0].colspan,
                    ).to.equal(3, 'traversed colspan was extended');
                    expect(
                        table.children(TableRowNode)[9].children(TableCellNode)[0].colspan,
                    ).to.equal(3, 'second traversed colspan was extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>[](0, 0)</th>',
                                '<th><br></th>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td style="background-color: blue;"><br></td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<th><br></th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="3">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td><br></td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td><br></td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td><br></td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td><br></td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td><br></td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="3" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a column after the 1th', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 1, 1),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const col1 = table.columns[1];
                    await editor.execCommand('addColumnAfter');
                    const insertedCells = table.columns[2].filter(cell => cell);

                    // Test the row
                    expect(table.columns[1]).to.deep.equal(
                        col1,
                        '1th column is still the old column',
                    );
                    expect(table.columns[2]).to.not.deep.equal(col1, '2th column is a new column');

                    // Test individual cells
                    const active = new Array(11).fill(true);
                    [0, 5, 6, 7, 8, 10].forEach(index => (active[index] = false));
                    testActive(insertedCells, active);
                    testHeader(insertedCells, new Array(11).fill(false));
                    const rowspan = new Array(11).fill(1);
                    rowspan[4] = 3;
                    rowspan[9] = 2;
                    testRowspan(insertedCells, rowspan);
                    testStyles(insertedCells, new Array(11));
                    const managers = new Array(11);
                    managers[0] = table.children(TableRowNode)[0].children(TableCellNode)[1];
                    managers[5] = managers[6] = 4;
                    managers[7] = managers[8] = table
                        .children(TableRowNode)[7]
                        .children(TableCellNode)[1];
                    managers[10] = 9;
                    testManagers(insertedCells, managers);
                    const managed = new Array(11).fill([]);
                    managed[4] = [5, 6];
                    managed[9] = [10];
                    testManagedCells(insertedCells, managed);

                    // Extend traversed colspan
                    expect(
                        table.children(TableRowNode)[3].children(TableCellNode)[0].colspan,
                    ).to.equal(2, 'ended colspan was not extended');
                    expect(
                        table.children(TableRowNode)[7].children(TableCellNode)[1].colspan,
                    ).to.equal(3, 'traversed colspan was extended');
                    expect(
                        table.children(TableRowNode)[9].children(TableCellNode)[0].colspan,
                    ).to.equal(2, 'second ended colspan was not extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="4">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>[](1, 1)</td>',
                                '<td><br></td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td><br></td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td><br></td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td rowspan="3"><br></td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="3" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td rowspan="2"><br></td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a column after the 2th', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 1, 2),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const col2 = table.columns[2];
                    await editor.execCommand('addColumnAfter');
                    const insertedCells = table.columns[3].filter(cell => cell);

                    // Test the row
                    expect(table.columns[2]).to.deep.equal(
                        col2,
                        '2th column is still the old column',
                    );
                    expect(table.columns[3]).to.not.deep.equal(col2, '3th column is a new column');

                    // Test individual cells
                    const active = new Array(11).fill(true);
                    [0, 4, 5, 8].forEach(index => (active[index] = false));
                    testActive(insertedCells, active);
                    testHeader(insertedCells, new Array(11).fill(false));
                    const rowspan = new Array(11).fill(1);
                    rowspan[3] = 3;
                    rowspan[7] = 2;
                    testRowspan(insertedCells, rowspan);
                    const styles = new Array(11);
                    styles[3] = styles[4] = styles[5] = 'background-color: yellow;';
                    testStyles(insertedCells, styles);
                    const managers = new Array(11);
                    managers[0] = table.children(TableRowNode)[0].children(TableCellNode)[1];
                    managers[4] = managers[5] = 3;
                    managers[8] = 7;
                    testManagers(insertedCells, managers);
                    const managed = new Array(11).fill([]);
                    managed[3] = [4, 5];
                    managed[7] = [8];
                    testManagedCells(insertedCells, managed);

                    // Extend traversed colspan
                    expect(
                        table.children(TableRowNode)[7].children(TableCellNode)[1].colspan,
                    ).to.equal(2, 'ended colspan was not extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="4">(0, 1)</td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>[](1, 2)</td>',
                                '<td><br></td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td><br></td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td style="background-color: yellow;" rowspan="3"><br></td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td><br></td>',
                                '<td>(6, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td rowspan="2"><br></td>',
                                '<td>(7, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td><br></td>',
                                '<td>(9, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td><br></td>',
                                '<td>(10, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should add a column after the 3th', async () => {
            await testEditor(BasicEditor, {
                contentBefore: withSelectedCell(element, 1, 3),
                stepFunction: async (editor: BasicEditor) => {
                    const domEngine = editor.plugins.get(Layout).engines.dom;
                    const editable = domEngine.components.get('editable')[0];
                    const table = editable.firstChild() as TableNode;
                    const col3 = table.columns[3];
                    await editor.execCommand('addColumnAfter');
                    const insertedCells = table.columns[4].filter(cell => cell);

                    // Test the row
                    expect(table.columns[3]).to.deep.equal(
                        col3,
                        '3th column is still the old column',
                    );
                    expect(table.columns[4]).to.not.deep.equal(col3, '4th column is a new column');

                    // Test individual cells
                    testActive(insertedCells, new Array(11).fill(true));
                    testHeader(insertedCells, new Array(11).fill(false));
                    testRowspan(insertedCells, new Array(11).fill(1));
                    testStyles(insertedCells, new Array(11));
                    testManagers(insertedCells, new Array(11));
                    testManagedCells(insertedCells, new Array(11).fill([]));

                    // Extend traversed colspan
                    expect(
                        table.children(TableRowNode)[0].children(TableCellNode)[1].colspan,
                    ).to.equal(3, 'ended colspan was not extended');
                },
                /* eslint-disable prettier/prettier */
                contentAfter: [
                    '<table>',
                        '<thead style="background-color: red;">',
                            '<tr>',
                                '<th>(0, 0)</th>',
                                '<td colspan="3">(0, 1)</td>',
                                '<td><br></td>',
                            '</tr>',
                        '</thead>',
                        '<tbody>',
                            '<tr style="background-color: green;">',
                                '<td style="background-color: blue;">(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>[](1, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<th>(2, 0)</th>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(3, 0)</td>',
                                '<td style="background-color: yellow;" rowspan="3">(3, 2)</td>',
                                '<td>(3, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td rowspan="3">(4, 1)</td>',
                                '<td>(4, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(5, 0)</td>',
                                '<td>(5, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(6, 0)</td>',
                                '<td>(6, 2)</td>',
                                '<td>(6, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(7, 0)</td>',
                                '<td colspan="2" rowspan="2">(7, 1)</td>',
                                '<td>(7, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(8, 0)</td>',
                                '<td>(8, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2" rowspan="2">(9, 0)</td>',
                                '<td>(9, 2)</td>',
                                '<td>(9, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(10, 2)</td>',
                                '<td>(10, 3)</td>',
                                '<td><br></td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
    });
    describe('deleteRow', () => {
        it('should remove the first row', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0,[] 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>[](1, 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a row in the middle', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1,[] 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>[](2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove the last row', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2,[] 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>[](1, 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove the table with a paragraph before', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<p>abc</p>',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0,[] 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<p>abc[]</p>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove the table with a paragraph after', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0,[] 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                    '<p>abc</p>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<p>[]abc</p>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove the table with a paragraph before and a paragraph after', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<p>abc</p>',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0,[] 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                    '<p>def</p>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<p>abc</p>',
                    '<p>[]def</p>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a row starting rowspans', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td rowspan="3">(1, 0)</td>',
                                '<td>(1,[] 1)</td>',
                                '<td rowspan="3">(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 1)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 1)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td rowspan="2"><br></td>',
                                '<td>[](2, 1)</td>',
                                '<td rowspan="2"><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 1)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a row traversing rowspans', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="3">(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td rowspan="3">(0, 2)</td>',
                                '<td rowspan="3">(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1,[] 1)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 1)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2">(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td rowspan="2">(0, 2)</td>',
                                '<td rowspan="2">(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](2, 1)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a row ending rowspans', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="3">(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td rowspan="3">(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 1)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, []1)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2">(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td rowspan="2">(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 1)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>[](3, 1)</td>',
                                '<td>(3, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a row starting colspan/rowspan hybrids', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1,[] 0)</td>',
                                '<td colspan="2" rowspan="3">(1, 1)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 1)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](2, 0)</td>',
                                '<td colspan="2" rowspan="2"><br></td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 1)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a row traversing colspan/rowspan hybrids', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td colspan="2" rowspan="3">(0, 1)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1,[] 0)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td colspan="2" rowspan="2">(0, 1)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>[](2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a row ending colspan/rowspan hybrids', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td colspan="2" rowspan="3">(1, 1)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3,[] 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 1)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td colspan="2" rowspan="2">(1, 1)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 1)</td>',
                                '<td>(4, 2)</td>',
                                '<td>[](4, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a row from within a colspan/rowspan hybrid', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td colspan="3" rowspan="3">(1,[] 1)</td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 1)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                                '<td>(4, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteRow');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td colspan="3" rowspan="2">[]<br></td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 1)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                                '<td>(4, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
    });
    describe('deleteColumn', () => {
        it('should remove the first column', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0,[] 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>[](0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a column in the middle', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1,[] 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>[](1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove the last column', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>[](0, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>[](0, 1)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove the table with a paragraph before', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<p>abc</p>',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1,[] 0)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<p>abc[]</p>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove the table with a paragraph after', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1,[] 0)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                    '<p>abc</p>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<p>[]abc</p>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove the table with a paragraph before and a paragraph after', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<p>abc</p>',
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1,[] 0)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                    '<p>def</p>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<p>abc</p>',
                    '<p>[]def</p>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a column starting colspans', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td colspan="3">(0, 1)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1,[] 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td colspan="3">(2, 1)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td colspan="2"><br></td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>[](1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td colspan="2"><br></td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a column traversing colspans', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="3">(0, 0)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1,[] 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="3">(2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="2">(0, 0)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>[](1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a column ending colspans', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="3">(0, 0)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1,[] 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="3">(2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="2">(0, 0)</td>',
                                '<td>(0, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>[](1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td colspan="2">(2, 0)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a column starting colspan/rowspan hybrids', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1,[] 1)</td>',
                                '<td>(1, 2)</td>',
                                '<td>(1, 3)</td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td colspan="3" rowspan="2">(2, 1)</td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 1)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                                '<td>(4, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>[](1, 2)</td>',
                                '<td>(1, 3)</td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td colspan="2" rowspan="2"><br></td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                                '<td>(4, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a column traversing colspan/rowspan hybrids', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td colspan="3" rowspan="2">(0, 1)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2,[] 2)</td>',
                                '<td>(2, 3)</td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>(3, 3)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td colspan="2" rowspan="2">(0, 1)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>[](2, 3)</td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 3)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a column ending colspan/rowspan hybrids', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td colspan="3" rowspan="2">(0, 1)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2,[] 3)</td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>(3, 3)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td colspan="2" rowspan="2">(0, 1)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>[](2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
        it('should remove a column from within a colspan/rowspan hybrid', async () => {
            /* eslint-disable prettier/prettier */
            await testEditor(BasicEditor, {
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 1)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td colspan="3" rowspan="3">(1,[] 1)</td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 1)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                                '<td>(4, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('deleteColumn');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>(0, 0)</td>',
                                '<td>(0, 2)</td>',
                                '<td>(0, 3)</td>',
                                '<td>(0, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td colspan="2" rowspan="3">[]<br></td>',
                                '<td>(1, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 4)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(4, 0)</td>',
                                '<td>(4, 2)</td>',
                                '<td>(4, 3)</td>',
                                '<td>(4, 4)</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
            });
            /* eslint-enable prettier/prettier */
        });
    });
    describe('mergeCells', () => {
        it('should merge two adjacent cells together', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>a[b</td>',
                                '<td>c]d</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('mergeCells');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="2">a[b<br>c]d</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should merge four adjacent cells together', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>ab</td>',
                                '<td>c[d</td>',
                                '<td>ef</td>',
                                '<td>gh</td>',
                                '<td>i]j</td>',
                                '<td>kl</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('mergeCells');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>ab</td>',
                                '<td colspan="4">c[d<br>ef<br>gh<br>i]j</td>',
                                '<td>kl</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should NOT merge two cells, the first of which has a rowspan', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2">a[b</td>',
                                '<td>c]d</td>',
                            '</tr>',
                            '<tr>',
                                '<td>ef</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('mergeCells');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td rowspan="2">a[b</td>',
                                '<td>c]d</td>',
                            '</tr>',
                            '<tr>',
                                '<td>ef</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should NOT merge two cells, the second of which has a rowspan', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>a[b</td>',
                                '<td rowspan="2">c]d</td>',
                            '</tr>',
                            '<tr>',
                                '<td>ef</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('mergeCells');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>a[b</td>',
                                '<td rowspan="2">c]d</td>',
                            '</tr>',
                            '<tr>',
                                '<td>ef</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
        it('should NOT merge three cells, the second of which has a rowspan', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>a[b</td>',
                                '<td rowspan="2">cd</td>',
                                '<td>e]f</td>',
                            '</tr>',
                            '<tr>',
                                '<td>gh</td>',
                                '<td>ij</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('mergeCells');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>a[b</td>',
                                '<td rowspan="2">cd</td>',
                                '<td>e]f</td>',
                            '</tr>',
                            '<tr>',
                                '<td>gh</td>',
                                '<td>ij</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
    });
    describe('unmergeCells', () => {
        it('should unmerge two adjacent cells', async () => {
            await testEditor(BasicEditor, {
                /* eslint-disable prettier/prettier */
                contentBefore: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td colspan="2">a[bc]d</td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                stepFunction: async (editor: BasicEditor) => {
                    await editor.execCommand('unmergeCells');
                },
                contentAfter: [
                    '<table>',
                        '<tbody>',
                            '<tr>',
                                '<td>a[bc]d</td>',
                                '<td><br></td>',
                            '</tr>',
                        '</tbody>',
                    '</table>',
                ].join(''),
                /* eslint-enable prettier/prettier */
            });
        });
    });
});
