import JWEditor, { Mode } from '../src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../src/JWPlugin';
import { expect } from 'chai';
import { ModeError } from '../../utils/src/errors';

describe('core', () => {
    describe('JWEditor', () => {
        describe('loadPlugin', () => {
            it('should throw an error if the editor is already started', async () => {
                const editor = new JWEditor();
                await editor.start();
                class A<T extends JWPluginConfig> extends JWPlugin<T> {}
                expect(() => {
                    editor.load(A);
                }).to.throw(ModeError, Mode.CONFIGURATION);
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
                editor.load(A, { toto: 5 });
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
                editor.load(A, { toto: 5, titi: 9 });
                editor.load(A, { toto: 3 });
                await editor.start();
                expect(configInStart.toto).to.eql(3);
                expect(configInStart.titi).to.eql(undefined);
            });
        });
        describe('loadConfig', () => {
            it('should throw an error if the editor is already started', async () => {
                const editor = new JWEditor();
                await editor.start();
                expect(() => {
                    editor.configure({});
                }).to.throw(ModeError, Mode.CONFIGURATION);
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
                editor.load(A, { toto: 5, titi: 9 });
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
                    editor.load(A, {});
                    editor.load(B);
                    editor.load(C);
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'Parser',
                        'Keymap',
                        'A',
                        'B',
                        'C',
                    ]);
                });
                it('with dependencies automatically add before the plugin', async () => {
                    const editor = new JWEditor();
                    editor.load(A);
                    editor.load(B);
                    editor.load(C);
                    editor.load(E);
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'Parser',
                        'Keymap',
                        'A',
                        'B',
                        'C',
                        'D',
                        'E',
                    ]);
                });
                it('with dependencies without overwrite previous configuration and order', async () => {
                    const editor = new JWEditor();
                    editor.load(A);
                    editor.load(B);
                    editor.load(C, { toto: 3 });
                    editor.load(F);
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'Parser',
                        'Keymap',
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
                    editor.load(A);
                    editor.load(F);
                    editor.load(B);
                    editor.load(C, { toto: 3 });
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'Parser',
                        'Keymap',
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
                    editor.load(A);
                    editor.load(E);
                    editor.load(F);
                    editor.load(B);
                    editor.load(C, { toto: 3 });
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'CorePlugin',
                        'Parser',
                        'Keymap',
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
    });
});
