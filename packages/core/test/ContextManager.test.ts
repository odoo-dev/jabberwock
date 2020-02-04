import { ListNode } from '../../plugin-list/ListNode';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { testEditor } from '../../utils/src/testUtils';
import { CommandDefinition } from '../src/Dispatcher';
import { expect } from 'chai';

describe('core', () => {
    describe('ContextManager', () => {
        describe('match', () => {
            it('should match with context specificity that is a list', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><p>a[]b</p></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const commands: CommandDefinition[] = [
                            {
                                title: 'list',
                                predicates: [ListNode],
                                handler: callback,
                            },
                            {
                                title: 'indent',
                                handler: callback,
                            },
                        ];

                        const matchedCommand = editor.contextManager.match(commands);
                        expect(matchedCommand).to.equal(commands[0]);
                    },
                });
            });
            it('should match with context specificity that is not a list', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><p>ab</p></li></ul><p>[]c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const commands: CommandDefinition[] = [
                            {
                                title: 'list',
                                predicates: [ListNode],
                                handler: callback,
                            },
                            {
                                title: 'indent',
                                handler: callback,
                            },
                        ];

                        const matchedCommand = editor.contextManager.match(commands);
                        expect(matchedCommand).to.equal(commands[1]);
                    },
                });
            });
            it('should match the last command that match and has more predicate', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><ul><li><p>a[]b</p></li></ul></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const commands: CommandDefinition[] = [
                            {
                                title: 'list1',
                                predicates: [ListNode, ListNode],
                                handler: callback,
                            },
                            {
                                title: 'list2',
                                predicates: [ListNode, ListNode],
                                handler: callback,
                            },
                            {
                                title: 'list3',
                                predicates: [ListNode],
                                handler: callback,
                            },
                        ];

                        const matchedCommand = editor.contextManager.match(commands);
                        expect(matchedCommand).to.equal(commands[1]);
                    },
                });
            });
            it('should match no command when no predicates applies', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><p>ab</p></li></ul><p>[]c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const dispatcher = editor.dispatcher;

                        const callback = (): void => {};
                        const commands: CommandDefinition[] = [
                            {
                                title: 'list1',
                                predicates: [ListNode, ListNode],
                                handler: callback,
                            },
                            {
                                title: 'list2',
                                predicates: [ListNode],
                                handler: callback,
                            },
                        ];

                        const matchedCommand = editor.contextManager.match(commands);
                        expect(matchedCommand).to.equal(undefined);
                    },
                });
            });
        });
    });
});
