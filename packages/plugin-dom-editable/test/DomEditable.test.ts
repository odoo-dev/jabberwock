import { expect } from 'chai';
import { spy } from 'sinon';
import { DomEditable } from '../src/DomEditable';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Char } from '../../plugin-char/src/Char';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { setSelection, nextTick, triggerEvent, triggerEvents } from './eventNormalizerUtils';
import { Keymap, Platform } from '../../plugin-keymap/src/Keymap';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { LineBreak } from '../../plugin-linebreak/src/LineBreak';
import { renderTextualSelection } from '../../utils/src/testUtils';
import { VNode } from '../../core/src/VNodes/VNode';
import { parseEditable, createEditable } from '../../utils/src/configuration';

async function selectAllWithKeyA(container: HTMLElement): Promise<void> {
    triggerEvent(container.querySelector('[contenteditable]'), 'keydown', {
        key: 'Control',
        code: 'ControlLeft',
        ctrlKey: true,
    });
    await nextTick();
    await nextTick();
    const ev = triggerEvent(container.querySelector('[contenteditable]'), 'keydown', {
        key: 'a',
        code: 'KeyQ',
        ctrlKey: true,
    });
    if (!ev.defaultPrevented) {
        setSelection(
            container.querySelector('[contenteditable]').firstChild.firstChild,
            0,
            container.querySelector('[contenteditable]').lastChild.lastChild,
            4,
        );
    }
    await nextTick();
    await nextTick();
}

const container = document.createElement('div');
container.classList.add('container');
let section: HTMLElement;

