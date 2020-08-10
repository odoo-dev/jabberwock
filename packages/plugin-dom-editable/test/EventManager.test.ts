import { spy } from 'sinon';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';
import { testEditor } from '../../utils/src/testUtils';
import { expect } from 'chai';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { JWEditor, Loadables } from '../../core/src/JWEditor';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { DomEditable } from '../src/DomEditable';

describe('core', () => {
    describe('EventManager', () => {
        describe('_onNormalizedEvent', () => {
            it('should exec command from a virtualized keydown event', async () => {
                await testEditor(JWEditor, {
                    contentBefore: '<p>[]</p>',
                    beforeStart: (editor: BasicEditor) => {
                        editor.load(DomEditable);
                        editor.load(
                            class FakePlugin<T extends JWPluginConfig> extends JWPlugin<T> {
                                commands = {
                                    'fake-command': { handler: (): void => {} },
                                };
                                loadables: Loadables<Keymap> = {
                                    shortcuts: [
                                        { pattern: '<Backspace>', commandId: 'fake-command' },
                                    ],
                                };
                            },
                        );
                    },
                    stepFunction: async (editor: BasicEditor) => {
                        editor.execCommand = (): Promise<void> => Promise.resolve();
                        const execSpy = spy(editor, 'execCommand');
                        const params = {
                            context: editor.contextManager.defaultContext,
                        };
                        const domEditable = editor.plugins.get(DomEditable);
                        await domEditable._onNormalizedEvent(
                            Promise.resolve({
                                actions: [],
                                inferredKeydownEvent: {
                                    key: 'Backspace',
                                    code: 'Backspace',
                                    ctrlKey: false,
                                    altKey: false,
                                    shiftKey: false,
                                    metaKey: false,
                                },
                            }),
                        );
                        expect(execSpy.args).to.eql([['fake-command', params]]);
                    },
                });
            });
        });
    });
});
