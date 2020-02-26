/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { InsertTextParams, Char } from '../Char';
import { CharNode } from '../CharNode';
import { describePlugin } from '../../utils/src/testUtils';
import { CharDomParser } from '../CharDomParser';
import { DomParsingEngine } from '../../plugin-dom/DomParsingEngine';
import { BoldFormat } from '../../plugin-bold/BoldFormat';
import { ItalicFormat } from '../../plugin-italic/ItalicFormat';
import { FormatParams } from '../../plugin-inline/Inline';
import { Constructor } from '../../utils/src/utils';
import { Format } from '../../plugin-inline/Format';
import { UnderlineFormat } from '../../plugin-underline/UnderlineFormat';

const insertText = async function(editor, text: string): Promise<void> {
    const params: InsertTextParams = {
        text: text,
    };
    await editor.execCommand('insertText', params);
};
const toggleFormat = async (editor: JWEditor, FormatClass: Constructor<Format>): Promise<void> => {
    const formatParams: FormatParams = {
        FormatClass: FormatClass,
    };
    await editor.execCommand('toggleFormat', formatParams);
};

describePlugin(Char, testEditor => {
    describe('parse', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.loadPlugin(Char);
            await editor.start();
        });
        afterEach(() => {
            editor.stop();
        });
        it('should parse a textNode', async () => {
            const engine = new DomParsingEngine(new JWEditor());
            const text = document.createTextNode('abc');
            const nodes = await new CharDomParser(engine).parse(text);
            expect(nodes.length).to.equal(3);
            expect((nodes[0] as CharNode).char).to.equal('a');
            expect((nodes[1] as CharNode).char).to.equal('b');
            expect((nodes[2] as CharNode).char).to.equal('c');
        });
        it('should not parse a SPAN node', async () => {
            const engine = new DomParsingEngine(new JWEditor());
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
                expect(c.formats.length).to.equal(0);
                expect(c.length).to.equal(1);
            });
            it('should create a CharNode with format', async () => {
                const c = new CharNode(' ', [new BoldFormat()]);
                expect(c.char).to.equal(' ');
                expect(c.atomic).to.equal(true);
                expect(c.formats.length).to.equal(1);
                expect(c.formats[0].htmlTag).to.equal('B');
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
                expect(copy.formats).to.deep.equal(c.formats);
            });
            it('should duplicate a char with format', async () => {
                const c = new CharNode('a');
                c.formats = [new BoldFormat()];
                const copy = c.clone();
                expect(copy).to.not.equal(c);
                expect(copy.char).to.equal(c.char);
                expect(copy.formats.length).to.equal(1, 'copy now has one format');
                expect(copy.formats[0].htmlTag).to.equal('B', 'copy is now bold');
            });
            it('should mark as italic a duplicate a char', async () => {
                const c = new CharNode('a');
                const copy = c.clone();
                copy.formats = [new ItalicFormat()];
                expect(copy.formats.length).to.equal(1, 'copy now has one format');
                expect(copy.formats[0].htmlTag).to.equal('I', 'copy is now italic');
                expect(c.formats.length).to.equal(0, 'original char is not italic');
            });
            it('should update the format for a duplicate a char', async () => {
                const c = new CharNode('a');
                const copy = c.clone();
                copy.formats = [new ItalicFormat()];
                expect(copy.formats.length).to.equal(1, 'copy now has one format');
                expect(copy.formats[0].htmlTag).to.equal('I', 'copy is now italic');
                expect(c.formats.length).to.equal(0, 'original char is not italic');
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
        describe('toggleFormat', () => {
            describe('Selection collapsed', () => {
                it('should make bold the next insertion', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b>b[]</b>a',
                    });
                });
                it('should not make bold the next insertion when toggleFormat 2 times', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                            await toggleFormat(editor, BoldFormat);
                            await insertText(editor, 'b');
                        },
                        contentAfter: 'b[]a',
                    });
                });
                it('should make bold the next insertion when toggleFormat 1 time, after the first char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[]',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                            await insertText(editor, 'b');
                        },
                        contentAfter: 'a<b>b[]</b>',
                    });
                });
                it('should not make bold the next insertion when toggleFormat 2 times, after the first char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[]',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                            await toggleFormat(editor, BoldFormat);
                            await insertText(editor, 'b');
                        },
                        contentAfter: 'ab[]',
                    });
                });
                it('should not make bold the next insertion when toggleFormat 1 time after the first char that is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b>a</b>b[]',
                    });
                });
                it('should make bold the next insertion when toggleFormat 2 times after the first char that is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                            await toggleFormat(editor, BoldFormat);
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b>ab[]</b>',
                    });
                });
                it('should apply multiples format', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: async (editor: JWEditor) => {
                            await toggleFormat(editor, BoldFormat);
                            await toggleFormat(editor, UnderlineFormat);
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b><u>b[]</u></b>a',
                    });
                });
            });
        });
    });
});
