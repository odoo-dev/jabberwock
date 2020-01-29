/* eslint-disable max-nested-callbacks */
import { expect } from 'chai';
import JWEditor from '../../core/src/JWEditor';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { InsertTextParams, FormatParams, Char } from '../Char';
import { CharNode } from '../CharNode';
import { VElement } from '../../core/src/VNodes/VElement';
import { VDocument } from '../../core/src/VDocument';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';
import { DomRenderer } from '../../plugin-dom/DomRenderer';
import { VDocumentMap } from '../../core/src/VDocumentMap';

const insertText = function(editor, text: string): void {
    const params: InsertTextParams = {
        text: text,
    };
    editor.execCommand('insertText', params);
};
const applyFormat = (editor: JWEditor, format: 'bold' | 'italic' | 'underline'): void => {
    const formatParams: FormatParams = {
        format: format,
    };
    editor.execCommand('applyFormat', formatParams);
};

describe('plugin-char', () => {
    describe('parse', () => {
        it('should parse a textNode', async () => {
            const text = document.createTextNode('abc');
            const context = {
                currentNode: text,
                parentVNode: new VElement('PARENT-NODE'),
                vDocument: new VDocument(new FragmentNode()),
            };
            const parsingMap = Char.parse(context)[1];
            const vNodes = Array.from(parsingMap.keys());
            expect(vNodes.length).to.equal(3);
            expect((vNodes[0] as CharNode).char).to.equal('a');
            expect((vNodes[1] as CharNode).char).to.equal('b');
            expect((vNodes[2] as CharNode).char).to.equal('c');
        });
        it('should not parse a SPAN node', async () => {
            const context = {
                currentNode: document.createElement('span'),
                vDocument: new VDocument(new FragmentNode()),
            };
            expect(Char.parse(context)).to.be.undefined;
        });
    });
    describe('renderToDom', () => {
        it('should insert 1 space and 1 nbsp instead of 2 spaces', () => {
            const element = document.createElement('p');
            element.innerHTML = 'a';
            document.body.appendChild(element);

            const editor = new BasicEditor();
            editor.start(element);
            editor.vDocument.root.append(new CharNode(' '));
            editor.vDocument.root.append(new CharNode(' '));
            editor.vDocument.root.append(new CharNode('b'));

            const renderer = new DomRenderer(editor);
            const container = document.createElement('container');
            renderer.render(new VDocumentMap(), editor.vDocument, container);
            expect(container.innerHTML).to.equal('a &nbsp;b');
            editor.stop();
            element.remove();
        });
        it('should insert 2 spaces and 2 nbsp instead of 4 spaces', () => {
            const element = document.createElement('p');
            element.innerHTML = 'a';
            document.body.appendChild(element);

            const editor = new BasicEditor();
            editor.start(element);
            editor.vDocument.root.append(new CharNode(' '));
            editor.vDocument.root.append(new CharNode(' '));
            editor.vDocument.root.append(new CharNode(' '));
            editor.vDocument.root.append(new CharNode(' '));
            editor.vDocument.root.append(new CharNode('b'));

            const renderer = new DomRenderer(editor);
            const container = document.createElement('container');
            renderer.render(new VDocumentMap(), editor.vDocument, container);
            expect(container.innerHTML).to.equal('a &nbsp; &nbsp;b');
            editor.stop();
            element.remove();
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
                c.bold = true;
                const copy = c.shallowDuplicate();
                expect(copy).to.not.equal(c);
                expect(copy.format.bold).to.equal(true, 'copy is bold');
                expect(copy.char).to.equal(c.char);
                expect(copy.format).to.deep.equal(c.format);
            });
            it('should mark as italic a duplicate a char', async () => {
                const c = new CharNode('a');
                const copy = c.shallowDuplicate();
                copy.italic = true;
                expect(copy.format.italic).to.equal(true, 'copy is now italic');
                expect(c.format.italic).to.equal(false, 'original char is not italic');
            });
            it('should update the format for a duplicate a char', async () => {
                const c = new CharNode('a');
                const copy = c.shallowDuplicate();
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
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: '<b>b[]</b>a',
                    });
                });
                it('should not make bold the next insertion when applyFormat 2 times', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: 'b[]a',
                    });
                });
                it('should make bold the next insertion when applyFormat 1 time, after the first char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: 'a<b>b[]</b>',
                    });
                });
                it('should not make bold the next insertion when applyFormat 2 times, after the first char', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: 'ab[]',
                    });
                });
                it('should not make bold the next insertion when applyFormat 1 time after the first char that is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: '<b>a</b>b[]',
                    });
                });
                it('should make bold the next insertion when applyFormat 2 times after the first char that is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '<b>a</b>[]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            applyFormat(editor, 'bold');
                            insertText(editor, 'b');
                        },
                        contentAfter: '<b>ab[]</b>',
                    });
                });
                it('should apply multiples format', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: '[]a',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                            applyFormat(editor, 'underline');
                            insertText(editor, 'b');
                        },
                        contentAfter: '<b><u>b[]</u></b>a',
                    });
                });
            });

            describe('Selection not collapsed', () => {
                it('should be bold when selected is not bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a[b]c',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[<b>b]</b>c',
                    });
                });
                it('should not be bold when selected is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a<b>[b]</b>c',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[b]c',
                    });
                });
                it('should be bold when one of the selected is bold', async () => {
                    await testEditor(BasicEditor, {
                        contentBefore: 'a<b>[b</b>c]',
                        stepFunction: (editor: JWEditor) => {
                            applyFormat(editor, 'bold');
                        },
                        contentAfter: 'a[<b>bc]</b>',
                    });
                });
            });
        });
    });
});
