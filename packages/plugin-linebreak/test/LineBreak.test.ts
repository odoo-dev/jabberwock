import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { LineBreakNode } from '../src/LineBreakNode';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { CharNode } from '../../plugin-char/src/CharNode';
import { LineBreak } from '../src/LineBreak';
import { describePlugin } from '../../utils/src/testUtils';
import { LineBreakXmlDomParser } from '../src/LineBreakXmlDomParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { Parser } from '../../plugin-parser/src/Parser';
import { triggerEvents } from '../../plugin-dom-editable/test/eventNormalizerUtils';

const insertLineBreak = async (editor: JWEditor): Promise<void> => {
    await editor.execCommand<LineBreak>('insertLineBreak');
};

describePlugin(LineBreak, testEditor => {
    describe('parse', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(LineBreak);
            await editor.start();
        });
        afterEach(() => {
            return editor.stop();
        });
        it('should not parse a placeholder BR node', async () => {
            const p = document.createElement('p');
            const br = document.createElement('br');
            p.appendChild(br);
            const engine = new XmlDomParsingEngine(new JWEditor());
            const result = await new LineBreakXmlDomParser(engine).parse(br);
            expect(result instanceof Array).to.be.true;
            expect(result.length).to.equal(0);
        });
        it('should not parse a placeholder BR node (with whitespace)', async () => {
            const container = document.createElement('div');
            container.innerHTML = `
            <p>
                <br>
            </p>
            `;
            const p = container.firstElementChild;
            const editor = new BasicEditor();
            await editor.start();
            const parser = editor.plugins.get(Parser).engines['dom/html'];
            const parsedVNodes = await parser.parse(p);
            expect(parsedVNodes[0].childVNodes.length).to.equal(0);
            await editor.stop();
        });
        it('should parse two BR node as one line break', async () => {
            const p = document.createElement('p');
            const br1 = document.createElement('br');
            const br2 = document.createElement('br');
            p.appendChild(br1);
            p.appendChild(br2);
            const engine = new XmlDomParsingEngine(new JWEditor());
            const lineBreak = (
                await new LineBreakXmlDomParser(engine).parse(br1)
            )[0] as LineBreakNode;
            expect(lineBreak instanceof AbstractNode).to.be.true;
            expect(lineBreak instanceof AtomicNode).to.equal(true);
        });
        it('should not parse a SPAN node', async () => {
            const engine = new XmlDomParsingEngine(new JWEditor());
            const span = document.createElement('span');
            expect(new LineBreakXmlDomParser(engine).predicate(span)).to.be.false;
        });
    });
    describe('parse & render', () => {
        it('should parse and render 2 <br> into a paragraph', async () => {
            class Custom extends BasicEditor {
                constructor(params?: { editable?: HTMLElement }) {
                    super(params);
                    const config = {
                        loadables: {
                            components: [
                                {
                                    id: 'editor',
                                    render(editor: JWEditor): Promise<VNode[]> {
                                        return editor.plugins
                                            .get(Parser)
                                            .parse(
                                                'text/html',
                                                '<jw-editor><t t-zone="main"/><t t-zone="default"/></jw-editor>',
                                            );
                                    },
                                },
                            ],
                            componentZones: [['editor', ['root']]],
                        },
                    };
                    this.configure(config);
                }
            }
            await testEditor(Custom, {
                contentBefore: '<p><br><br></p>',
                contentAfter: '<p><br><br></p>',
            });
        });
        it('should parse and render a paragraph with a placeholder BR', async () => {
            await testEditor(BasicEditor, {
                contentBefore: `
                <p>
                    <br>
                </p>`,
                contentAfter: '<p><br></p>',
            });
        });
    });
    describe('LineBreakNode', () => {
        describe('constructor', () => {
            it('should create a LineBreakNode', async () => {
                const lineBreak = new LineBreakNode();
                expect(lineBreak instanceof AtomicNode).to.equal(true);
            });
        });
        describe('clone', () => {
            it('should duplicate a LineBreakNode', async () => {
                const lineBreak = new LineBreakNode();
                const copy = lineBreak.clone();
                expect(copy).to.not.equal(lineBreak);
                expect(copy instanceof LineBreakNode).to.equal(true);
            });
        });
        describe('locate', () => {
            it('should locate where to set the selection marker at end', async () => {
                const p = new TagNode({ htmlTag: 'P' });
                const a = new CharNode({ char: 'a' });
                p.append(a);
                const lineBreak = new LineBreakNode();
                p.append(lineBreak);
                const doc = document.createElement('p');
                doc.innerHTML = 'a<br><br>';
                expect(lineBreak.locate(doc.childNodes[1], 0)).to.deep.equal([lineBreak, 'BEFORE']);
                expect(lineBreak.locate(doc.childNodes[2], 0)).to.deep.equal([lineBreak, 'AFTER']);
            });
            it('should locate where to set the selection marker inside string', async () => {
                const p = new TagNode({ htmlTag: 'P' });
                const a = new CharNode({ char: 'a' });
                p.append(a);
                const lineBreak = new LineBreakNode();
                p.append(lineBreak);
                const b = new CharNode({ char: 'b' });
                p.append(b);
                const doc = document.createElement('p');
                doc.innerHTML = 'a<br>b';
                expect(lineBreak.locate(doc.childNodes[1], 0)).to.deep.equal([lineBreak, 'BEFORE']);
            });
        });
    });
    describe('VDocument', () => {
        describe('insertLineBreak', () => {
            describe('Selection collapsed', () => {
                describe('Basic', () => {
                    it('should insert a <br> into an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]<br></p>',
                        });
                    });
                    it('should insert a <br> at the beggining of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br>[]abc</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[] abc</p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><br>[]abc</p>',
                        });
                    });
                    it('should insert a <br> within text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p>ab<br>[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab []cd</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p>ab&nbsp;<br>[]cd</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[] cd</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p>ab<br>[]&nbsp;cd</p>',
                        });
                    });
                    it('should insert a line break (2 <br>) at the end of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p>abc<br>[]<br></p>',
                        });
                    });
                });
                describe('Consecutive', () => {
                    it('should insert two <br> at the beggining of an empty paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<br></p>',
                            stepFunction: async (editor: JWEditor) => {
                                await insertLineBreak(editor);
                                await insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[<br>]</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await insertLineBreak(editor);
                                await insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><br>[]</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await insertLineBreak(editor);
                                await insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]<br></p>',
                        });
                    });
                    it('should insert two <br> at the beggining of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]abc</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await insertLineBreak(editor);
                                await insertLineBreak(editor);
                            },
                            contentAfter: '<p><br><br>[]abc</p>',
                        });
                    });
                    it('should insert two <br> within text', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>ab[]cd</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await insertLineBreak(editor);
                                await insertLineBreak(editor);
                            },
                            contentAfter: '<p>ab<br><br>[]cd</p>',
                        });
                    });
                    it('should insert two line breaks (3 <br>) at the end of a paragraph', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]</p>',
                            stepFunction: async (editor: JWEditor) => {
                                await insertLineBreak(editor);
                                await insertLineBreak(editor);
                            },
                            // the last <br> is needed to make the first one
                            // visible.
                            contentAfter: '<p>abc<br><br>[]<br></p>',
                        });
                    });
                });
                describe('Format', () => {
                    it('should insert a <br> before a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc[]<b>def</b></p>',
                            stepFunction: insertLineBreak,
                            // That selection is equivalent to []<b>
                            contentAfter: '<p>abc<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to []<b>
                            contentBefore: '<p>abc<b>[]def</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p>abc<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc <b>[]def</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p>abc&nbsp;<br><b>[]def</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>abc<b>[] def </b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p>abc<br><b>[]&nbsp;def</b></p>',
                        });
                    });
                    it('should insert a <br> after a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]def</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>abc</b><br>[]def</p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to </b>[]
                            contentBefore: '<p><b>abc[]</b>def</p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>abc</b><br>[]def</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[]</b> def</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's after a
                            // <br>).
                            contentAfter: '<p><b>abc</b><br>[]&nbsp;def</p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc []</b>def</p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible (because it's before a
                            // <br>).
                            contentAfter: '<p><b>abc&nbsp;</b><br>[]def</p>',
                        });
                    });
                    it('should insert a <br> at the beginning of a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p>[]<b>abc</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to []<b>
                            contentBefore: '<p><b>[]abc</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>[] abc</b></p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            contentAfter: '<p><br><b>[]abc</b></p>',
                        });
                    });
                    it('should insert a <br> within a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab[]cd</b></p>',
                            stepFunction: insertLineBreak,
                            contentAfter: '<p><b>ab</b><br><b>[]cd</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab []cd</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>ab&nbsp;</b><br><b>[]cd</b></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>ab[] cd</b></p>',
                            stepFunction: insertLineBreak,
                            // The space is converted to a non-breaking
                            // space so it is visible.
                            contentAfter: '<p><b>ab</b><br><b>[]&nbsp;cd</b></p>',
                        });
                    });
                    it('should insert a line break (2 <br>) at the end of a format node', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc</b>[]</p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            // That selection is equivalent to </b>[]
                            contentBefore: '<p><b>abc[]</b></p>',
                            stepFunction: insertLineBreak,
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>abc[] </b></p>',
                            stepFunction: insertLineBreak,
                            // The space should have been parsed away.
                            // The second <br> is needed to make the first
                            // one visible.
                            contentAfter: '<p><b>abc</b><br>[]<br></p>',
                        });
                    });
                });
                describe('With attributes', () => {
                    it('should insert a line break before a span with class', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore:
                                '<p><span class="a">dom to</span></p><p><span class="b">[]edit</span></p>',
                            stepFunction: insertLineBreak,
                            contentAfter:
                                '<p><span class="a">dom to</span></p><p><br><span class="b">[]edit</span></p>',
                        });
                    });
                    it('should insert a line break within a span with a bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><span><b>ab[]cd</b></span></p>',
                            stepFunction: insertLineBreak,
                            contentAfter:
                                '<p><span><b>ab</b></span><br><span><b>[]cd</b></span></p>',
                        });
                    });
                });
            });
            describe('Selection not collapsed', () => {
                it('should delete the first half of a paragraph, then insert a <br>', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[ab]cd</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]cd</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]ab[cd</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]cd</p>',
                    });
                });
                it('should delete part of a paragraph, then insert a <br>', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[bc]d</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p>a<br>[]d</p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a]bc[d</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p>a<br>[]d</p>',
                    });
                });
                it('should delete the last half of a paragraph, then insert a line break (2 <br>)', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab[cd]</p>',
                        stepFunction: insertLineBreak,
                        // the second <br> is needed to make the first one
                        // visible.
                        contentAfter: '<p>ab<br>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>ab]cd[</p>',
                        stepFunction: insertLineBreak,
                        // the second <br> is needed to make the first one
                        // visible.
                        contentAfter: '<p>ab<br>[]<br></p>',
                    });
                });
                it('should delete all contents of a paragraph, then insert a line break', async () => {
                    // Forward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[abcd]</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]<br></p>',
                    });
                    // Backward selection
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>]abcd[</p>',
                        stepFunction: insertLineBreak,
                        contentAfter: '<p><br>[]<br></p>',
                    });
                });
            });
        });
        describe('updates + DOM updates', () => {
            it('should insert a linebreak at the end then add a char', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>aaa[]</p>',
                    stepFunction: async (): Promise<void> => {
                        // insertLineBreak
                        await triggerEvents([
                            [
                                {
                                    'type': 'keydown',
                                    'key': 'Shift',
                                    'code': 'ShiftLeft',
                                    'shiftKey': true,
                                },
                            ],
                            [
                                { 'type': 'keydown', 'key': 'Enter', 'code': '', shiftKey: true },
                                { 'type': 'keypress', 'key': 'Enter', 'code': '', shiftKey: true },
                                { 'type': 'beforeinput', 'inputType': 'insertLineBreak' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'childList',
                                    'textContent': 'aaa',
                                    'targetId': 1,
                                    'addedNodes': [
                                        {
                                            'parentId': 1,
                                            'nodeValue': '<br>',
                                            'nodeType': 1,
                                            'previousSiblingId': 2,
                                        },
                                    ],
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 2, 'offset': 3 },
                                    'anchor': { 'nodeId': 2, 'offset': 3 },
                                },
                                { 'type': 'input', 'inputType': 'insertLineBreak' },
                            ],
                            [{ 'type': 'keyup', 'key': 'Enter', 'code': '', shiftKey: true }],
                            [
                                {
                                    'type': 'keyup',
                                    'key': 'Shift',
                                    'code': 'ShiftLeft',
                                    shiftKey: false,
                                },
                            ],
                        ]);
                        // insert char
                        await triggerEvents([
                            [
                                { 'type': 'keydown', 'key': 's', 'code': 's' },
                                { 'type': 'keypress', 'key': 's', 'code': 's' },
                                { 'type': 'beforeinput', 'data': 's', 'inputType': 'insertText' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'childList',
                                    'textContent': 'aaa',
                                    'targetId': 1,
                                    'removedNodes': [{ 'nodeId': 4 }],
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'childList',
                                    'textContent': 'aaa',
                                    'targetId': 1,
                                    'addedNodes': [
                                        {
                                            'parentId': 1,
                                            'nodeValue': 's',
                                            'nodeType': 1,
                                            'previousSiblingId': 3,
                                        },
                                    ],
                                },
                                {
                                    'type': 'selection',
                                    'focus': { 'nodeId': 5, 'offset': 1 },
                                    'anchor': { 'nodeId': 5, 'offset': 1 },
                                },
                                { 'type': 'input', 'data': 's', 'inputType': 'insertText' },
                            ],
                            [{ 'type': 'keyup', 'key': 's', 'code': 's' }],
                        ]);
                    },
                    contentAfter: '<p>aaa<br>s[]</p>',
                });
            });
            it('should remove the last char', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>aaa<br>s[]</p><h1>Table examples</h1>',
                    stepFunction: async (): Promise<void> => {
                        // backspace
                        await triggerEvents([
                            [
                                { 'type': 'keydown', 'key': 'Backspace', 'code': 'Backspace' },
                                { 'type': 'beforeinput', 'inputType': 'deleteContentBackward' },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'characterData',
                                    'textContent': '',
                                    'targetId': 4,
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'childList',
                                    'textContent': 'aaa',
                                    'targetId': 1,
                                    'removedNodes': [{ 'nodeId': 4 }],
                                },
                                {
                                    'type': 'mutation',
                                    'mutationType': 'childList',
                                    'textContent': 'aaa',
                                    'targetId': 1,
                                    'addedNodes': [
                                        {
                                            'parentId': 1,
                                            'nodeValue': '<br>',
                                            'nodeType': 1,
                                            'previousSiblingId': 3,
                                        },
                                    ],
                                },
                                { 'type': 'input', 'inputType': 'deleteContentBackward' },
                            ],
                            [{ 'type': 'keyup', 'key': 'Backspace', 'code': 'Backspace' }],
                        ]);
                    },
                    contentAfter: '<p>aaa<br>[]<br></p><h1>Table examples</h1>',
                });
            });
        });
    });
});
