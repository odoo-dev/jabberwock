import { describePlugin } from '../../utils/src/testUtils';
import JWEditor from '../../core/src/JWEditor';
import { Indent, IndentParams } from '../src/Indent';
import { withRange, VRange } from '../../core/src/VRange';
import { BasicEditor } from '../../../bundles/BasicEditor';

const indent = async (editor: JWEditor): Promise<void> => await editor.execCommand('indent');
const outdent = async (editor: JWEditor): Promise<void> => await editor.execCommand('outdent');

describePlugin(Indent, testEditor => {
    describe('indent', () => {
        it('should indent 4 spaces tab when range is collapsed', async () => {
            await testEditor(BasicEditor, {
                contentBefore: '<p>[]a</p>',
                stepFunction: indent,
                contentAfter: '<p>&nbsp;&nbsp; &nbsp;[]a</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[]</p>',
                stepFunction: indent,
                contentAfter: '<p>a &nbsp; &nbsp;[]</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[]b</p>',
                stepFunction: indent,
                contentAfter: '<p>a &nbsp; &nbsp;[]b</p>',
            });
        });
        it('should replace text with 4 spaces when only one parent selected', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[b]</p>',
                stepFunction: indent,
                contentAfter: '<p>a &nbsp; &nbsp;[]</p>',
            });
        });
        it('should replace text with 4 spaces when selection in multiples lines', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[b<br/>c]d</p>',
                stepFunction: indent,
                contentAfter: '<p>&nbsp;&nbsp; &nbsp;a[b<br>&nbsp;&nbsp; &nbsp;c]d</p>',
            });
        });

        it('should indent with 4 space when multiples paragraph', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[b</p><p>cd</p><p>e]f</p>',
                stepFunction: indent,
                contentAfter:
                    '<p>&nbsp;&nbsp; &nbsp;a[b</p>' +
                    '<p>&nbsp;&nbsp; &nbsp;cd</p>' +
                    '<p>&nbsp;&nbsp; &nbsp;e]f</p>',
            });
        });
        it('should indent with a fake range', async function() {
            await testEditor(BasicEditor, {
                contentBefore: 'ab<br>cd[]',
                stepFunction: async (editor: JWEditor) => {
                    const bNode = editor.vDocument.root.next(node => node.name === 'b');
                    const dNode = editor.vDocument.root.next(node => node.name === 'd');
                    await withRange(VRange.selecting(bNode, dNode), async range => {
                        const indentParams: IndentParams = {
                            range: range,
                        };
                        await editor.execCommand('indent', indentParams);
                    });
                },
                contentAfter: '&nbsp;&nbsp; &nbsp;ab<br>&nbsp;&nbsp; &nbsp;cd[]',
            });
        });
    });
    describe('outdent', async function() {
        it('should do nothing when only one parent selected', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; &nbsp;a[b]</p>',
                stepFunction: outdent,
                contentAfter: '<p>&nbsp;&nbsp; &nbsp;a[b]</p>',
            });
        });
        it('should outdent(up to 4 spaces) when selection in multiples lines', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; &nbsp;a[b<br/>&nbsp;&nbsp; &nbsp;c]d</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[b<br>c]d</p>',
            });
        });
        it('should outdent(up to 4 spaces) when selection in multiples paragraph', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; &nbsp;a[b<br/>&nbsp;&nbsp; &nbsp;c]d</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[b<br>c]d</p>',
            });
        });
        it('should outdent with a fake range', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '&nbsp;&nbsp;&nbsp;&nbsp;ab<br>&nbsp;&nbsp;&nbsp;&nbsp;cd[]',
                stepFunction: async (editor: JWEditor) => {
                    const bNode = editor.vDocument.root.next(node => node.name === 'b');
                    const dNode = editor.vDocument.root.next(node => node.name === 'd');
                    await withRange(VRange.selecting(bNode, dNode), async range => {
                        const indentParams: IndentParams = {
                            range: range,
                        };
                        await editor.execCommand('outdent', indentParams);
                    });
                },
                contentAfter: 'ab<br>cd[]',
            });
        });
    });
});
