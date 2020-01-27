import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { InsertTextParams, Char } from '../Char';
import { CharNode } from '../CharNode';
import { BoldFormat } from '../../plugin-bold/BoldFormat';
import { ItalicFormat } from '../../plugin-italic/ItalicFormat';
import { Parser } from '../../core/src/Parser';
import { Dom } from '../../plugin-dom/Dom';
import { Renderer } from '../../core/src/Renderer';
import { FormatName } from '../../core/src/Format';
import { FormatParams } from '../../core/src/CorePlugin';

const insertText = async function(editor, text: string): Promise<void> {
    const params: InsertTextParams = {
        text: text,
    };
    await editor.execCommand('insertText', params);
};
const applyFormat = async (editor: JWEditor, format: FormatName): Promise<void> => {
    const formatParams: FormatParams = {
        formatName: format,
    };
    await editor.execCommand('applyFormat', formatParams);
};

describe('plugin-char', () => {
    describe('parse', () => {
        let editor: JWEditor;
        let parser: Parser;
        let domRoot: Element;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.addPlugin(Char);
            await editor.start();
            domRoot = document.createElement('div');
            parser = editor.parser;
        });
        afterEach(() => {
            editor.stop();
        });
        it('should parse a textNode', async () => {
            const text = document.createTextNode('abc');
            domRoot.appendChild(text);
            const vDocument = parser.parse(domRoot);
            expect(vDocument.root.children.length).to.equal(3);
            expect((vDocument.root.children[0] as CharNode).char).to.equal('a');
            expect((vDocument.root.children[1] as CharNode).char).to.equal('b');
            expect((vDocument.root.children[2] as CharNode).char).to.equal('c');
        });
        it('should not parse a SPAN node', async () => {
            const span = document.createElement('span');
            domRoot.appendChild(span);
            const vDocument = parser.parse(domRoot);
            expect(vDocument.root.firstChild()).not.to.be.undefined;
            expect(vDocument.root.firstChild() instanceof CharNode).to.be.false;
        });
    });
    describe('renderToDom', () => {
        let editor: JWEditor;
        let renderer: Renderer;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.addPlugin(Dom);
            editor.addPlugin(Char);
            await editor.start();
            renderer = editor.renderers.dom;
        });
        afterEach(() => {
            editor.stop();
        });
        it('should insert 1 space and 1 nbsp instead of 2 spaces', async () => {
            const element = document.createElement('p');
            element.innerHTML = 'a';
            document.body.appendChild(element);
            const vDocument = editor.parser.parse(element);

            vDocument.root.append(new CharNode(' '));
            vDocument.root.append(new CharNode(' '));
            vDocument.root.append(new CharNode('b'));

            await renderer.render(vDocument, editor.editable);
            expect(editor.editable.innerHTML).to.equal('a &nbsp;b');
            element.remove();
        });
        it('should insert 2 spaces and 2 nbsp instead of 4 spaces', async () => {
            const element = document.createElement('p');
            element.innerHTML = 'a';
            document.body.appendChild(element);
            const vDocument = editor.parser.parse(element);

            vDocument.root.append(new CharNode(' '));
            vDocument.root.append(new CharNode(' '));
            vDocument.root.append(new CharNode(' '));
            vDocument.root.append(new CharNode(' '));
            vDocument.root.append(new CharNode('b'));

            await renderer.render(vDocument, editor.editable);
            expect(editor.editable.innerHTML).to.equal('a &nbsp; &nbsp;b');
            element.remove();
        });
    });
    describe('CharNode', () => {
        describe('constructor', () => {
            it('should create a CharNode', async () => {
                const c = new CharNode(' ');
                expect(c.char).to.equal(' ');
                expect(c.atomic).to.equal(true);
                expect(c.format).to.be.undefined;
                expect(c.length).to.equal(1);
            });
            it('should create a CharNode with format', async () => {
                const c = new CharNode(' ', { bold: new BoldFormat() });
                expect(c.char).to.equal(' ');
                expect(c.atomic).to.equal(true);
                expect(!!c.format.bold).to.equal(true);
                expect(Object.keys(c.format)).to.deep.equal(['bold']);
            });
            it('should throw an exception if create a CharNode with wrong value', async () => {
                expect(() => {
                    // eslint-disable-next-line no-new
                    new CharNode('ab');
                }).to.throw('Char', 'length greater than 1');
                expect(() => {
                    // eslint-disable-next-line no-new
                    new CharNode('');
                }).to.throw('Char', 'empty text');
            });
        });
        describe('shallowDuplicate', () => {
            it('should duplicate a simple char', async () => {
                const c = new CharNode('a');
                const copy = c.shallowDuplicate();
                expect(copy).to.not.equal(c);
                expect(copy instanceof CharNode).to.equal(true);
                expect(copy.char).to.equal(c.char);
                expect(copy.format).to.deep.equal(c.format);
            });
            it('should duplicate a char with format', async () => {
                const c = new CharNode('a');
                c.format = { bold: new BoldFormat() };
                const copy = c.shallowDuplicate();
                expect(copy).to.not.equal(c);
                expect(!!copy.format.bold).to.equal(true, 'copy is bold');
                expect(copy.char).to.equal(c.char);
                expect(Object.keys(copy.format)).to.deep.equal(['bold']);
            });
            it('should mark as italic a duplicate a char', async () => {
                const c = new CharNode('a');
                const copy = c.shallowDuplicate();
                copy.format = { italic: new ItalicFormat() };
                expect(!!copy.format.italic).to.equal(true, 'copy is now italic');
                expect(c.format).to.equal(undefined, 'original char is not italic');
            });
            it('should update the format for a duplicate a char', async () => {
                const c = new CharNode('a');
                const copy = c.shallowDuplicate();
                copy.format = { italic: new ItalicFormat() };
                expect(!!copy.format.italic).to.equal(true, 'copy is now italic');
                expect(c.format).to.equal(undefined, 'original char is not italic');
            });
        });
        describe('text', () => {
            it('should concat the CharNodes value', async () => {
                const a = new CharNode('a');
                const b = new CharNode('b');
                const c = new CharNode('c');
                let text = a.text();
                text = b.text(text);
                text = c.text(text);
                expect(text).to.equal('abc');
            });
        });
    });
    describe('VDocument', () => {
        describe('insertText', () => {
            describe('bold', () => {
                describe('Selection collapsed', () => {
                    it('should insert char not bold when selection in between two paragraphs', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>a</b></p><p>[]</p><p><b>b</b></p>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: '<p><b>a</b></p><p>c[]</p><p><b>b</b></p>',
                        });
                    });
                    it('should insert char bold when the selection in first position and next char is bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>[]a</b>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                            contentAfter: '<b>b[]a</b>',
                        });
                    });
                    it('should insert char not bold when the selection in first position and next char is not bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '[]a',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                            contentAfter: 'b[]a',
                        });
                    });
                    it('should insert char bold when previous char is bold and the next is not bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>a[]</b>b',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: '<b>ac[]</b>b',
                        });
                    });
                    it('should insert char not bold, when previous char is not bold, next is not bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: 'a[]b',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: 'ac[]b',
                        });
                    });
                    it('should insert char bold when previous char is bold and the next is not bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>a</b>[]b',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: '<b>ac[]</b>b',
                        });
                    });
                    it('should insert char not bold because char on a different parent should not be considered', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<p><b>a</b></p><p>[]b</p>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                            contentAfter: '<p><b>a</b></p><p>c[]b</p>',
                        });
                    });
                });

                describe('Selection not collapsed', () => {
                    it('should replace without bold when nothing bold between selection and nothing bold outside selection', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '[a]',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                            contentAfter: 'b[]',
                        });
                        await testEditor(BasicEditor, {
                            contentBefore: 'a[b]c',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'd'),
                            contentAfter: 'ad[]c',
                        });
                    });
                    it('should replace without bold when nothing bold between selection and everything bold outside selection', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>a</b>[b]<b>c</b>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'd'),
                            contentAfter: '<b>a</b>d[]<b>c</b>',
                        });
                    });
                    it('should replace with bold when anything inside the selection is bold', async () => {
                        await testEditor(BasicEditor, {
                            contentBefore: '<b>[a</b>b]<b>c</b>',
                            stepFunction: (editor: JWEditor) => insertText(editor, 'd'),
                            contentAfter: '<b>d[]c</b>',
                        });
                    });
                });
            });
        });
        describe('applyFormat', () => {
            describe('Selection collapsed', () => {
                it('should make bold the next insertion', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b>b[]</b>a',
                    });
                });
                it('should not make bold the next insertion when applyFormat 2 times', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                            await applyFormat(editor, 'bold');
                            await insertText(editor, 'b');
                        },
                        contentAfter: 'b[]a',
                    });
                });
                it('should make bold the next insertion when applyFormat 1 time, after the first char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[]',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                            await insertText(editor, 'b');
                        },
                        contentAfter: 'a<b>b[]</b>',
                    });
                });
                it('should not make bold the next insertion when applyFormat 2 times, after the first char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[]',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                            await applyFormat(editor, 'bold');
                            await insertText(editor, 'b');
                        },
                        contentAfter: 'ab[]',
                    });
                });
                it('should not make bold the next insertion when applyFormat 1 time after the first char that is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b>a</b>b[]',
                    });
                });
                it('should make bold the next insertion when applyFormat 2 times after the first char that is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                            await applyFormat(editor, 'bold');
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b>ab[]</b>',
                    });
                });
                it('should apply multiples format', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                            await applyFormat(editor, 'underline');
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b><u>b[]</u></b>a',
                    });
                });
            });

            describe('Selection not collapsed', () => {
                it('should be bold when selected is not bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[b]c',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[<b>b]</b>c',
                    });
                });
                it('should not be bold when selected is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a<b>[b]</b>c',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[b]c',
                    });
                });
                it('should be bold when one of the selected is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a<b>[b</b>c]',
                        stepFunction: async (editor: JWEditor) => {
                            await applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[<b>bc]</b>',
                    });
                });
            });
        });
    });
});
