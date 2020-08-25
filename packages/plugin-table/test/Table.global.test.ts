import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Table } from '../src/Table';
import { describePlugin, nextTick } from '../../utils/src/testUtils';
import JWEditor from '../../core/src/JWEditor';
import { Core } from '../../core/src/Core';
import { Direction } from '../../core/src/VSelection';
import { triggerEvent, setDomSelection } from '../../plugin-dom-editable/test/eventNormalizerUtils';

describePlugin(Table, testEditor => {
    describe('backspace', () => {
        describe('colspan', () => {
            it('should remove some cell and line', async () => {
                await testEditor(BasicEditor, {
                    /* eslint-disable prettier/prettier */
                    contentBefore: [
                        '<table>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)[</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td colspan="2">](3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                        '</table>',
                    ].join(''),
                    stepFunction: async (editor: JWEditor): Promise<void> => {
                        await editor.execCommand<Core>('deleteForward');
                    },
                    contentAfter: [
                        '<table>',
                            '<tbody>',
                                '<tr>',
                                    '<td>(1, 0)</td>',
                                    '<td>(1, 1)</td>',
                                    '<td>(1, 2)[]</td>',
                                    '<td><br></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><br></td>',
                                    '<td colspan="2">(3, 2)</td>',
                                    '<td>(3, 3)</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    ].join(''),
                    /* eslint-enable prettier/prettier */
                });
            });
            it('should remove some cell and line then setSelection in the colspan cell', async () => {
                await testEditor(BasicEditor, {
                    /* eslint-disable prettier/prettier */
                    contentBefore: [
                        '<table>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)[</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td colspan="2">](3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                        '</table>',
                    ].join(''),
                    stepFunction: async (editor: JWEditor): Promise<void> => {
                        await editor.execCommand<Core>('deleteForward');
                        await editor.execCommand<Core>('setSelection', {
                            vSelection: {
                                anchorNode: editor.selection.anchor.nextLeaf().nextLeaf().nextLeaf(),
                                direction: Direction.FORWARD,
                            },
                        });
                    },
                    contentAfter: [
                        '<table>',
                            '<tbody>',
                                '<tr>',
                                    '<td>(1, 0)</td>',
                                    '<td>(1, 1)</td>',
                                    '<td>(1, 2)</td>',
                                    '<td><br></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><br></td>',
                                    '<td colspan="2">[(]3, 2)</td>',
                                    '<td>(3, 3)</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    ].join(''),
                    /* eslint-enable prettier/prettier */
                });
            });
            it('should remove some cell and line then setSelection in the colspan cell use down arrow', async () => {
                await testEditor(BasicEditor, {
                    /* eslint-disable prettier/prettier */
                    contentBefore: [
                        '<table>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)[</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td colspan="2">](3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                        '</table>',
                    ].join(''),
                    stepFunction: async (editor: JWEditor): Promise<void> => {
                        await editor.execCommand<Core>('deleteForward');

                        const domTable = document.querySelector('table');
                        const td = domTable.querySelector('td:nth-child(3)');
                        triggerEvent(td, 'keydown', { key: 'ArrowDown', code: 'ArrowDown' });
                        const tdColspan = domTable.querySelector('td[colspan]');
                        setDomSelection(tdColspan, 0, tdColspan, 0);
                        triggerEvent(td, 'keyup', { key: 'ArrowDown', code: 'ArrowDown' });
                        await nextTick();
                    },
                    contentAfter: [
                        '<table>',
                            '<tbody>',
                                '<tr>',
                                    '<td>(1, 0)</td>',
                                    '<td>(1, 1)</td>',
                                    '<td>(1, 2)</td>',
                                    '<td><br></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><br></td>',
                                    '<td colspan="2">[](3, 2)</td>',
                                    '<td>(3, 3)</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    ].join(''),
                    /* eslint-enable prettier/prettier */
                });
            });
        });
        describe('rowspan', () => {
            it('should remove some cell and line', async () => {
                await testEditor(BasicEditor, {
                    /* eslint-disable prettier/prettier */
                    contentBefore: [
                        '<table>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)[</td>',
                                '<td rowspan="2">(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>](3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                        '</table>',
                    ].join(''),
                    stepFunction: async (editor: JWEditor): Promise<void> => {
                        await editor.execCommand<Core>('deleteForward');
                    },
                    contentAfter: [
                        '<table>',
                            '<tbody>',
                                '<tr>',
                                    '<td>(1, 0)</td>',
                                    '<td>(1, 1)</td>',
                                    '<td>(1, 2)[]</td>',
                                    '<td><br></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><br></td>',
                                    '<td>(3, 1)</td>',
                                    '<td>(3, 2)</td>',
                                    '<td>(3, 3)</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    ].join(''),
                    /* eslint-enable prettier/prettier */
                });
            });
            it('should remove some cell and line then setSelection in the colspan cell', async () => {
                await testEditor(BasicEditor, {
                    /* eslint-disable prettier/prettier */
                    contentBefore: [
                        '<table>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)[</td>',
                                '<td rowspan="2">(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>](3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                        '</table>',
                    ].join(''),
                    stepFunction: async (editor: JWEditor): Promise<void> => {
                        await editor.execCommand<Core>('deleteForward');
                        await editor.execCommand<Core>('setSelection', {
                            vSelection: {
                                anchorNode: editor.selection.anchor.nextLeaf(),
                                direction: Direction.FORWARD,
                            },
                        });
                    },
                    contentAfter: [
                        '<table>',
                            '<tbody>',
                                '<tr>',
                                    '<td>(1, 0)</td>',
                                    '<td>(1, 1)</td>',
                                    '<td>(1, 2)</td>',
                                    '<td>[]<br></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><br></td>',
                                    '<td>(3, 1)</td>',
                                    '<td>(3, 2)</td>',
                                    '<td>(3, 3)</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    ].join(''),
                    /* eslint-enable prettier/prettier */
                });
            });
            it('should remove some cell and line then setSelection in the colspan cell use down arrow', async () => {
                await testEditor(BasicEditor, {
                    /* eslint-disable prettier/prettier */
                    contentBefore: [
                        '<table>',
                            '<tr>',
                                '<td>(1, 0)</td>',
                                '<td>(1, 1)</td>',
                                '<td>(1, 2)[</td>',
                                '<td rowspan="2">(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 2)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>](3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>(3, 3)</td>',
                            '</tr>',
                        '</table>',
                    ].join(''),
                    stepFunction: async (editor: JWEditor): Promise<void> => {
                        await editor.execCommand<Core>('deleteForward');

                        const domTable = document.querySelector('table');
                        const td = domTable.querySelector('td:nth-child(3)');
                        triggerEvent(td, 'keydown', { key: 'ArrowDown', code: 'ArrowDown' });
                        const tdNext = domTable.querySelector('td:nth-child(4)');
                        setDomSelection(tdNext, 0, tdNext, 0);
                        triggerEvent(td, 'keyup', { key: 'ArrowDown', code: 'ArrowDown' });
                        await nextTick();
                    },
                    contentAfter: [
                        '<table>',
                            '<tbody>',
                                '<tr>',
                                    '<td>(1, 0)</td>',
                                    '<td>(1, 1)</td>',
                                    '<td>(1, 2)</td>',
                                    '<td>[]<br></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><br></td>',
                                    '<td>(3, 1)</td>',
                                    '<td>(3, 2)</td>',
                                    '<td>(3, 3)</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    ].join(''),
                    /* eslint-enable prettier/prettier */
                });
            });
            it('should remove a rowspan cells and line', async () => {
                await testEditor(BasicEditor, {
                    /* eslint-disable prettier/prettier */
                    contentBefore: [
                        '<table>',
                            '<tr>',
                                '<td>(1, 0)[</td>',
                                '<td>(1, 1)</td>',
                                '<td rowspan="2">(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>](3, 3)</td>',
                            '</tr>',
                        '</table>',
                    ].join(''),
                    stepFunction: async (editor: JWEditor): Promise<void> => {
                        await editor.execCommand<Core>('deleteForward');
                    },
                    contentAfter: [
                        '<table>',
                            '<tbody>',
                                '<tr>',
                                    '<td>(1, 0)[]</td>',
                                    '<td><br></td>',
                                    '<td><br></td>',
                                    '<td><br></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><br></td>',
                                    '<td><br></td>',
                                    '<td><br></td>',
                                    '<td>(3, 3)</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    ].join(''),
                    /* eslint-enable prettier/prettier */
                });
            });
            it('should remove a rowspan cells and line (trigger events)', async () => {
                await testEditor(BasicEditor, {
                    /* eslint-disable prettier/prettier */
                    contentBefore: [
                        '<table>',
                            '<tr>',
                                '<td>(1, 0)[</td>',
                                '<td>(1, 1)</td>',
                                '<td rowspan="2">(1, 2)</td>',
                                '<td>(1, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(2, 0)</td>',
                                '<td>(2, 1)</td>',
                                '<td>(2, 3)</td>',
                            '</tr>',
                            '<tr>',
                                '<td>(3, 0)</td>',
                                '<td>(3, 1)</td>',
                                '<td>(3, 2)</td>',
                                '<td>](3, 3)</td>',
                            '</tr>',
                        '</table>',
                    ].join(''),
                    stepFunction: async (): Promise<void> => {
                        const table = document.querySelector('table');
                        const td = table.querySelector('td');

                        triggerEvent(td, 'keydown', {
                            key: 'Backspace',
                            code: 'Backspace',
                        });
                        triggerEvent(td, 'keypress', {
                            key: 'Backspace',
                            code: 'Backspace',
                        });
                        triggerEvent(td, 'beforeinput', {
                            inputType: 'deleteContentBackward',
                        });

                        const tr1 = table.querySelector('tr');
                        const tr2 = table.querySelector('tr:nth-child(2)');
                        const tr3 = table.querySelector('tr:nth-child(3)');

                        tr1.querySelector('td:nth-child(2)').firstChild.remove();
                        tr1.querySelector('td:nth-child(3)').firstChild.remove();
                        // tr1.querySelector('td:nth-child(3)').removeAttribute('rowspan');
                        tr1.querySelector('td:nth-child(4)').firstChild.remove();

                        tr2.querySelector('td').firstChild.remove();
                        tr2.querySelector('td:nth-child(2)').firstChild.remove();
                        tr2.querySelector('td:nth-child(3)').firstChild.remove();

                        tr3.querySelector('td').firstChild.remove();
                        tr3.querySelector('td:nth-child(2)').firstChild.remove();
                        tr3.querySelector('td:nth-child(3)').firstChild.remove();

                        tr2.remove();

                        triggerEvent(td, 'input', { inputType: 'deleteContentBackward' });
                        setDomSelection(td.firstChild, 6, td.firstChild, 6);

                        await nextTick();
                    },
                    contentAfter: [
                        '<table>',
                            '<tbody>',
                                '<tr>',
                                    '<td>(1, 0)[]</td>',
                                    '<td><br></td>',
                                    '<td><br></td>',
                                    '<td><br></td>',
                                '</tr>',
                                '<tr>',
                                    '<td><br></td>',
                                    '<td><br></td>',
                                    '<td><br></td>',
                                    '<td>(3, 3)</td>',
                                '</tr>',
                            '</tbody>',
                        '</table>',
                    ].join(''),
                    /* eslint-enable prettier/prettier */
                });
            });
        });
    });
});
