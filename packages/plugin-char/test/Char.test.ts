import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Char } from '../src/Char';
import { CharNode } from '../src/CharNode';
import { describePlugin } from '../../utils/src/testUtils';
import { CharXmlDomParser } from '../src/CharXmlDomParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { BoldFormat } from '../../plugin-bold/src/BoldFormat';
import { ItalicFormat } from '../../plugin-italic/src/ItalicFormat';
import { Inline } from '../../plugin-inline/src/Inline';
import { Format } from '../../core/src/Format';
import { UnderlineFormat } from '../../plugin-underline/src/UnderlineFormat';
import { Modifiers } from '../../core/src/Modifiers';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';

const insertText = async function(editor: JWEditor, text: string, select = false): Promise<void> {
    await editor.execCommand<Char>('insertText', {
        text: text,
        select,
    });
};
const toggleFormat = async (editor: JWEditor, FormatClass: typeof Format): Promise<void> => {
    await editor.execCommand<Inline>('toggleFormat', {
        FormatClass: FormatClass,
    });
};

describePlugin(Char, testEditor => {
    describe('parse', () => {
        let editor: JWEditor;
        beforeEach(async () => {
            editor = new JWEditor();
            editor.load(Char);
            await editor.start();
        });
        afterEach(() => {
            editor.stop();
        });
        it('should parse a textNode', async () => {
            const engine = new XmlDomParsingEngine(new JWEditor());
            const text = document.createTextNode('abc');
            const nodes = await new CharXmlDomParser(engine).parse(text);
            expect(nodes.length).to.equal(3);
            expect(nodes[0].textContent).to.equal('a');
            expect(nodes[1].textContent).to.equal('b');
            expect(nodes[2].textContent).to.equal('c');
        });
        it('should not parse a SPAN node', async () => {
            const engine = new XmlDomParsingEngine(new JWEditor());
            const nodes = await new CharXmlDomParser(engine).parse(
                document.createElement('span'),
            )[1];
            expect(nodes).to.be.undefined;
        });
    });
    describe('CharNode', () => {
        describe('constructor', () => {
            it('should create a CharNode', async () => {
                const c = new CharNode({ char: ' ' });
                expect(c.char).to.equal(' ');
                expect(c instanceof AtomicNode).to.equal(true);
                expect(c.modifiers.length).to.equal(0);
                expect(c.length).to.equal(1);
            });
            it('should create a CharNode with format', async () => {
                const c = new CharNode({ char: ' ', modifiers: new Modifiers(BoldFormat) });
                expect(c.char).to.equal(' ');
                expect(c instanceof AtomicNode).to.equal(true);
                expect(c.modifiers.length).to.equal(1);
                expect(c.modifiers.map(m => m.constructor.name)).to.deep.equal(['BoldFormat']);
            });
            it('should throw an exception if create a CharNode with wrong value', async () => {
                expect(() => {
                    // eslint-disable-next-line no-new
                    new CharNode({ char: 'ab' });
                }).to.throw('Char', 'length greater than 1');
                expect(() => {
                    // eslint-disable-next-line no-new
                    new CharNode({ char: '' });
                }).to.throw('Char', 'empty text');
            });
        });
        describe('clone', () => {
            it('should duplicate a simple char', async () => {
                const c = new CharNode({ char: 'a' });
                const copy = c.clone();
                expect(copy).to.not.equal(c);
                expect(copy instanceof CharNode).to.equal(true);
                expect(copy.char).to.equal(c.char);
                // Remove listeners that get applied on append, to compare
                // modifiers.
                copy.modifiers.off('update');
                c.modifiers.off('update');
                expect(copy.modifiers).to.deep.equal(c.modifiers);
            });
            it('should duplicate a char with format', async () => {
                const c = new CharNode({ char: 'a' });
                c.modifiers = new Modifiers(BoldFormat);
                const copy = c.clone();
                expect(copy).to.not.equal(c);
                expect(copy.char).to.equal(c.char);
                expect(copy.modifiers.length).to.equal(1, 'copy now has one format');
                expect(copy.modifiers.map(m => m.constructor.name)).to.deep.equal(
                    ['BoldFormat'],
                    'copy is now bold',
                );
            });
            it('should mark as italic a duplicate char', async () => {
                const c = new CharNode({ char: 'a' });
                const copy = c.clone();
                copy.modifiers = new Modifiers(ItalicFormat);
                expect(copy.modifiers.length).to.equal(1, 'copy now has one format');
                expect(copy.modifiers.map(m => m.constructor.name)).to.deep.equal(
                    ['ItalicFormat'],
                    'copy is now italic',
                );
                expect(c.modifiers.length).to.equal(0, 'original char is not italic');
            });
            it('should update the format for a duplicate char', async () => {
                const c = new CharNode({ char: 'a' });
                const copy = c.clone();
                copy.modifiers = new Modifiers(ItalicFormat);
                expect(copy.modifiers.length).to.equal(1, 'copy now has one format');
                expect(copy.modifiers.map(m => m.constructor.name)).to.deep.equal(
                    ['ItalicFormat'],
                    'copy is now italic',
                );
                expect(c.modifiers.length).to.equal(0, 'original char is not italic');
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
                it('should insert char in text in a paragraph and select it', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<p>a[]c</p>',
                        stepFunction: (editor: JWEditor) => insertText(editor, 'b', true),
                        contentAfter: '<p>a[b]c</p>',
                    });
                });
                it('should delete a heading (triple click char)', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<h1>[abc</h1><p>]def</p>',
                        stepFunction: (editor: JWEditor) => insertText(editor, 'g'),
                        contentAfter: '<h1>g[]def</h1>',
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
                            await toggleFormat(editor, UnderlineFormat);
                            await toggleFormat(editor, BoldFormat);
                            await insertText(editor, 'b');
                        },
                        contentAfter: '<b><u>b[]</u></b>a',
                    });
                });
            });
        });
    });
});
