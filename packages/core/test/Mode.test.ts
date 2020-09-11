import JWEditor from '../src/JWEditor';
import { ContainerNode } from '../src/VNodes/ContainerNode';
import { expect } from 'chai';
import { ModeDefinition, Mode, RuleProperty } from '../src/Mode';
import { VRange } from '../src/VRange';
import { TagNode } from '../src/VNodes/TagNode';
import { testEditor } from '../../utils/src/testUtils';
import { BasicEditor } from '../../bundle-basic-editor/BasicEditor';

describe('core', () => {
    describe('Modes', () => {
        describe('is editable', () => {
            it('should be able to edit if last element of a rule match', async () => {});

            it('should not be able to edit in the ContainerNode but able to edit if nested ContainerNode', async () => {
                const editor = new JWEditor();
                editor.configure({
                    modes: [
                        {
                            id: 'none',
                            rules: [
                                {
                                    selector: [ContainerNode],
                                    properties: {
                                        editable: {
                                            value: false,
                                            cascading: true,
                                        },
                                    },
                                },
                                {
                                    selector: [ContainerNode, ContainerNode],
                                    properties: {
                                        editable: {
                                            value: true,
                                            cascading: true,
                                        },
                                    },
                                },
                            ],
                        },
                    ],
                });
                editor.configure({ mode: 'none' });
                editor.start();
                const root = new ContainerNode();
                const firstChild = new ContainerNode();
                root.append(firstChild);
                const mode = editor.mode;
                expect(mode.is(root, RuleProperty.EDITABLE)).to.be.false;
                expect(mode.is(firstChild, RuleProperty.EDITABLE)).to.be.true;
            });
            it('should be able to use different modes on the range', async () => {
                const editor = new JWEditor();
                editor.start();
                const root = new ContainerNode();
                const mode = new Mode({
                    id: 'special',
                    rules: [
                        {
                            selector: [],
                            properties: {
                                editable: {
                                    value: false,
                                    cascading: true,
                                },
                            },
                        },
                    ],
                });
                // With default mode.
                await editor.execWithRange(VRange.at(root), async context => {
                    const range = context.range;
                    expect(range.mode.is(range.startContainer, RuleProperty.EDITABLE)).to.be.true;
                });
                // With special mode
                await editor.execWithRange(
                    VRange.at(root),
                    async context => {
                        const range = context.range;
                        expect(range.mode.is(range.startContainer, RuleProperty.EDITABLE)).to.be
                            .false;
                    },
                    mode,
                );
            });
        });
        describe('is breakable', () => {
            const unbreakableMode = {
                id: 'unbreakable',
                rules: [
                    {
                        selector: [
                            (node): boolean =>
                                node instanceof TagNode && node.htmlTag === 'UNBREAKABLE-NODE',
                        ],
                        properties: {
                            breakable: {
                                value: false,
                            },
                        },
                    },
                ],
            };
            it('should not split an unbreakable container but insert a linebreak instead (insertParagraphBreak)', async () => {
                await testEditor(BasicEditor, {
                    beforeStart: editor => {
                        editor.configure({ modes: [unbreakableMode] });
                        editor.configure({ mode: 'unbreakable' });
                    },
                    contentBefore: '<unbreakable-node>a[]b</unbreakable-node>',
                    stepFunction: async editor => {
                        await editor.execCommand('insertParagraphBreak');
                    },
                    contentAfter: '<unbreakable-node>a<br>[]b</unbreakable-node>',
                });
            });
            it('should not merge an unbreakable container (VRange.empty)', async () => {
                await testEditor(BasicEditor, {
                    beforeStart: editor => {
                        editor.configure({ modes: [unbreakableMode] });
                        editor.configure({ mode: 'unbreakable' });
                    },
                    contentBefore: '<unbreakable-node><p>ab[cd</p></unbreakable-node><p>ef]gh</p>',
                    stepFunction: async editor => {
                        await editor.execCommand('deleteForward');
                    },
                    contentAfter: '<unbreakable-node><p>ab[]</p></unbreakable-node><p>gh</p>',
                });
            });
            it('should not merge with an unbreakable container (VRange.empty)', async () => {
                await testEditor(BasicEditor, {
                    beforeStart: editor => {
                        editor.configure({ modes: [unbreakableMode] });
                        editor.configure({ mode: 'unbreakable' });
                    },
                    contentBefore: '<p>ab[cd</p><unbreakable-node><p>ef]gh</p></unbreakable-node>',
                    stepFunction: async editor => {
                        await editor.execCommand('deleteBackward');
                    },
                    contentAfter: '<p>ab[]</p><unbreakable-node><p>gh</p></unbreakable-node>',
                });
            });
            it('should merge a paragraph with text into a heading1 with text, next to an unbreakable, within a common unbreakable ancestor', async () => {
                await testEditor(BasicEditor, {
                    beforeStart: editor => {
                        editor.configure({ modes: [unbreakableMode] });
                        editor.configure({ mode: 'unbreakable' });
                    },
                    contentBefore:
                        '<unbreakable><h1>ab</h1><p>[]cd</p><unbreakable>ef</unbreakable></unbreakable>',
                    stepFunction: async editor => {
                        await editor.execCommand('deleteBackward');
                    },
                    contentAfter:
                        '<unbreakable><h1>ab[]cd</h1><unbreakable>ef</unbreakable></unbreakable>',
                });
            });
        });
    });
    describe('JWEditor', () => {
        describe('insertText', () => {
            it('should not be able to insert text if the range.start or range.end is inside a container that is not editable', async () => {});
        });
        describe('deletBackward', () => {
            it('should not be able to delete backward if range.start or range.end parent is not editable', async () => {});
        });
        it('should be able to switch between modes', async () => {
            const editor = new JWEditor();
            const definition: ModeDefinition = {
                id: 'test',
                rules: [
                    {
                        selector: [ContainerNode],
                        properties: {
                            editable: {
                                value: false,
                                cascading: true,
                            },
                        },
                    },
                ],
            };
            editor.configure({
                modes: [definition],
            });
            const node = new ContainerNode();
            const firstChild = new ContainerNode();
            node.append(firstChild);
            await editor.start();
            expect(editor.mode.is(node, RuleProperty.EDITABLE)).to.be.true;
            editor.setMode('test');
            expect(editor.mode.is(node, RuleProperty.EDITABLE)).to.be.false;
            editor.setMode('default');
            expect(editor.mode.is(node, RuleProperty.EDITABLE)).to.be.true;
        });
    });
});
