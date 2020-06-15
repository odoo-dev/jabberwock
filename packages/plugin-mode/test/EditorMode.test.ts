import JWEditor from '../../core/src/JWEditor';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { expect } from 'chai';
import { Mode, ModeRule, ModeDefinition } from '../src/Mode';
describe('core', () => {
    describe('Mode', () => {
        describe('isEditable()', () => {
            it('should be able to edit if last element of a rule match', async () => {});

            it('should check if the property checkEditable is true', async () => {
                const rules: ModeRule[] = [
                    {
                        selector: [ContainerNode],
                        editable: false,
                    },
                ];
                const mode = new Mode({
                    id: 'test',
                    checkEditable: true,
                    rules: rules,
                });
                const root = new ContainerNode();
                expect(mode.isNodeEditable(root)).to.be.false;
            });

            it('should not be able to edit in the ContainerNode but able to edit if nested ContainerNode', async () => {
                const mode = new Mode({
                    id: 'none',
                    checkEditable: true,
                    rules: [
                        {
                            selector: [ContainerNode],
                            editable: false,
                        },
                        {
                            selector: [ContainerNode, ContainerNode],
                            editable: true,
                        },
                    ],
                });
                const root = new ContainerNode();
                const firstChild = new ContainerNode();
                root.append(firstChild);
                expect(mode.isNodeEditable(root)).to.be.false;
                expect(mode.isNodeEditable(firstChild)).to.be.true;
            });
            it('should be able to edit in the VElement', async () => {});
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
                checkEditable: true,
                rules: [
                    {
                        selector: [ContainerNode],
                        editable: false,
                    },
                ],
            };
            editor.load({
                modes: [definition],
            });
            const node = new ContainerNode();
            const firstChild = new ContainerNode();
            node.append(firstChild);
            await editor.start();
            expect(editor.mode.isNodeEditable(node)).to.be.true;
            editor.setMode('test');
            expect(editor.mode.isNodeEditable(node)).to.be.false;
            editor.setMode('default');
            expect(editor.mode.isNodeEditable(node)).to.be.true;
        });
    });
});
