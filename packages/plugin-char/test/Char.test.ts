/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { InsertTextParams, FormatParams, Char } from '../Char';
import { CharNode } from '../CharNode';
import { describePlugin } from '../../utils/src/testUtils';
import { CharDomParser } from '../CharDomParser';
import { ParsingEngine } from '../../core/src/ParsingEngine';
import { DefaultDomParser } from '../../plugin-dom/DefaultDomParser';

const insertText = async function(editor, text: string): Promise<void> {
    const params: InsertTextParams = {
        text: text,
    };
    await editor.execCommand('insertText', params);
};
const applyFormat = async (
    editor: JWEditor,
    format: 'bold' | 'italic' | 'underline',
): Promise<void> => {
    const formatParams: FormatParams = {
        format: format,
    };
    await editor.execCommand('applyFormat', formatParams);
};

describePlugin(Char, testEditor => {
    describe('parse', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.addPlugin(Char);
            await editor.start();
        });
        afterEach(() => {
            editor.stop();
        });
        it('should parse a textNode', async () => {
            const text = document.createTextNode('abc');
            const engine = new ParsingEngine('dom', DefaultDomParser);
            const nodes = await new CharDomParser(engine).parse(text);
            expect(nodes.length).to.equal(3);
            expect((nodes[0] as CharNode).char).to.equal('a');
            expect((nodes[1] as CharNode).char).to.equal('b');
            expect((nodes[2] as CharNode).char).to.equal('c');
        });
        it('should not parse a SPAN node', async () => {
            const engine = new ParsingEngine('dom', DefaultDomParser);
            const nodes = await new CharDomParser(engine).parse(document.createElement('span'))[1];
            expect(nodes).to.be.undefined;
        });
    });
    describe('CharNode', () => {
        describe('constructor', () => {
            it('should create a CharNode', async () => {
                const c = new CharNode(' ');
                expect(c.char).to.equal(' ');
                expect(c.atomic).to.equal(true);
                expect(c.format).to.deep.equal({
                    bold: false,
                    italic: false,
                    underline: false,
                });
                expect(c.length).to.equal(1);
            });
            it('should create a CharNode with format', async () => {
                const c = new CharNode(' ', { bold: true });
                expect(c.char).to.equal(' ');
                expect(c.atomic).to.equal(true);
                expect(c.bold).to.equal(true);
                expect(c.format).to.deep.equal({
                    bold: true,
                    italic: false,
                    underline: false,
                });
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
        describe('clone', () => {
            it('should duplicate a simple char', async () => {
                const c = new CharNode('a');
                const copy = c.clone();
                expect(copy).to.not.equal(c);
                expect(copy instanceof CharNode).to.equal(true);
                expect(copy.char).to.equal(c.char);
                expect(copy.format).to.deep.equal(c.format);
            });
            it('should duplicate a char with format', async () => {
                const c = new CharNode('a');
                c.bold = true;
                const copy = c.clone();
                expect(copy).to.not.equal(c);
                expect(copy.format.bold).to.equal(true, 'copy is bold');
                expect(copy.char).to.equal(c.char);
                expect(copy.format).to.deep.equal(c.format);
            });
            it('should mark as italic a duplicate a char', async () => {
                const c = new CharNode('a');
                const copy = c.clone();
                copy.italic = true;
                expect(copy.format.italic).to.equal(true, 'copy is now italic');
                expect(c.format.italic).to.equal(false, 'original char is not italic');
            });
            it('should update the format for a duplicate a char', async () => {
                const c = new CharNode('a');
                const copy = c.clone();
                copy.format = { italic: true };
                expect(copy.format.italic).to.equal(true, 'copy is now italic');
                expect(c.format.italic).to.equal(false, 'original char is not italic');
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
            describe('text', () => {
                it('should insert char in empty paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]</p>',
                        stepFunction: (editor: JWEditor) => insertText(editor, 'c'),
                        contentAfter: '<p>c[]</p>',
                    });
                });
                it('should insert char after text in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]</p>',
                        stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                        contentAfter: '<p>ab[]</p>',
                    });
                });
                it('should insert char before text in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>[]c</p>',
                        stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                        contentAfter: '<p>b[]c</p>',
                    });
                });
                it('should insert char in text in a paragraph', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]c</p>',
                        stepFunction: (editor: JWEditor) => insertText(editor, 'b'),
                        contentAfter: '<p>ab[]c</p>',
                    });
                });
            });
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
                    it('should insert char bold when previous char is bold and the next is not bold (selection after bold)', async () => {
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
