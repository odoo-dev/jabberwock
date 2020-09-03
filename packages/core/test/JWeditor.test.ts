import JWEditor, { EditorStage } from '../src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../src/JWPlugin';
import { expect } from 'chai';
import { StageError } from '../../utils/src/errors';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { Layout } from '../../plugin-layout/src/Layout';
import { VRange } from '../src/VRange';
import { Char } from '../../plugin-char/src/Char';
import { RelativePosition } from '../src/VNodes/VNode';
import { Direction } from '../src/VSelection';
import { ParagraphNode } from '../../plugin-paragraph/src/ParagraphNode';
import { CharNode } from '../../plugin-char/src/CharNode';

describe('core', () => {
    describe('JWEditor', () => {
        describe('loadPlugin', () => {
            it('should throw an error if the editor is already started', async () => {
                const editor = new JWEditor();
                await editor.start();
                class A<T extends JWPluginConfig> extends JWPlugin<T> {}
                expect(() => {
                    editor.load(A);
                }).to.throw(StageError, EditorStage.CONFIGURATION);
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
                }).to.throw(StageError, EditorStage.CONFIGURATION);
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
                class G<T extends LocalConfig> extends JWPlugin<T> {
                    static readonly dependencies = [E];
                }

                it('should start all plugins in order', async () => {
                    const editor = new JWEditor();
                    editor.load(A, {});
                    editor.load(B);
                    editor.load(C);
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'Core',
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
                        'Core',
                        'Keymap',
                        'A',
                        'B',
                        'C',
                        'D',
                        'E',
                    ]);
                });
                it('with dependencies automatically add before the plugin with the sub-dependencies', async () => {
                    const editor = new JWEditor();
                    editor.load(A);
                    editor.load(B);
                    editor.load(G);
                    editor.load(C);
                    editor.load(E);
                    await editor.start();
                    const plugins = Array.from(editor.plugins.values());
                    expect(plugins.map(p => p.constructor.name)).to.eql([
                        'Core',
                        'Keymap',
                        'A',
                        'B',
                        'D',
                        'E',
                        'G',
                        'C',
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
                        'Core',
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
                        'Core',
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
                        'Core',
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
        describe('execCommand', () => {
            it('should execute a custom command and trigger plugins', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>ab[]</div>',
                    stepFunction: async editor => {
                        await editor.execCommand(async () => {
                            const layout = editor.plugins.get(Layout);
                            const domEngine = layout.engines.dom;
                            domEngine.components.editable[0].firstLeaf().remove();
                        });
                    },
                    contentAfter: '<div>b[]</div>',
                });
            });
            it('should remove a temporaryVRange after an execCommand', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<div>ab[]</div>',
                    stepFunction: async editor => {
                        await editor.execCommand(async context => {
                            const layout = editor.plugins.get(Layout);
                            const domLayout = layout.engines.dom;
                            const divider = domLayout.components.editable[0].firstChild();
                            const range = new VRange(editor, VRange.at(divider), {
                                temporary: true,
                            });
                            expect(range.start.parent).to.equal(divider);
                            await context.execCommand<Char>('insertText', {
                                text: 'c',
                                context: { range },
                            });
                            expect(range.start.parent).to.equal(undefined);
                        });
                    },
                    contentAfter: '<div>cab[]</div>',
                });
            });
        });
        describe('Memory', () => {
            it('should use the selection after switch memory slice before the first selection', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>abcdef</p>',
                    stepFunction: async (editor: JWEditor) => {
                        const engine = editor.plugins.get(Layout).engines.dom;
                        const sliceKey = editor.memory.sliceKey;
                        const p = engine.components.editable[0].firstChild();
                        let newP: ParagraphNode;
                        await editor.execCommand(() => {
                            newP = new ParagraphNode();
                            newP.append(new CharNode({ char: '1' }));
                            p.after(newP);
                        });
                        await editor.execCommand('setSelection', {
                            vSelection: {
                                anchorNode: newP.firstLeaf(),
                                anchorPosition: RelativePosition.BEFORE,
                                focusNode: newP.lastLeaf(),
                                focusPosition: RelativePosition.AFTER,
                                direction: Direction.FORWARD,
                            },
                        });
                        await editor.execCommand(() => {
                            editor.memory.switchTo(sliceKey);
                        });
                        await editor.execCommand(() => {
                            newP = new ParagraphNode();
                            newP.append(new CharNode({ char: '2' }));
                            p.after(newP);
                        });
                        await editor.execCommand('setSelection', {
                            vSelection: {
                                anchorNode: newP.firstLeaf(),
                                anchorPosition: RelativePosition.BEFORE,
                                focusNode: newP.lastLeaf(),
                                focusPosition: RelativePosition.AFTER,
                                direction: Direction.FORWARD,
                            },
                        });
                    },
                    contentAfter: '<p>abcdef</p><p>[2]</p>',
                });
            });
        });
    });
});