describe('DomEditable', () => {
    beforeEach(() => {
        document.body.appendChild(container);
        section = document.createElement('section');
        container.appendChild(section);
    });
    afterEach(() => {
        document.body.removeChild(container);
        container.innerHTML = '';
    });

    describe('configuration', () => {
        it('should get a default editable', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> =>
                            createEditable(editor),
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            await editor.start();
            expect(container.innerHTML).to.equal(
                '<jw-editor><jw-editable style="display: block;" contenteditable="true"><br></jw-editable></jw-editor>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<section></section>');
        });
        it('should use the target of DomLayout as editable', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> =>
                            parseEditable(editor, section),
                    },
                ],
                componentZones: [['editable', ['main']]],
            });

            await editor.start();
            expect(container.innerHTML).to.equal(
                '<jw-editor><section contenteditable="true"><br></section></jw-editor>',
            );
            await editor.stop();
            expect(container.innerHTML).to.equal('<section></section>');
        });
        it('should automatically set the range in the editable', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> =>
                            createEditable(editor, true),
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            section.ownerDocument.getSelection().removeAllRanges();
            await editor.start();
            renderTextualSelection();
            expect(container.querySelector('jw-editable').innerHTML).to.deep.equal('[]<br>');
            await editor.stop();
        });
        it('should automatically keep the range of the DomLayout target', async () => {
            const editor = new JWEditor();
            editor.load(Char);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> =>
                            parseEditable(editor, section, true),
                    },
                ],
                componentZones: [['editable', ['main']]],
            });

            section.ownerDocument.getSelection().removeAllRanges();
            section.innerHTML = '<p>abcdef</p>';
            setSelection(section.firstChild.firstChild, 1, section.firstChild.firstChild, 2);

            await editor.start();
            renderTextualSelection();
            expect(container.querySelector('section').innerHTML).to.deep.equal('<p>a[b]cdef</p>');

            await editor.stop();
        });
    });
    describe('_onNormalizedEvent', () => {
        let commandNames: string[];
        let editor: JWEditor;
        afterEach(async () => {
            return editor.stop();
        });
        describe('handle user events with EventNormalizer', () => {
            beforeEach(async () => {
                editor = new JWEditor();
                editor.load(Char);
                editor.load(LineBreak);
                editor.load(DomEditable);
                editor.configure(DomLayout, {
                    location: [section, 'replace'],
                    components: [
                        {
                            id: 'editable',
                            render: async (editor: JWEditor): Promise<VNode[]> =>
                                parseEditable(editor, section),
                        },
                    ],
                    componentZones: [['editable', ['main']]],
                });
                section.innerHTML = '<div>abcd</div>';
                setSelection(section.firstChild.firstChild, 2, section.firstChild.firstChild, 2);
                await editor.start();
                commandNames = [];
                const execCommand = editor.execCommand;
                editor.execCommand = async (commandName: string, params: object): Promise<void> => {
                    commandNames.push(commandName);
                    return execCommand.call(editor, commandName, params);
                };
            });
            it('enter in the middle of the word', async () => {
                const p = container.querySelector('section').firstChild;
                const text = p.firstChild;
                setSelection(text, 2, text, 2);
                await nextTick();
                triggerEvent(container.querySelector('section'), 'keydown', {
                    key: 'Enter',
                    code: 'Enter',
                });
                triggerEvent(container.querySelector('section'), 'beforeInput', {
                    inputType: 'insertParagraph',
                });

                const newText = document.createTextNode('ab');
                p.insertBefore(newText, text);
                text.textContent = 'cd';
                const newP = document.createElement('p');
                container.querySelector('section').appendChild(newP);
                newP.appendChild(text);
                setSelection(text, 0, text, 0);

                triggerEvent(container.querySelector('section'), 'input', {
                    inputType: 'insertParagraph',
                });
                await nextTick();
                await nextTick();

                expect(commandNames.join(',')).to.equal('insertParagraphBreak');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div>ab</div><div>cd</div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').lastChild.lastChild,
                    anchorOffset: 0,
                    focusNode: container.querySelector('section').lastChild.lastChild,
                    focusOffset: 0,
                });
            });
            it('shift + enter in the middle of a word', async () => {
                const p = container.querySelector('section').firstChild;
                const text = p.firstChild;
                setSelection(text, 2, text, 2);
                await nextTick();
                triggerEvent(container.querySelector('section'), 'keydown', {
                    key: 'Enter',
                    code: 'Enter',
                });
                triggerEvent(container.querySelector('section'), 'beforeInput', {
                    inputType: 'insertLineBreak',
                });

                const newText = document.createTextNode('ab');
                p.insertBefore(newText, text);
                text.textContent = 'cd';
                const br = document.createElement('br');
                p.insertBefore(br, text);
                setSelection(text, 0, text, 0);

                triggerEvent(container.querySelector('section'), 'input', {
                    inputType: 'insertLineBreak',
                });
                await nextTick();
                await nextTick();

                expect(commandNames.join(',')).to.equal('insertLineBreak,insert');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div>ab<br>cd</div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild,
                    anchorOffset: 2,
                    focusNode: container.querySelector('section').firstChild,
                    focusOffset: 2,
                });
            });
            it('should insert char in a word', async () => {
                // key: o
                await triggerEvents([
                    [
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 2 },
                            'anchor': { 'nodeId': 2, 'offset': 2 },
                        },
                    ],
                    [
                        { 'type': 'keydown', 'key': 'o', 'code': 'KeyO' },
                        { 'type': 'keypress', 'key': 'o', 'code': 'KeyO' },
                        { 'type': 'beforeinput', 'data': 'o', 'inputType': 'insertText' },
                        { 'type': 'input', 'data': 'o', 'inputType': 'insertText' },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'abocd',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 3 },
                            'anchor': { 'nodeId': 2, 'offset': 3 },
                        },
                    ],
                    [{ 'type': 'keyup', 'key': 'o', 'code': 'KeyO' }],
                ]);

                expect(commandNames.join(',')).to.equal('insertText');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div>abocd</div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild.firstChild,
                    anchorOffset: 3,
                    focusNode: container.querySelector('section').firstChild.firstChild,
                    focusOffset: 3,
                });
            });
            it('select all: ctrl + a', async () => {
                await selectAllWithKeyA(container);
                expect(commandNames.join(',')).to.equal('selectAll');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div>abcd</div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild.firstChild,
                    anchorOffset: 0,
                    focusNode: container.querySelector('section').firstChild.firstChild,
                    focusOffset: 4,
                });
            });
            it('arrow', async () => {
                triggerEvent(container.querySelector('section'), 'keydown', {
                    key: 'ArrowLeft',
                    code: 'ArrowLeft',
                });
                setSelection(
                    container.querySelector('section').firstChild.firstChild,
                    1,
                    container.querySelector('section').firstChild.firstChild,
                    1,
                );
                await nextTick();
                await nextTick();

                expect(commandNames.join(',')).to.equal('setSelection');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div>abcd</div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild.firstChild,
                    anchorOffset: 1,
                    focusNode: container.querySelector('section').firstChild.firstChild,
                    focusOffset: 1,
                });
            });
            it.skip('deleteWordBackward', async () => {
                // <CTRL>+<BACKSPACE>
                await triggerEvents([
                    [
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 4 },
                            'anchor': { 'nodeId': 2, 'offset': 4 },
                        },
                    ],
                    [
                        {
                            'type': 'keydown',
                            'key': 'Control',
                            'code': 'ControlLeft',
                            'ctrlKey': true,
                        },
                    ],
                    [
                        {
                            'type': 'keydown',
                            'key': 'Backspace',
                            'code': 'Backspace',
                            'ctrlKey': true,
                        },
                        {
                            'type': 'beforeinput',
                            'data': null,
                            'inputType': 'deleteWordBackward',
                        },
                        {
                            'type': 'input',
                            'data': null,
                            'inputType': 'deleteWordBackward',
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': '',
                            'targetId': 2,
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': '',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 0 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                    [
                        {
                            'type': 'keyup',
                            'key': 'Backspace',
                            'code': 'Backspace',
                            'ctrlKey': true,
                        },
                    ],
                    [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                ]);

                expect(commandNames.join(',')).to.equal('deleteBackward');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div><br></div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild,
                    anchorOffset: 0,
                    focusNode: container.querySelector('section').firstChild,
                    focusOffset: 0,
                });
            });
            it.skip('deleteWordForward', async () => {
                // <CTRL>+<BACKSPACE>
                await triggerEvents([
                    [
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 0 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                    [
                        {
                            'type': 'keydown',
                            'key': 'Control',
                            'code': 'ControlLeft',
                            'ctrlKey': true,
                        },
                    ],
                    [
                        {
                            'type': 'keydown',
                            'key': 'Delete',
                            'code': 'Delete',
                            'ctrlKey': true,
                        },
                        {
                            'type': 'beforeinput',
                            'data': null,
                            'inputType': 'deleteWordForward',
                        },
                        {
                            'type': 'input',
                            'data': null,
                            'inputType': 'deleteWordForward',
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': '',
                            'targetId': 2,
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': '',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 0 },
                            'anchor': { 'nodeId': 2, 'offset': 0 },
                        },
                    ],
                    [
                        {
                            'type': 'keyup',
                            'key': 'Delete',
                            'code': 'Delete',
                            'ctrlKey': true,
                        },
                    ],
                    [{ 'type': 'keyup', 'key': 'Control', 'code': 'ControlLeft' }],
                ]);

                expect(commandNames.join(',')).to.equal('deleteForward');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div><br></div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild,
                    anchorOffset: 0,
                    focusNode: container.querySelector('section').firstChild,
                    focusOffset: 0,
                });
            });
            it('deleteContentBackward', async () => {
                // <CTRL>+<BACKSPACE>
                await triggerEvents([
                    [
                        {
                            'type': 'keydown',
                            'key': 'Backspace',
                            'code': 'Backspace',
                        },
                        {
                            'type': 'beforeinput',
                            'data': null,
                            'inputType': 'deleteContentBackward',
                        },
                        {
                            'type': 'input',
                            'data': null,
                            'inputType': 'deleteContentBackward',
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'acd',
                            'targetId': 2,
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'acd',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 1 },
                            'anchor': { 'nodeId': 2, 'offset': 1 },
                        },
                    ],
                    [
                        {
                            'type': 'keyup',
                            'key': 'Backspace',
                            'code': 'Backspace',
                        },
                    ],
                ]);

                expect(commandNames.join(',')).to.equal('deleteBackward');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div>acd</div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild.firstChild,
                    anchorOffset: 1,
                    focusNode: container.querySelector('section').firstChild.firstChild,
                    focusOffset: 1,
                });
            });
            it('deleteContentForward', async () => {
                // <CTRL>+<BACKSPACE>
                await triggerEvents([
                    [
                        {
                            'type': 'keydown',
                            'key': 'Delete',
                            'code': 'Delete',
                        },
                        {
                            'type': 'beforeinput',
                            'data': null,
                            'inputType': 'deleteContentForward',
                        },
                        {
                            'type': 'input',
                            'data': null,
                            'inputType': 'deleteContentForward',
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'abd',
                            'targetId': 2,
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'acd',
                            'targetId': 2,
                        },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 2 },
                            'anchor': { 'nodeId': 2, 'offset': 2 },
                        },
                    ],
                    [
                        {
                            'type': 'keyup',
                            'key': 'Delete',
                            'code': 'Delete',
                        },
                    ],
                ]);

                expect(commandNames.join(',')).to.equal('deleteForward');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div>abd</div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild.firstChild,
                    anchorOffset: 2,
                    focusNode: container.querySelector('section').firstChild.firstChild,
                    focusOffset: 2,
                });
            });
            it('deleteContentBackward (SwiftKey)', async () => {
                // key: o
                await triggerEvents([
                    [
                        { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                        {
                            'type': 'beforeinput',
                            'data': null,
                            'inputType': 'deleteContentBackward',
                        },
                        {
                            'type': 'input',
                            'data': null,
                            'inputType': 'deleteContentBackward',
                        },
                        {
                            'type': 'mutation',
                            'mutationType': 'characterData',
                            'textContent': 'acd',
                            'targetId': 2,
                        },
                        { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                        {
                            'type': 'selection',
                            'focus': { 'nodeId': 2, 'offset': 1 },
                            'anchor': { 'nodeId': 2, 'offset': 1 },
                        },
                    ],
                ]);

                expect(commandNames.join(',')).to.equal('deleteBackward');
                expect(container.innerHTML).to.equal(
                    '<jw-editor><section contenteditable="true">' +
                        '<div>acd</div>' +
                        '</section></jw-editor>',
                );
                const domSelection = section.ownerDocument.getSelection();
                expect({
                    anchorNode: domSelection.anchorNode,
                    anchorOffset: domSelection.anchorOffset,
                    focusNode: domSelection.focusNode,
                    focusOffset: domSelection.focusOffset,
                }).to.deep.equal({
                    anchorNode: container.querySelector('section').firstChild.firstChild,
                    anchorOffset: 1,
                    focusNode: container.querySelector('section').firstChild.firstChild,
                    focusOffset: 1,
                });
            });
        });
        it('should trigger a shortcut', async () => {
            editor = new JWEditor();
            editor.load(Char);
            editor.load(LineBreak);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> =>
                            parseEditable(editor, section, true),
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            section.innerHTML = '<div>abcd</div>';
            editor.configure(Keymap, { platform: Platform.PC });
            const loadables: Loadables<Keymap> = {
                shortcuts: [
                    {
                        pattern: 'CTRL+A',
                        commandId: 'command-b',
                    },
                ],
            };
            editor.load(loadables);
            await editor.start();

            editor.execCommand = (): Promise<void> => Promise.resolve();
            const execSpy = spy(editor, 'execCommand');
            await selectAllWithKeyA(container);
            const params = {
                context: editor.contextManager.defaultContext,
            };
            expect(execSpy.args).to.eql([['command-b', params]]);
        });
        it('should trigger a select all, with an other editor which have a shortcut', async () => {
            editor = new JWEditor();
            editor.load(Char);
            editor.load(LineBreak);
            const container1 = document.createElement('div');
            container.appendChild(container1);
            const section = document.createElement('section');
            container1.appendChild(section);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> =>
                            parseEditable(editor, section, true),
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            section.innerHTML = '<div>abcd</div>';
            editor.configure(Keymap, { platform: Platform.PC });
            const loadables: Loadables<Keymap> = {
                shortcuts: [
                    {
                        pattern: 'CTRL+A',
                        commandId: 'command-b',
                    },
                ],
            };
            editor.load(loadables);
            await editor.start();

            editor.execCommand = (): Promise<void> => Promise.resolve();
            const execSpy = spy(editor, 'execCommand');

            const editor2 = new JWEditor();
            editor2.load(Char);
            editor2.load(LineBreak);
            const container2 = document.createElement('div');
            container.appendChild(container2);
            const article = document.createElement('article');
            container2.appendChild(article);
            editor2.load(DomEditable);
            editor2.configure(DomLayout, {
                location: [article, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> =>
                            parseEditable(editor, article, true),
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            article.innerHTML = '<div>abcd</div>';
            await editor2.start();

            editor2.execCommand = (): Promise<void> => Promise.resolve();
            const execSpy2 = spy(editor2, 'execCommand');
            await selectAllWithKeyA(container1);
            await selectAllWithKeyA(container2);

            await editor.stop();
            await editor2.stop();

            const params = {
                context: editor.contextManager.defaultContext,
            };
            expect(execSpy.args).to.eql([['command-b', params]]);
            expect(execSpy2.args).to.eql([['selectAll', {}]]);
        });
        it('deleteContentBackward (SwiftKey) with special keymap', async () => {
            section.innerHTML = '<div>abcd</div>';
            setSelection(section.firstChild.firstChild, 2, section.firstChild.firstChild, 2);
            editor = new JWEditor();
            editor.load(Char);
            editor.load(DomEditable);
            editor.configure(DomLayout, {
                location: [section, 'replace'],
                components: [
                    {
                        id: 'editable',
                        render: async (editor: JWEditor): Promise<VNode[]> =>
                            parseEditable(editor, section),
                    },
                ],
                componentZones: [['editable', ['main']]],
            });
            editor.configure(Keymap, { platform: Platform.PC });
            editor.load(
                class A<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Keymap> = {
                        shortcuts: [
                            {
                                pattern: 'BACKSPACE',
                                commandId: 'deleteForward',
                            },
                        ],
                    };
                },
            );
            await editor.start();
            commandNames = [];
            const execCommand = editor.execCommand;
            editor.execCommand = async (commandName: string, params: object): Promise<void> => {
                commandNames.push(commandName);
                return execCommand.call(editor, commandName, params);
            };

            // key: o
            await triggerEvents([
                [
                    { 'type': 'keydown', 'key': 'Unidentified', 'code': '' },
                    {
                        'type': 'beforeinput',
                        'data': null,
                        'inputType': 'deleteContentBackward',
                    },
                    {
                        'type': 'input',
                        'data': null,
                        'inputType': 'deleteContentBackward',
                    },
                    {
                        'type': 'mutation',
                        'mutationType': 'characterData',
                        'textContent': 'acd',
                        'targetId': 2,
                    },
                    { 'type': 'keyup', 'key': 'Unidentified', 'code': '' },
                    {
                        'type': 'selection',
                        'focus': { 'nodeId': 2, 'offset': 1 },
                        'anchor': { 'nodeId': 2, 'offset': 1 },
                    },
                ],
            ]);

            expect(commandNames.join(',')).to.equal('deleteForward');
            expect(container.innerHTML).to.equal(
                '<jw-editor><section contenteditable="true">' +
                    '<div>abd</div>' +
                    '</section></jw-editor>',
            );
            const domSelection = section.ownerDocument.getSelection();
            expect({
                anchorNode: domSelection.anchorNode,
                anchorOffset: domSelection.anchorOffset,
                focusNode: domSelection.focusNode,
                focusOffset: domSelection.focusOffset,
            }).to.deep.equal({
                anchorNode: container.querySelector('section').firstChild.firstChild,
                anchorOffset: 2,
                focusNode: container.querySelector('section').firstChild.firstChild,
                focusOffset: 2,
            });
        });
    });
});
