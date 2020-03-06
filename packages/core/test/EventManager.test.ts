import { spy } from 'sinon';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { testEditor } from '../../utils/src/testUtils';
import { expect } from 'chai';
import { JWPlugin } from '../src/JWPlugin';

describe('core', () => {
    describe('EventManager', () => {
        describe('_onNormalizedEvent', () => {
            it('should exec command from a virtualized keydown event', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<p>[]</p>',
                    beforeStart: (editor: BasicEditor) => {
                        editor.addPlugin(
                            class FakePlugin extends JWPlugin {
                                commands = {
                                    'fake-command': { handler: (): void => {} },
                                };
                                shortcuts = [{ pattern: '<Backspace>', commandId: 'fake-command' }];
                            },
                        );
                    },
                    stepFunction: async (editor: BasicEditor) => {
                        editor.execCommand = (): Promise<void> => Promise.resolve();
                        const execSpy = spy(editor, 'execCommand');
                        const params = {
                            context: editor.contextManager.defaultContext,
                        };
                        await editor.eventManager._onNormalizedEvent({
                            actions: [],
                            inferredKeydownEvent: {
                                key: 'Backspace',
                                code: 'Backspace',
                                ctrlKey: false,
                                altKey: false,
                                shiftKey: false,
                                metaKey: false,
                            },
                        });
                        expect(execSpy.args).to.eql([['fake-command', params]]);
                    },
                });
            });
        });
    });
});
