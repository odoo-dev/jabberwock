import { expect } from 'chai';
import { spy } from 'sinon';
import JWEditor, { JWEditorConfig, Loadables } from '../../core/src/JWEditor';
import { Platform, Keymap, LEVEL, ConfiguredCommand } from '../src/Keymap';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { testEditor, keydown } from '../../utils/src/testUtils';

function keydownEvent(key, code, options = {}): KeyboardEvent {
    return new KeyboardEvent('keydown', { ...options, key, code });
}

describe('Keymap', () => {
    let editor: JWEditor;
    beforeEach(() => {
        editor = new JWEditor();
    });
    describe('bind', () => {
        let keymap: Keymap;
        beforeEach(async () => {
            await editor.start();
            keymap = editor.plugins.get(Keymap);
        });
        it('should bind shortcuts', () => {
            keymap.bind('a', { commandId: 'command' });
            expect(keymap.mappings[LEVEL.DEFAULT].length === 1);
        });
    });
    describe('parsePattern', () => {
        let keymap: Keymap;
        beforeEach(async () => {
            await editor.start();
            keymap = editor.plugins.get(Keymap);
        });
        it('should transform everything to uppercase modifiers', () => {
            const pattern = keymap.parsePattern('CtRl+a');
            expect('key' in pattern).to.be.true;
            if ('key' in pattern) {
                expect(pattern.key).to.deep.equal('A');
            }
            expect([...pattern.modifiers]).to.deep.equal(['CTRL']);
        });
        it('should transform CMD to META', () => {
            const pattern = keymap.parsePattern('cMd+A');
            expect([...pattern.modifiers]).to.deep.equal(['META']);
        });
        it('should get 0 modifiers and 1 key', () => {
            keymap.bind('a', { commandId: 'command' });
            const pattern = keymap.parsePattern('a');
            expect('key' in pattern).to.be.true;
            if ('key' in pattern) {
                expect(pattern.key).to.deep.equal('A');
            }
            expect([...pattern.modifiers]).to.deep.equal([]);
        });
        it('should get 1 modifiers and 1 key', () => {
            const pattern = keymap.parsePattern('cTRl+a');
            expect('key' in pattern).to.be.true;
            if ('key' in pattern) {
                expect(pattern.key).to.deep.equal('A');
            }
            expect([...pattern.modifiers]).to.deep.equal(['CTRL']);
        });
        it('should get 2 modifiers and 1 key', () => {
            const pattern = keymap.parsePattern('ctrl+sHift+a');
            expect('key' in pattern).to.be.true;
            if ('key' in pattern) {
                expect(pattern.key).to.deep.equal('A');
            }
            expect([...pattern.modifiers]).to.deep.equal(['CTRL', 'SHIFT']);
        });
        it('should get 0 modifiers and 1 code', () => {
            keymap.bind('a', { commandId: 'command' });
            const pattern = keymap.parsePattern('<KeyA>');
            expect('code' in pattern).to.be.true;
            if ('code' in pattern) {
                expect(pattern.code).to.deep.equal('KeyA');
            }
            expect([...pattern.modifiers]).to.deep.equal([]);
        });
        it('should get 1 modifiers and 1 code', () => {
            const pattern = keymap.parsePattern('cTRl+<KeyB>');
            expect('code' in pattern).to.be.true;
            if ('code' in pattern) {
                expect(pattern.code).to.deep.equal('KeyB');
            }
            expect([...pattern.modifiers]).to.deep.equal(['CTRL']);
        });
        it('should get 2 modifiers and 1 code', () => {
            const pattern = keymap.parsePattern('ctrl+sHift+<KeyC>');
            expect('code' in pattern).to.be.true;
            if ('code' in pattern) {
                expect(pattern.code).to.deep.equal('KeyC');
            }
            expect([...pattern.modifiers]).to.deep.equal(['CTRL', 'SHIFT']);
        });
        it('should normalize pattern and get 2 modifiers and 1 key', () => {
            const pattern = keymap.parsePattern('cTrl+shiFt+a');
            expect('key' in pattern).to.be.true;
            if ('key' in pattern) {
                expect(pattern.key).to.deep.equal('A');
            }
            expect([...pattern.modifiers]).to.deep.equal(['CTRL', 'SHIFT']);
        });
        it('should throw an error if there is no key', () => {
            expect(() => {
                const editor = new JWEditor();
                const keymap = editor.plugins.get(Keymap);
                keymap.parsePattern('');
            }).to.throw();
        });
    });
    describe('match', () => {
        let keymap: Keymap;
        beforeEach(async () => {
            await editor.start();
            keymap = editor.plugins.get(Keymap);
        });
        it('should match shortcuts with key', () => {
            keymap.bind('a', { commandId: 'command-a' });
            keymap.bind('b', { commandId: 'command-b' });
            const call = keymap.match(keydownEvent('a', 'KeyA'));
            const expectedCommands: ConfiguredCommand[] = [
                {
                    commandId: 'command-a',
                },
            ];
            expect(call).to.deep.equal(expectedCommands);
        });
        it('should match shortcuts with code', () => {
            keymap.bind('<KeyA>', { commandId: 'command-a' });
            keymap.bind('b', { commandId: 'command-b' });
            const call = keymap.match(keydownEvent('a', 'KeyA'));
            const expectedCommands: ConfiguredCommand[] = [
                {
                    commandId: 'command-a',
                },
            ];
            expect(call).to.deep.equal(expectedCommands);
        });
        it('should match shortcuts with command args', () => {
            const args = { propA: 'valA' };
            keymap.bind('<KeyA>', { commandId: 'command-a', commandArgs: args });
            const call = keymap.match(keydownEvent('a', 'KeyA'));
            const expectedCommands: ConfiguredCommand[] = [
                {
                    commandId: 'command-a',
                    commandArgs: args,
                },
            ];
            expect(call).to.deep.equal(expectedCommands);
        });
        it('should not trigger the map with modifiers', () => {
            const args = { propA: 'valA' };
            keymap.bind('a', { commandId: 'command-a', commandArgs: args });
            keymap.bind('ctrl  +a', { commandId: 'command-b', commandArgs: args });
            const call = keymap.match(keydownEvent('a', 'KeyA'));
            const expectedCommands: ConfiguredCommand[] = [
                {
                    commandId: 'command-a',
                    commandArgs: args,
                },
            ];
            expect(call).to.deep.equal(expectedCommands);
        });
        it('should remove a shortuct if there is no commandIdentifier', () => {
            keymap.bind('a', { commandId: 'command-a' });
            keymap.bind('a', {
                commandId: undefined,
                commandArgs: ['first unbinding'],
            });
            keymap.bind('a', { commandId: 'command-a' });
            keymap.bind('a', {
                commandId: undefined,
                commandArgs: ['second unbinding'],
            });
            const call = keymap.match(keydownEvent('a', 'KeyA'));
            const expectedCommands: ConfiguredCommand[] = [
                {
                    commandId: undefined,
                    commandArgs: ['second unbinding'],
                },
            ];
            expect(call).to.deep.equal(expectedCommands);
        });
        it('should match shortcuts only when one modifier is active', () => {
            keymap.bind('ctRl+<KeyA>', { commandId: 'command-a' });
            const call = keymap.match(keydownEvent('a', 'KeyA', { ctrlKey: true }));
            const expectedCommands: ConfiguredCommand[] = [
                {
                    commandId: 'command-a',
                },
            ];
            expect(call).to.deep.equal(expectedCommands);
        });
        it('should match shortcuts only when one modifier is active but not the others', () => {
            keymap.bind('cTrl+<KeyA>', { commandId: 'command-a' });
            const call = keymap.match(keydownEvent('a', 'KeyA', { ctrlKey: true, altKey: true }));
            expect(call).to.deep.equal([]);
        });
        it('should match shortcuts only when multiples modifier are active', () => {
            keymap.bind('Ctrl+alt+<KeyA>', { commandId: 'command-a' });
            const call = keymap.match(keydownEvent('a', 'KeyA', { ctrlKey: true, altKey: true }));
            const expectedCommands: ConfiguredCommand[] = [{ commandId: 'command-a' }];
            expect(call).to.deep.equal(expectedCommands);
        });
    });
    describe('loadShortcuts', () => {
        it('should only register default mapping for pc and other', async () => {
            editor.configure(Keymap, { platform: Platform.PC });
            editor.loadPlugin(
                class A<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Keymap> = {
                        shortcuts: [
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
                        ],
                    };
                },
            );
            await editor.start();
            const keymap = editor.plugins.get(Keymap);
            const expectedCommands = keymap.mappings[LEVEL.DEFAULT].map(
                l => l.configuredCommand.commandId,
            );
            expect(expectedCommands).to.eql(['command-all', 'command-pc']);
        });
        it('should transform ctrl to CMD if no platform on mac', async () => {
            editor.configure(Keymap, { platform: Platform.MAC });
            editor.loadPlugin(
                class A<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Keymap> = {
                        shortcuts: [
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
                        ],
                    };
                },
            );
            await editor.start();
            const keymap = editor.plugins.get(Keymap);
            const expectedCommands = keymap.mappings[LEVEL.DEFAULT].map(
                l => [...l.pattern.modifiers][0],
            );
            expect(expectedCommands).to.eql(['META', 'META', 'CTRL']);
        });
        it('should not transform ctrl to CMD if no platform on pc', async () => {
            editor.configure(Keymap, { platform: Platform.PC });
            editor.loadPlugin(
                class A<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Keymap> = {
                        shortcuts: [
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
                        ],
                    };
                },
            );
            await editor.start();
            const keymap = editor.plugins.get(Keymap);
            const expectedCommands = keymap.mappings[LEVEL.DEFAULT].map(
                l => [...l.pattern.modifiers][0],
            );
            expect(expectedCommands).to.eql(['CTRL', 'CTRL', 'CTRL']);
        });
        it('should only register default mapping for mac and other', async () => {
            editor.configure(Keymap, { platform: Platform.MAC });
            editor.loadPlugin(
                class A<T extends JWPluginConfig> extends JWPlugin<T> {
                    loadables: Loadables<Keymap> = {
                        shortcuts: [
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
                        ],
                    };
                },
            );
            await editor.start();
            const keymap = editor.plugins.get(Keymap);
            const expectedCommands = keymap.mappings[LEVEL.DEFAULT].map(
                l => l.configuredCommand.commandId,
            );
            expect(expectedCommands).to.eql(['command-all', 'command-mac']);
        });
        it('should load the config for keymap', async () => {
            editor.configure(Keymap, { platform: Platform.PC });
            const config: JWEditorConfig & Loadables<Keymap> = {
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
            };
            editor.configure(config);
            await editor.start();
            const keymap = editor.plugins.get(Keymap);
            const expectedCommands = keymap.mappings[LEVEL.USER].map(
                l => l.configuredCommand.commandId,
            );
            expect(expectedCommands).to.eql(['command-all', 'command-pc']);
        });
    });
    describe('listener', () => {
        it('should trigger a shortcut', async () => {
            await testEditor(JWEditor, {
                contentBefore: '',
                beforeStart: async editor => {
                    editor.configure(Keymap, { platform: Platform.PC });
                    const config: JWEditorConfig & Loadables<Keymap> = {
                        shortcuts: [
                            {
                                pattern: 'CTRL+A',
                                commandId: 'command-b',
                            },
                        ],
                    };
                    editor.configure(config);
                },
                stepFunction: async editor => {
                    editor.execCommand = (): Promise<void> => Promise.resolve();
                    const execSpy = spy(editor, 'execCommand');
                    await keydown(editor.editable, 'a', { ctrlKey: true });
                    const params = {
                        context: editor.contextManager.defaultContext,
                    };
                    expect(execSpy.args).to.eql([['command-b', params]]);
                },
            });
        });
        it('should trigger default shortuct', async () => {
            await testEditor(JWEditor, {
                contentBefore: '',
                beforeStart: async editor => {
                    editor.configure(Keymap, { platform: Platform.PC });
                    editor.loadPlugin(
                        class A<T extends JWPluginConfig> extends JWPlugin<T> {
                            loadables: Loadables<Keymap> = {
                                shortcuts: [
                                    {
                                        pattern: 'CTRL+A',
                                        commandId: 'command-all',
                                    },
                                ],
                            };
                        },
                    );
                },
                stepFunction: async editor => {
                    // todo: to remove when the normalizer will
                    //       not be in included by default
                    editor.eventManager.eventNormalizer._triggerEvent = (): void => {};
                    editor.execCommand = (): Promise<void> => Promise.resolve();
                    const execSpy = spy(editor, 'execCommand');
                    await keydown(editor.editable, 'a', { ctrlKey: true });
                    await keydown(editor.editable, 'b', { ctrlKey: true });
                    const params = {
                        context: editor.contextManager.defaultContext,
                    };
                    expect(execSpy.args).to.eql([['command-all', params]]);
                },
            });
        });
        it('should trigger the binding from the user config rather the default', async () => {
            await testEditor(JWEditor, {
                contentBefore: '',
                beforeStart: async editor => {
                    editor.configure(Keymap, { platform: Platform.PC });
                    editor.loadPlugin(
                        class A<T extends JWPluginConfig> extends JWPlugin<T> {
                            loadables: Loadables<Keymap> = {
                                shortcuts: [
                                    {
                                        pattern: 'CTRL+A',
                                        commandId: 'command-all',
                                    },
                                ],
                            };
                        },
                    );
                    const config: JWEditorConfig & Loadables<Keymap> = {
                        shortcuts: [
                            {
                                pattern: 'CTRL+A',
                                commandId: 'command-b',
                            },
                        ],
                    };
                    editor.configure(config);
                },
                stepFunction: async editor => {
                    // todo: to remove when the normalizer will
                    //       not be in included by default
                    editor.eventManager.eventNormalizer._triggerEvent = (): void => {};
                    editor.execCommand = (): Promise<void> => Promise.resolve();
                    const execSpy = spy(editor, 'execCommand');
                    await keydown(editor.editable, 'a', { ctrlKey: true });
                    await keydown(editor.editable, 'b', { ctrlKey: true });
                    const params = {
                        context: editor.contextManager.defaultContext,
                    };
                    expect(execSpy.args).to.eql([['command-b', params]]);
                },
            });
        });
        it('should remove the binding from the user config', async () => {
            await testEditor(JWEditor, {
                contentBefore: '',
                beforeStart: async editor => {
                    editor.configure(Keymap, { platform: Platform.PC });
                    editor.loadPlugin(
                        class A<T extends JWPluginConfig> extends JWPlugin<T> {
                            loadables: Loadables<Keymap> = {
                                shortcuts: [
                                    {
                                        pattern: 'CTRL+A',
                                        commandId: 'command-all',
                                    },
                                ],
                            };
                        },
                    );
                    const config: JWEditorConfig & Loadables<Keymap> = {
                        shortcuts: [
                            {
                                pattern: 'CTRL+A',
                                commandId: undefined,
                            },
                        ],
                    };
                    editor.configure(config);
                },
                stepFunction: async editor => {
                    // todo: to remove when the normalizer will
                    //       not be in included by default
                    editor.eventManager.eventNormalizer._triggerEvent = (): void => {};
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
