/* eslint-disable max-nested-callbacks */
import * as sinon from 'sinon';
import { ListNode, ListType } from '../../plugin-list/src/ListNode';
import { BasicEditor } from '../../../bundles/BasicEditor';
import { testEditor } from '../../utils/src/testUtils';
import { CommandImplementation } from '../src/Dispatcher';
import { expect } from 'chai';
import { ParagraphNode } from '../../plugin-paragraph/src/ParagraphNode';
import { VNode } from '../src/VNodes/VNode';
import { VSelection } from '../src/VSelection';
import { Context, CheckingContext } from '../src/ContextManager';

describe('core', () => {
    describe('ContextManager', () => {
        describe('match', () => {
            it('should match with no check', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><p>a[]b</p></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const check = (context: CheckingContext): boolean => !context;
                        const checkSpy = sinon.spy(check);
                        const commands: CommandImplementation[] = [
                            {
                                title: 'list',
                                check: checkSpy,
                                handler: callback,
                            },
                            {
                                title: 'indent',
                                handler: callback,
                            },
                        ];

                        const result = editor.contextManager.match(commands);
                        expect(checkSpy.callCount).to.eql(1);
                        expect(checkSpy.args[0][0]).to.eql({
                            range: editor.selection.range,
                            selector: [],
                        });
                        const [matchedCommand, computedContext] = result;
                        expect(matchedCommand).to.deep.equal(commands[1]);
                        expect(computedContext).to.deep.equal({
                            range: editor.selection.range,
                        });
                    },
                });
            });
            it('should match with context specificity that is a list', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><p>a[]b</p></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const check = (context: CheckingContext): boolean => !!context;
                        const checkSpy = sinon.spy(check);
                        const commands: CommandImplementation[] = [
                            {
                                title: 'list',
                                selector: [ListNode],
                                check: checkSpy,
                                handler: callback,
                            },
                            {
                                title: 'indent',
                                handler: callback,
                            },
                        ];

                        const result = editor.contextManager.match(commands);
                        expect(checkSpy.callCount).to.eql(1);
                        expect(checkSpy.args[0][0]).to.eql({
                            range: editor.selection.range,
                            selector: [editor.selection.range.start.ancestor(ListNode)],
                        });
                        const [matchedCommand, computedContext] = result;
                        expect(matchedCommand).to.deep.equal(commands[0]);
                        expect(computedContext).to.deep.equal({
                            range: editor.selection.range,
                        });
                    },
                });
            });
            it('should match with context specificity that is not a list', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><p>ab</p></li></ul><p>[]c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const check = (context: CheckingContext): boolean => !!context;
                        const checkSpy1 = sinon.spy(check);
                        const checkSpy2 = sinon.spy(check);
                        const commands: CommandImplementation[] = [
                            {
                                title: 'list',
                                selector: [ListNode],
                                check: checkSpy1,
                                handler: callback,
                            },
                            {
                                title: 'indent',
                                check: checkSpy2,
                                handler: callback,
                            },
                        ];

                        const result = editor.contextManager.match(commands);
                        expect(checkSpy1.callCount).to.eql(0);
                        expect(checkSpy2.callCount).to.eql(1);
                        expect(checkSpy2.args[0][0]).to.eql({
                            range: editor.selection.range,
                            selector: [],
                        });
                        const [matchedCommand, computedContext] = result;
                        expect(matchedCommand).to.deep.equal(commands[1]);
                        expect(computedContext).to.deep.equal({
                            range: editor.selection.range,
                        });
                    },
                });
            });
            it('should match the last command that match and has more predicate', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><ul><li><p>a[]b</p></li></ul></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const check = (context: CheckingContext): boolean => !!context;
                        const checkSpy1 = sinon.spy(check);
                        const checkSpy2 = sinon.spy(check);
                        const checkSpy3 = sinon.spy(check);
                        const commands: CommandImplementation[] = [
                            {
                                title: 'list1',
                                selector: [ListNode, ListNode],
                                check: checkSpy1,
                                handler: callback,
                            },
                            {
                                title: 'list2',
                                selector: [ListNode, ListNode],
                                check: checkSpy2,
                                handler: callback,
                            },
                            {
                                title: 'list3',
                                selector: [ListNode],
                                check: checkSpy3,
                                handler: callback,
                            },
                        ];

                        const result = editor.contextManager.match(commands);
                        const closestList = editor.selection.range.start.closest(ListNode);
                        const checkingContext: CheckingContext = {
                            range: editor.selection.range,
                            selector: [closestList.ancestor(ListNode), closestList],
                        };
                        expect(checkSpy1.callCount).to.eql(1);
                        expect(checkSpy1.args[0][0]).to.eql(checkingContext);
                        expect(checkSpy2.callCount).to.eql(1);
                        expect(checkSpy2.args[0][0]).to.eql(checkingContext);
                        expect(checkSpy3.callCount).to.eql(0);
                        const [matchedCommand, computedContext] = result;
                        expect(matchedCommand).to.deep.equal(commands[1]);
                        expect(computedContext).to.deep.equal({
                            range: editor.selection.range,
                        });
                    },
                });
            });
            it('should match the command with more lvl2 specificity', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><ul><li><p>a[]b</p></li></ul></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const check = (context: CheckingContext): boolean => !!context;
                        const checkSpy = sinon.spy(check);
                        const commands: CommandImplementation[] = [
                            {
                                title: 'paragraph',
                                selector: [ParagraphNode],
                                check: checkSpy,
                                handler: callback,
                            },
                            {
                                title: 'list',
                                selector: [ListNode],
                                handler: callback,
                            },
                        ];

                        const result = editor.contextManager.match(commands);
                        expect(checkSpy.callCount).to.eql(1);
                        expect(checkSpy.args[0][0]).to.eql({
                            range: editor.selection.range,
                            selector: [editor.selection.range.start.ancestor(ParagraphNode)],
                        });
                        const [matchedCommand, computedContext] = result;
                        expect(matchedCommand).to.deep.equal(commands[0]);
                        expect(computedContext).to.deep.equal({
                            range: editor.selection.range,
                        });
                    },
                });
            });
            it('should match the command with specificity lvl1 in the proper order', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><ol><li><p>a[]b</p></li></ol></li></ul><p>c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const check = (context: CheckingContext): boolean => !!context;
                        const checkSpy = sinon.spy(check);
                        const isUl = (node: VNode): boolean => {
                            return node instanceof ListNode && node.listType === ListType.UNORDERED;
                        };
                        const isOl = (node: VNode): boolean => {
                            return node instanceof ListNode && node.listType === ListType.ORDERED;
                        };
                        const commands: CommandImplementation[] = [
                            {
                                title: 'list1',
                                selector: [isOl, isUl, ParagraphNode],
                                handler: callback,
                            },
                            {
                                title: 'list2',
                                selector: [isUl, isOl, ParagraphNode],
                                check: checkSpy,
                                handler: callback,
                            },
                            {
                                title: 'list3',
                                selector: [isOl, isUl, ParagraphNode],
                                handler: callback,
                            },
                        ];

                        const result = editor.contextManager.match(commands);
                        expect(checkSpy.callCount).to.eql(1);
                        expect(checkSpy.args[0][0]).to.eql({
                            range: editor.selection.range,
                            selector: [
                                editor.selection.range.start.ancestor(isUl),
                                editor.selection.range.start.ancestor(isOl),
                                editor.selection.range.start.ancestor(ParagraphNode),
                            ],
                        });
                        const [matchedCommand, computedContext] = result;
                        expect(matchedCommand).to.deep.equal(commands[1]);
                        expect(computedContext).to.deep.equal({
                            range: editor.selection.range,
                        });
                    },
                });
            });
            it('should match no command when no predicates apply', async () => {
                await testEditor(BasicEditor, {
                    contentBefore: '<ul><li><p>ab</p></li></ul><p>[]c</p>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const commands: CommandImplementation[] = [
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

                        const result = editor.contextManager.match(commands);
                        const [matchedCommand, matchedContext] = result;
                        expect(matchedCommand).to.be.undefined;
                        expect(matchedContext).to.be.undefined;
                    },
                });
            });
            it('should match according to specified context', async () => {
                await testEditor(BasicEditor, {
                    contentBefore:
                        '<div><div><p>cd</p></div></div>' +
                        '<ul><li></li><li><ul><li><p>c</p></li></ul></li><li><div>[]</div></li></ul>',
                    stepFunction: (editor: BasicEditor) => {
                        const callback = (): void => {};
                        const check = (context: CheckingContext): boolean => !!context;
                        const checkSpy1 = sinon.spy(check);
                        const checkSpy2 = sinon.spy(check);
                        const newSelection = new VSelection();
                        newSelection.setAt(editor.vDocument.root);
                        const commands: CommandImplementation[] = [
                            {
                                title: 'paragraph',
                                selector: [ParagraphNode],
                                check: checkSpy1,
                                context: {
                                    range: newSelection.range,
                                },
                                handler: callback,
                            },
                            {
                                title: 'list',
                                selector: [ListNode],
                                check: checkSpy2,
                                handler: callback,
                            },
                        ];

                        // Default context is override by the command's context.
                        const result1 = editor.contextManager.match(commands);
                        expect(checkSpy1.callCount).to.eql(1);
                        expect(checkSpy1.args[0][0]).to.eql({
                            range: newSelection.range,
                            selector: [newSelection.range.start.ancestor(ParagraphNode)],
                        });
                        expect(checkSpy2.callCount).to.eql(0);
                        const [matchedCommand1, computedContext1] = result1;
                        expect(matchedCommand1).to.deep.equal(commands[0]);
                        expect(computedContext1).to.deep.equal({
                            range: newSelection.range,
                        });

                        // Which itself can still be overriden by the caller.
                        const context: Context = {
                            range: editor.selection.range,
                        };
                        const result2 = editor.contextManager.match(commands, context);
                        expect(checkSpy1.callCount).to.eql(1);
                        expect(checkSpy2.callCount).to.eql(1);
                        expect(checkSpy2.args[0][0]).to.eql({
                            range: editor.selection.range,
                            selector: [editor.selection.range.start.ancestor(ListNode)],
                        });
                        const [matchedCommand2, computedContext2] = result2;
                        expect(matchedCommand2).to.deep.equal(commands[1]);
                        expect(computedContext2).to.deep.equal({
                            range: editor.selection.range,
                        });
                    },
                });
            });
        });
    });
});
