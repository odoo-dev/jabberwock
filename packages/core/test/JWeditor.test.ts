import JWEditor from '../src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../src/JWPlugin';
import { expect } from 'chai';
import { Platform } from '../src/JWEditor';
import { keydown, testEditor } from '../../utils/src/testUtils';
import { spy } from 'sinon';
import { AbstractRenderer } from '../src/AbstractRenderer';
import { VNode } from '../src/VNodes/VNode';
import { RenderingEngine } from '../src/RenderingEngine';
import { Dom } from '../../plugin-dom/src/Dom';

describe('core', () => {
    describe('JWEditor', () => {
        describe('loadPlugin', () => {
            it('should throw an error if the editor is already started', async () => {
                const editor = new JWEditor();
                await editor.start();
                expect(() => {
                    editor.loadPlugin(
                        class A<T extends JWPluginConfig> extends JWPlugin<T> {
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
            it('should load a plugin configuration', async () => {
                const editor = new JWEditor();
                interface LocalConfig extends JWPluginConfig {
                    toto?: number;
                }
                let configInStart: LocalConfig;
                class A<T extends LocalConfig> extends JWPlugin<T> {
                    async start(): Promise<void> {
                        configInStart = this.configuration;
                    }
                }
                editor.loadPlugin(A, { toto: 5 });
                await editor.start();
                expect(configInStart.toto).to.eql(5);
            });
            it('should replace a plugin configuration', async () => {
                const editor = new JWEditor();
                interface LocalConfig extends JWPluginConfig {
                    toto?: number;
                    titi?: number;
                }
                let configInStart: LocalConfig;
                class A<T extends LocalConfig> extends JWPlugin<T> {
                    async start(): Promise<void> {
                        configInStart = this.configuration;
                    }
                }
                editor.loadPlugin(A, { toto: 5, titi: 9 });
                editor.loadPlugin(A, { toto: 3 });
                await editor.start();
                expect(configInStart.toto).to.eql(3);
                expect(configInStart.titi).to.eql(undefined);
            });
        });
        describe('loadPlugin & loadConfig', () => {
            describe('defaultShortcuts & loadConfig', () => {
                it('should only register default mapping for pc and other', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.PC;
                    editor.loadPlugin(
                        class A<T extends JWPluginConfig> extends JWPlugin<T> {
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
                        l => l.configuredCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-all', 'command-pc']);
                });
                it('should transform ctrl to CMD if no platform on mac', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.MAC;
                    editor.loadPlugin(
                        class A<T extends JWPluginConfig> extends JWPlugin<T> {
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
                    editor.loadPlugin(
                        class A<T extends JWPluginConfig> extends JWPlugin<T> {
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
                    editor.loadPlugin(
                        class A<T extends JWPluginConfig> extends JWPlugin<T> {
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
                        l => l.configuredCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-all', 'command-mac']);
                });
                it('should load the config for keymap', () => {
                    const editor = new JWEditor();
                    editor._platform = Platform.PC;
                    editor.configure({
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
                        l => l.configuredCommand.commandId,
                    );
                    expect(expectedCommands).to.eql(['command-all', 'command-pc']);
                });
                describe('onKeydown', () => {
                    it('should trigger default shortuct', async () => {
                        await testEditor(JWEditor, {
                            contentBefore: '',
                            beforeStart: async editor => {
                                editor._platform = Platform.PC;
                                editor.loadPlugin(
                                    class A<T extends JWPluginConfig> extends JWPlugin<T> {
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
                                // todo: to remove when the normalizer will
                                //       not be in included by default
                                editor.eventManager.eventNormalizer._triggerEvent = (): void => {};
                                editor.execCommand = (): Promise<void> => Promise.resolve();
                                const execSpy = spy(editor, 'execCommand');
                                const domPlugin = editor.plugins.get(Dom);
                                await keydown(domPlugin.editable, 'a', { ctrlKey: true });
                                await keydown(domPlugin.editable, 'b', { ctrlKey: true });
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
                                editor._platform = Platform.PC;
                                editor.loadPlugin(
                                    class A<T extends JWPluginConfig> extends JWPlugin<T> {
                                        shortcuts = [
                                            {
                                                pattern: 'CTRL+A',
                                                commandId: 'command-all',
                                            },
                                        ];
                                    },
                                );
                                editor.configure({
                                    shortcuts: [
                                        {
                                            pattern: 'CTRL+A',
                                            commandId: 'command-b',
                                        },
                                    ],
                                });
                            },
                            stepFunction: async editor => {
                                // todo: to remove when the normalizer will
                                //       not be in included by default
                                editor.eventManager.eventNormalizer._triggerEvent = (): void => {};
                                editor.execCommand = (): Promise<void> => Promise.resolve();
                                const execSpy = spy(editor, 'execCommand');
                                const domPlugin = editor.plugins.get(Dom);
                                await keydown(domPlugin.editable, 'a', { ctrlKey: true });
                                await keydown(domPlugin.editable, 'b', { ctrlKey: true });
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
                                editor.loadPlugin(
                                    class A<T extends JWPluginConfig> extends JWPlugin<T> {
                                        shortcuts = [
                                            {
                                                pattern: 'CTRL+A',
                                                commandId: 'command-all',
                                            },
                                        ];
                                    },
                                );
                                editor.configure({
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
                                const domPlugin = editor.plugins.get(Dom);
                                await keydown(domPlugin.editable, 'a', { ctrlKey: true });
                                await keydown(domPlugin.editable, 'b', { ctrlKey: true });
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
                    editor.configure({
                        shortcuts: [
                            {
                                pattern: 'CTRL+A',
                                commandId: 'command-all',
                            },
                        ],
                    });
                }).to.throw(/config.*already started/i);
            });
            it('should update a plugin configuration', async () => {
                const editor = new JWEditor();
                interface LocalConfig extends JWPluginConfig {
                    toto?: number;
                    titi?: number;
                }
                let configInStart: LocalConfig;
                class A<T extends LocalConfig> extends JWPlugin<T> {
                    async start(): Promise<void> {
                        configInStart = this.configuration;
                    }
                }
                editor.loadPlugin(A, { toto: 5, titi: 9 });
                editor.configure(A, { toto: 3 });
                await editor.start();
                expect(configInStart.toto).to.eql(3);
                expect(configInStart.titi).to.eql(9);
            });
            it('should load a new plugin configuration', async () => {
                const editor = new JWEditor();
                interface LocalConfig extends JWPluginConfig {
                    toto?: number;
                }
                let configInStart: LocalConfig;
                class A<T extends LocalConfig> extends JWPlugin<T> {
                    async start(): Promise<void> {
                        configInStart = this.configuration;
                    }
                }
                editor.configure(A, { toto: 5 });
                await editor.start();
                expect(configInStart.toto).to.eql(5);
            });
            it('should add a shortcut', async () => {
                await testEditor(JWEditor, {
                    contentBefore: '',
                    beforeStart: async editor => {
                        editor._platform = Platform.PC;
                        editor.configure({
                            shortcuts: [
                                {
                                    pattern: 'CTRL+A',
                                    commandId: 'command-b',
                                },
                            ],
                        });
                    },
                    stepFunction: async editor => {
                        editor.execCommand = (): Promise<void> => Promise.resolve();
                        const execSpy = spy(editor, 'execCommand');
                        const domPlugin = editor.plugins.get(Dom);
                        await keydown(domPlugin.editable, 'a', { ctrlKey: true });
                        const params = {
                            context: editor.contextManager.defaultContext,
                        };
                        expect(execSpy.args).to.eql([['command-b', params]]);
                    },
                });
            });
        });
        describe('start', () => {
            describe('should start all plugins in order', () => {
                interface LocalConfig extends JWPluginConfig {
                    toto?: number;
                }
                class A<T extends LocalConfig> extends JWPlugin<T> {}
                class B<T extends LocalConfig> extends JWPlugin<T> {}
                class C<T extends LocalConfig> extends JWPlugin<T> {}
                class D<T extends LocalConfig> extends JWPlugin<T> {}
                class E<T extends LocalConfig> extends JWPlugin<T> {
                    static readonly dependencies = [D];
                }
                class F<T extends LocalConfig> extends JWPlugin<T> {
                    static readonly dependencies = [D, C];
                }

                it('should start all plugins in order', async () => {
                    const editor = new JWEditor();
                    editor.loadPlugin(A, {});
                    editor.loadPlugin(B);
                    editor.loadPlugin(C);
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'A',
                        'B',
                        'C',
                    ]);
                });
                it('with dependencies automatically add before the plugin', async () => {
                    const editor = new JWEditor();
                    editor.loadPlugin(A);
                    editor.loadPlugin(B);
                    editor.loadPlugin(C);
                    editor.loadPlugin(E);
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'A',
                        'B',
                        'C',
                        'D',
                        'E',
                    ]);
                });
                it('with dependencies without overwrite previous configuration and order', async () => {
                    const editor = new JWEditor();
                    editor.loadPlugin(A);
                    editor.loadPlugin(B);
                    editor.loadPlugin(C, { toto: 3 });
                    editor.loadPlugin(F);
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'A',
                        'B',
                        'C',
                        'D',
                        'F',
                    ]);
                    const c = editor.plugins.get(C);
                    expect((c.configuration as LocalConfig).toto).to.eql(3);
                });
                it('with dependencies without overwrite previous configuration but change order', async () => {
                    const editor = new JWEditor();
                    editor.loadPlugin(A);
                    editor.loadPlugin(F);
                    editor.loadPlugin(B);
                    editor.loadPlugin(C, { toto: 3 });
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'A',
                        'D',
                        'C',
                        'F',
                        'B',
                    ]);
                    const c = editor.plugins.get(C);
                    expect((c.configuration as LocalConfig).toto).to.eql(3);
                });
                it('with dependencies without overwrite previous configuration but change order', async () => {
                    const editor = new JWEditor();
                    editor.loadPlugin(A);
                    editor.loadPlugin(E);
                    editor.loadPlugin(F);
                    editor.loadPlugin(B);
                    editor.loadPlugin(C, { toto: 3 });
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'A',
                        'D',
                        'E',
                        'C',
                        'F',
                        'B',
                    ]);
                    const c = editor.plugins.get(C);
                    expect((c.configuration as LocalConfig).toto).to.eql(3);
                });
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
                class VNodePlugin<T extends JWPluginConfig> extends JWPlugin<T> {
                    renderingEngines = [VNodeRenderingEngine];
                }
                const editor = new JWEditor();
                editor.loadPlugin(Dom, { target: document.createElement('p') });
                editor.loadPlugin(VNodePlugin);
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
