import JWEditor from '../src/JWEditor';
import { ContainerNode } from '../src/VNodes/ContainerNode';
import { expect } from 'chai';
import { ModeDefinition, Mode, RuleProperty } from '../src/Mode';
import { VRange } from '../src/VRange';

describe('core', () => {
    describe('Modes', () => {
        describe('isEditable()', () => {
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
