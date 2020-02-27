/* eslint-disable max-nested-callbacks */
import JWEditor from '../src/JWEditor';
import { JWPlugin } from '../src/JWPlugin';
import { expect } from 'chai';
import { Platform } from '../src/JWEditor';
import { keydown, testEditor } from '../../utils/src/testUtils';
import { spy } from 'sinon';
import { AbstractRenderer } from '../src/AbstractRenderer';
import { VNode } from '../src/VNodes/VNode';
import { RenderingEngine } from '../src/RenderingEngine';
describe('core', () => {
    describe('JWEditor', () => {
        describe('addPlugin', () => {
            it('should throw an error if the editor is already started', async () => {
                const editor = new JWEditor();
                await editor.start();
                expect(() => {
                    editor.addPlugin(
                        class A extends JWPlugin {
                            shortcuts = [
                                {
                                    pattern: 'cTrL+A',
                                    commandId: 'command-all',
                                },
                            ];
                        },
                    );
                }).to.throw(/plugin.*already started/i);
            });

            describe('defaultShortcuts & loadConfig', () => {
                it('should only register default mapping for pc and other', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.PC;
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
                    editor.start();
                    const expectedCommands = editor.keymaps.default.shortcuts.map(
                        l => l.boundCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-all', 'command-pc']);
                });
                it('should transform ctrl to CMD if no platform on mac', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.MAC;
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
                    editor.start();
                    const expectedCommands = editor.keymaps.default.shortcuts.map(
                        l => [...l.pattern.modifiers][0],
                    );
                    expect(expectedCommands).to.eql(['META', 'META', 'CTRL']);
                });
                it('should not transform ctrl to CMD if no platform on pc', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.PC;
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
                    editor.start();
                    const expectedCommands = editor.keymaps.default.shortcuts.map(
                        l => [...l.pattern.modifiers][0],
                    );
                    expect(expectedCommands).to.eql(['CTRL', 'CTRL', 'CTRL']);
                });
                it('should only register default mapping for mac and other', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.MAC;
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
                    editor.start();
                    const expectedCommands = editor.keymaps.default.shortcuts.map(
                        l => l.boundCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-all', 'command-mac']);
                });
                it('should load the config for keymap', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.PC;
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
                    editor.start();
                    const expectedCommands = editor.keymaps.user.shortcuts.map(
                        l => l.boundCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-all', 'command-pc']);
                });
                describe('onKeydown', () => {
                    it('should trigger default shortuct', async () => {
                        await testEditor(JWEditor, {
                            contentBefore: '',
                            beforeStart: async editor => {
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
                            },
                            stepFunction: async editor => {
                                editor._platform = Platform.PC;
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
                            },
                            stepFunction: async editor => {
                                editor._platform = Platform.PC;
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
                            },
                            stepFunction: async editor => {
                                editor._platform = Platform.PC;
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
        });
        describe('loadConfig', () => {
            it('should throw an error if the editor is already started', async () => {
                const editor = new JWEditor();
                await editor.start();
                expect(() => {
                    editor.loadConfig({
                        debug: true,
                        shortcuts: [
                            {
                                pattern: 'CTRL+A',
                                commandId: 'command-all',
                            },
                        ],
                    });
                }).to.throw(/config.*already started/i);
            });
        });
        describe('render', () => {
            it('should return a rendering or void', async () => {
                class VNodeRenderer extends AbstractRenderer<VNode> {
                    async render(node: VNode): Promise<VNode> {
                        return node;
                    }
                }
                class VNodeRenderingEngine extends RenderingEngine<VNode> {
                    static id = 'VNode';
                    static defaultRenderer = VNodeRenderer;
                }
                class VNodePlugin extends JWPlugin {
                    renderingEngines = [VNodeRenderingEngine];
                }
                const editor = new JWEditor(document.createElement('p'));
                editor.addPlugin(VNodePlugin);
                await editor.start();
                const node = new VNode();
                editor.vDocument.root.append(node);
                const rendering = await editor.render<VNode>('VNode', editor.vDocument.root);
                if (expect(rendering).to.exist) {
                    expect(rendering).to.equal(editor.vDocument.root);
                }
                const voidRendering = await editor.render<VNode>('vNode', editor.vDocument.root);
                expect(voidRendering).to.not.exist;
            });
        });
    });
});
