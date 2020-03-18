import { Button } from '../../plugin-toolbar/src/Toolbar';
import { AlignType, AlignParams, Align } from './Align';
import JWEditor from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';

function isAligned(node: VNode, type: AlignType): boolean {
    const alignedAncestor = node.ancestor(Align.isAligned);
    return Align.isAligned(alignedAncestor || node, type);
}

export const AlignLeftButton: Button = {
    title: 'Align left',
    class: 'fa-align-left',
    commandId: 'align',
    commandArgs: { type: AlignType.LEFT } as AlignParams,
    selected: (editor: JWEditor): boolean => {
        return editor.selection.range
            .targetedNodes(node => !node.atomic)
            .every(node => isAligned(node, AlignType.LEFT));
    },
};
export const AlignCenterButton: Button = {
    title: 'Align center',
    class: 'fa-align-center',
    commandId: 'align',
    commandArgs: { type: AlignType.CENTER } as AlignParams,
    selected: (editor: JWEditor): boolean => {
        return editor.selection.range
            .targetedNodes(node => !node.atomic)
            .every(node => isAligned(node, AlignType.CENTER));
    },
};
export const AlignRightButton: Button = {
    title: 'Align right',
    class: 'fa-align-right',
    commandId: 'align',
    commandArgs: { type: AlignType.RIGHT } as AlignParams,
    selected: (editor: JWEditor): boolean => {
        return editor.selection.range
            .targetedNodes(node => !node.atomic)
            .every(node => isAligned(node, AlignType.RIGHT));
    },
};
export const AlignJustifyButton: Button = {
    title: 'Align justify',
    class: 'fa-align-justify',
    commandId: 'align',
    commandArgs: { type: AlignType.JUSTIFY } as AlignParams,
    selected: (editor: JWEditor): boolean => {
        return editor.selection.range
            .targetedNodes(node => !node.atomic)
            .every(node => isAligned(node, AlignType.JUSTIFY));
    },
};
