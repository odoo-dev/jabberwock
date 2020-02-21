import { describePlugin } from '../../utils/src/testUtils';
import JWEditor from '../../core/src/JWEditor';
import { Indent, IndentParams } from '../src/Indent';
import { withRange, VRange } from '../../core/src/VRange';
import { BasicEditor } from '../../../bundles/BasicEditor';

const indent = async (editor: JWEditor): Promise<void> => await editor.execCommand('indent');
const outdent = async (editor: JWEditor): Promise<void> => await editor.execCommand('outdent');

describePlugin(Indent, testEditor => {
    describe('List', () => {
        describe('indent', () => {
            describe('with selection collapsed', () => {
                it('should not indent the first element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a[]</li>
                        <li>b</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>a[]</li>
                        <li>b</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent the last element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a</li>
                        <li>[]b</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[]b</li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should not indent further than existing identation', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[]b</li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[]b</li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent the last element of a list with proper with unordered list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ol>
                        <li>a</li>
                        <li>[]b</li>
                    </ol>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ol>
                        <li>
                            a
                            <ol>
                                <li>[]b</li>
                            </ol>
                        </li>
                    </ol>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent the middle element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a</li>
                        <li>[]b</li>
                        <li>c</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[]b</li>
                            </ul>
                        </li>
                        <li>
                            c
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should not indent if the first element of a list is selected', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>[]a</li>
                        <li>b</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>[]a</li>
                        <li>b</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent the last element of a list with sublist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a</li>
                        <li>
                            []b
                            <ul>
                                <li>c</li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>
                                    []b
                                    <ul>
                                        <li>c</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent with mixed lists', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a</li>
                        <li>
                            []b
                            <ol>
                                <li>c</li>
                            </ol>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>
                                    []b
                                    <ol>
                                        <li>c</li>
                                    </ol>
                                </li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
            });
            describe('with selection', () => {
                it('should not indent the first element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>[a]</li>
                        <li>b</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>[a]</li>
                        <li>b</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent the middle element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a</li>
                        <li>[b]</li>
                        <li>c</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[b]</li>
                            </ul>
                        </li>
                        <li>
                            c
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should not indent further than existing identation', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[b]</li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[b]</li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should not indent further than existing identation', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[b
                                    <ul>
                                        <li>c]</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[b
                                    <ul>
                                        <li>c]</li>
                                    </ul>
                                </li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent multiples list item in the middle element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a</li>
                        <li>[b</li>
                        <li>c]</li>
                        <li>d</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>[b</li>
                                <li>c]</li>
                            </ul>
                        </li>
                        <li>
                            d
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent multiples list item in the middle element of a list with sublist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a</li>
                        <li>
                            [b
                            <ul>
                                <li>c</li>
                            </ul>
                        </li>
                        <li>d]</li>
                        <li>e</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>
                                    [b
                                    <ul>
                                        <li>c</li>
                                    </ul>
                                </li>
                                <li>d]</li>
                            </ul>
                        </li>
                        <li>e</li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent with mixed lists', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                    <ul>
                        <li>a</li>
                        <li>
                            [b
                            <ol>
                                <li>]c</li>
                            </ol>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                    <ul>
                        <li>
                            a
                            <ul>
                                <li>
                                    [b
                                    <ol>
                                        <li>]c</li>
                                    </ol>
                                </li>
                            </ul>
                        </li>
                    </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should indent nested list and list with elements in a upper level than the rangestart', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>a</li>
                                <li>
                                    b
                                    <ul>
                                        <li>c</li>
                                        <li>[d</li>
                                    </ul>
                                </li>
                                <li>
                                    e
                                    <ul>
                                        <li>f</li>
                                        <li>g</li>
                                    </ul>
                                </li>
                                <li>h]</li>
                                <li>i</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: indent,
                        contentAfter: `
                            <ul>
                                <li>a</li>
                                <li>
                                    b
                                    <ul>
                                        <li>
                                            c
                                            <ul>
                                                <li>[d</li>
                                            </ul>
                                        </li>
                                        <li>
                                        e
                                        <ul>
                                            <li>f</li>
                                            <li>g</li>
                                        </ul>
                                    </li>
                                    <li>h]</li>
                                    </ul>
                                </li>
                                <li>i</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
            });
        });
        describe('outdent', () => {
            describe('with selection collapsed', () => {
                it('should outdent the last element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>[]b</li>
                                    </ul>
                                </li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>a</li>
                                <li>[]b</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should outdent the last element of a list with proper with unordered list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ol>
                                <li>
                                    a
                                    <ol>
                                        <li>[]b</li>
                                    </ol>
                                </li>
                            </ol>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ol>
                                <li>a</li>
                                <li>[]b</li>
                            </ol>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should outdent the middle element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>[]b</li>
                                    </ul>
                                </li>
                                <li>
                                    c
                                </li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>a</li>
                                <li>[]b</li>
                                <li>c</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should outdent if the first element of a list is selected', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>[]a</li>
                                <li>b</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <p>[]a</p>
                            <ul>
                                <li>b</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should outdent the last element of a list with sublist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>
                                            []b
                                            <ul>
                                                <li>c</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>a</li>
                                <li>
                                    []b
                                    <ul>
                                        <li>c</li>
                                    </ul>
                                </li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>
                                            b
                                            <ul>
                                                <li>[]c</li>
                                            </ul>
                                        </li>
                                    </ul>
                                </li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>b</li>
                                        <li>[]c</li>
                                    </ul>
                                </li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
            });
            describe('with selection', () => {
                it('should outdent the middle element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>[b]</li>
                                    </ul>
                                </li>
                                <li>
                                    c
                                </li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>a</li>
                                <li>[b]</li>
                                <li>c</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should inoutdentdent multiples list item in the middle element of a list', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>[b</li>
                                        <li>c]</li>
                                    </ul>
                                </li>
                                <li>
                                    d
                                </li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>a</li>
                                <li>[b</li>
                                <li>c]</li>
                                <li>d</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should outdent multiples list item in the middle element of a list with sublist', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>
                                            [b
                                            <ul>
                                                <li>c</li>
                                            </ul>
                                        </li>
                                        <li>d]</li>
                                    </ul>
                                </li>
                                <li>e</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>a</li>
                                <li>
                                    [b
                                    <ul>
                                        <li>c</li>
                                    </ul>
                                </li>
                                <li>d]</li>
                                <li>e</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>
                                            b
                                            <ul>
                                                <li>[c</li>
                                            </ul>
                                        </li>
                                        <li>d]</li>
                                    </ul>
                                </li>
                                <li>e</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>
                                    a
                                    <ul>
                                        <li>b</li>
                                        <li>[c</li>
                                    </ul>
                                </li>
                                <li>d]</li>
                                <li>e</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
                it('should outdent nested list and list with elements in a upper level than the rangestart', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: `
                            <ul>
                                <li>a</li>
                                <li>
                                    b
                                    <ul>
                                        <li>
                                            c
                                            <ul>
                                                <li>[d</li>
                                            </ul>
                                        </li>
                                        <li>
                                        e
                                        <ul>
                                            <li>f</li>
                                            <li>g</li>
                                        </ul>
                                    </li>
                                    <li>h]</li>
                                    </ul>
                                </li>
                                <li>i</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                        stepFunction: outdent,
                        contentAfter: `
                            <ul>
                                <li>a</li>
                                <li>b
                                    <ul>
                                        <li>c</li>
                                        <li>[d</li>
                                    </ul>
                                </li>
                                <li>e
                                    <ul>
                                        <li>f</li>
                                        <li>g</li>
                                    </ul>
                                </li>
                                <li>h]</li>
                                <li>i</li>
                            </ul>`.replace(/[\s\n]+/g, ''),
                    });
                });
            });
        });
    });
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
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[b</p><p><br/></p><p>e]f</p>',
                stepFunction: indent,
                contentAfter:
                    '<p>&nbsp;&nbsp; &nbsp;a[b</p>' +
                    '<p>&nbsp;&nbsp; &nbsp;</p>' +
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
                            context: {
                                range: range,
                            },
                        };
                        await editor.execCommand('indent', indentParams);
                    });
                },
                contentAfter: '&nbsp;&nbsp; &nbsp;ab<br>&nbsp;&nbsp; &nbsp;cd[]',
            });
        });
    });
    describe('outdent', async function() {
        it('should do nothing if no space at the beginning of line', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[]b<br>&nbsp;&nbsp; &nbsp;cd</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[]b<br>&nbsp;&nbsp; &nbsp;cd</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p>a[]b</p><p>&nbsp;&nbsp; &nbsp;cd</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[]b</p><p>&nbsp;&nbsp; &nbsp;cd</p>',
            });
        });
        it('should outdent when only one parent selected', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; &nbsp;a[]b</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[]b</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; a[]b</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[]b</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; &nbsp;a[b]</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[b]</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; a[b]</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[b]</p>',
            });
        });
        it('should outdent(up to 4 spaces) when selection in multiples lines', async function() {
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; &nbsp;a[b<br/>&nbsp;&nbsp; &nbsp;c]d</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[b<br>c]d</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; &nbsp;a[b<br/>&nbsp;&nbsp; c]d</p>',
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
            await testEditor(BasicEditor, {
                contentBefore: '<p>&nbsp;&nbsp; a[b<br/>&nbsp;&nbsp; &nbsp;c]d</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[b<br>c]d</p>',
            });
            await testEditor(BasicEditor, {
                contentBefore:
                    '<p>&nbsp;&nbsp; &nbsp;a[b</p>' +
                    '<p>&nbsp;&nbsp; &nbsp;</p>' +
                    '<p>&nbsp;&nbsp; &nbsp;e]f</p>',
                stepFunction: outdent,
                contentAfter: '<p>a[b</p><p><br></p><p>e]f</p>',
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
                            context: {
                                range: range,
                            },
                        };
                        await editor.execCommand('outdent', indentParams);
                    });
                },
                contentAfter: 'ab<br>cd[]',
            });
        });
    });
});
