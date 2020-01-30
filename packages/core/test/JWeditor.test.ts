import JWEditor from '../src/JWEditor';
import { JWPlugin } from '../src/JWPlugin';
import { expect } from 'chai';
import { Platform } from '../src/JWEditor';
import { keydown, testEditor } from '../../utils/src/testUtils';
import { spy } from 'sinon';
describe('core', () => {
    describe('JWEditor', () => {
        describe('addPlugin', () => {
            describe('defaultShortcuts & loadConfig', () => {
                it('should only register default mapping for pc and other', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.PC;
                    editor.start();
                    editor.addPlugin(
                        class A extends JWPlugin {
                            shortcuts = [
                                {
                                    pattern: 'cTrL+A',
                                    commandId: 'command-all',
                                },
                                {
                                    platform: Platform.PC,
                                    pattern: 'aLt+b',
                                    commandId: 'command-pc',
                                },
                                {
                                    platform: Platform.MAC,
                                    pattern: 'Alt+b',
                                    commandId: 'command-mac',
                                },
                            ];
                        },
                    );
                    const expectedCommands = editor.keymaps.default.shortcuts.map(
                        l => l.boundCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-pc', 'command-all']);
                });
                it('should transform ctrl to CMD if no platform on mac', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.MAC;
                    editor.start();
                    editor.addPlugin(
                        class A extends JWPlugin {
                            shortcuts = [
                                {
                                    pattern: 'cTrL+A',
                                    commandId: 'command-all',
                                },
                                {
                                    pattern: 'ctrl+A',
                                    commandId: 'command-all',
                                },
                                {
                                    platform: Platform.PC,
                                    pattern: 'cTrL+A',
                                    commandId: 'command-all',
                                },
                                {
                                    platform: Platform.MAC,
                                    pattern: 'ctrl+a',
                                    commandId: 'command-mac',
                                },
                            ];
                        },
                    );
                    const expectedCommands = editor.keymaps.default.shortcuts.map(
                        l => [...l.pattern.modifiers][0],
                    );
                    expect(expectedCommands).to.eql(['CTRL', 'META', 'META']);
                });
                it('should not transform ctrl to CMD if no platform on pc', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.PC;
                    editor.start();
                    editor.addPlugin(
                        class A extends JWPlugin {
                            shortcuts = [
                                {
                                    pattern: 'cTrL+A',
                                    commandId: 'command-all',
                                },
                                {
                                    pattern: 'ctrl+A',
                                    commandId: 'command-all',
                                },
                                {
                                    platform: Platform.PC,
                                    pattern: 'cTrL+A',
                                    commandId: 'command-all',
                                },
                                {
                                    platform: Platform.MAC,
                                    pattern: 'ctrl+a',
                                    commandId: 'command-mac',
                                },
                            ];
                        },
                    );
                    const expectedCommands = editor.keymaps.default.shortcuts.map(
                        l => [...l.pattern.modifiers][0],
                    );
                    expect(expectedCommands).to.eql(['CTRL', 'CTRL', 'CTRL']);
                });
                it('should only register default mapping for mac and other', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.MAC;
                    editor.start();
                    editor.addPlugin(
                        class A extends JWPlugin {
                            shortcuts = [
                                {
                                    pattern: 'CtRl+a',
                                    commandId: 'command-all',
                                },
                                {
                                    platform: Platform.PC,
                                    pattern: 'alT+B',
                                    commandId: 'command-pc',
                                },
                                {
                                    platform: Platform.MAC,
                                    pattern: 'ALt+b',
                                    commandId: 'command-mac',
                                },
                            ];
                        },
                    );
                    const expectedCommands = editor.keymaps.default.shortcuts.map(
                        l => l.boundCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-mac', 'command-all']);
                });
                it('should load the config for keymap', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.PC;
                    editor.start();
                    editor.loadConfig({
                        debug: true,
                        shortcuts: [
                            {
                                pattern: 'ctrL+a',
                                commandId: 'command-all',
                            },
                            {
                                platform: Platform.PC,
                                pattern: 'ctrl+b',
                                commandId: 'command-pc',
                            },
                            {
                                platform: Platform.MAC,
                                pattern: 'CTRL+B',
                                commandId: 'command-mac',
                            },
                        ],
                    });
                    const expectedCommands = editor.keymaps.user.shortcuts.map(
                        l => l.boundCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-pc', 'command-all']);
                });
                describe('onKeydown', () => {
                    it('should trigger default shortuct', async () => {
                        await testEditor(JWEditor, {
                            contentBefore: '',
                            stepFunction: async editor => {
                                editor._platform = Platform.PC;
                                // todo: to remove when the normalizer will
                                //       not be in included by default
                                editor.eventManager.eventNormalizer._triggerEvent = (): void => {};
                                editor.addPlugin(
                                    class A extends JWPlugin {
                                        shortcuts = [
                                            {
                                                pattern: 'CTRL+A',
                                                commandId: 'command-all',
                                            },
                                        ];
                                    },
                                );
                                editor.execCommand = (): Promise<void> => Promise.resolve();
                                const execSpy = spy(editor, 'execCommand');
                                await keydown(editor.editable, 'a', { ctrlKey: true });
                                await keydown(editor.editable, 'b', { ctrlKey: true });
                                expect(execSpy.args).to.eql([['command-all', undefined]]);
                            },
                        });
                    });
                    it('should trigger the binding from the user config rather the default', async () => {
                        await testEditor(JWEditor, {
                            contentBefore: '',
                            stepFunction: async editor => {
                                editor._platform = Platform.PC;
                                // todo: to remove when the normalizer will
                                //       not be in included by default
                                editor.eventManager.eventNormalizer._triggerEvent = (): void => {};
                                editor.addPlugin(
                                    class A extends JWPlugin {
                                        shortcuts = [
                                            {
                                                pattern: 'CTRL+A',
                                                commandId: 'command-all',
                                            },
                                        ];
                                    },
                                );
                                editor.loadConfig({
                                    debug: true,
                                    shortcuts: [
                                        {
                                            pattern: 'CTRL+A',
                                            commandId: 'command-b',
                                        },
                                    ],
                                });
                                editor.execCommand = (): Promise<void> => Promise.resolve();
                                const execSpy = spy(editor, 'execCommand');
                                await keydown(editor.editable, 'a', { ctrlKey: true });
                                await keydown(editor.editable, 'b', { ctrlKey: true });
                                expect(execSpy.args).to.eql([['command-b', undefined]]);
                            },
                        });
                    });
                    it('should remove the binding from the user config', async () => {
                        await testEditor(JWEditor, {
                            contentBefore: '',
                            stepFunction: async editor => {
                                editor._platform = Platform.PC;
                                // todo: to remove when the normalizer will
                                //       not be in included by default
                                editor.eventManager.eventNormalizer._triggerEvent = (): void => {};
                                editor.addPlugin(
                                    class A extends JWPlugin {
                                        shortcuts = [
                                            {
                                                pattern: 'CTRL+A',
                                                commandId: 'command-all',
                                            },
                                        ];
                                    },
                                );
                                editor.loadConfig({
                                    debug: true,
                                    shortcuts: [
                                        {
                                            pattern: 'CTRL+A',
                                            commandId: undefined,
                                        },
                                    ],
                                });
                                editor.execCommand = (): Promise<void> => Promise.resolve();
                                const execSpy = spy(editor, 'execCommand');
                                await keydown(editor.editable, 'a', { ctrlKey: true });
                                await keydown(editor.editable, 'b', { ctrlKey: true });
                                expect(execSpy.args).to.eql([]);
                            },
                        });
                    });
                });
            });
        });
    });
});
