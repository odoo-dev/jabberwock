import { ListNode, ListType } from '../../plugin-list/ListNode';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { testEditor } from '../../utils/src/testUtils';
import { CommandDefinition } from '../src/Dispatcher';
import { expect } from 'chai';
import { ParagraphNode } from '../../plugin-paragraph/ParagraphNode';
import { VNode } from '../src/VNodes/VNode';

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
                                selector: [ListNode],
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
                                selector: [ListNode],
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
                                selector: [ListNode, ListNode],
                                handler: callback,
                            },
                            {
                                title: 'list2',
                                selector: [ListNode, ListNode],
                                handler: callback,
                            },
                            {
                                title: 'list3',
                                selector: [ListNode],
                                handler: callback,
                            },
                        ];

                        const matchedCommand = editor.contextManager.match(commands);
                        expect(matchedCommand).to.equal(commands[1]);
                    },
                });
            });
            it('should match the command with more lvl2 specificity', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><ul><li><p>a[]b</p></li></ul></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const commands: CommandDefinition[] = [
                            {
                                title: 'paragraph',
                                selector: [ParagraphNode],
                                handler: callback,
                            },
                            {
                                title: 'list',
                                selector: [ListNode],
                                handler: callback,
                            },
                        ];

                        const matchedCommand = editor.contextManager.match(commands);
                        expect(matchedCommand).to.equal(commands[0]);
                    },
                });
            });
            it('should match the command with specificity lvl1 in the proper order', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><ol><li><p>a[]b</p></li></ol></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const isUl = (node: VNode): boolean => {
                            return node instanceof ListNode && node.listType === ListType.UNORDERED;
                        };
                        const isOl = (node: VNode): boolean => {
                            return node instanceof ListNode && node.listType === ListType.ORDERED;
                        };
                        const commands: CommandDefinition[] = [
                            {
                                title: 'list1',
                                selector: [isOl, isUl, ParagraphNode],
                                handler: callback,
                            },
                            {
                                title: 'list2',
                                selector: [isUl, isOl, ParagraphNode],
                                handler: callback,
                            },
                            {
                                title: 'list3',
                                selector: [isOl, isUl, ParagraphNode],
                                handler: callback,
                            },
                        ];

                        const matchedCommand = editor.contextManager.match(commands);
                        expect(matchedCommand).to.equal(commands[1]);
                    },
                });
            });
            it('should match no command when no predicates apply', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><p>ab</p></li></ul><p>[]c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const commands: CommandDefinition[] = [
                            {
                                title: 'list1',
                                selector: [ListNode, ListNode],
                                handler: callback,
                            },
                            {
                                title: 'list2',
                                selector: [ListNode],
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
