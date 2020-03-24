import JWEditor from '../../core/src/JWEditor';
import { PreNode } from './PreNode';
import { Button } from '../../plugin-toolbar/src/Toolbar';

export const PreButton: Button = {
    title: 'Pre',
    commandId: 'applyPreStyle',
    selected: (editor: JWEditor): boolean => {
        return editor.selection.range.targetedNodes().every(node => {
            return node.closest(PreNode);
        });
    },
};
