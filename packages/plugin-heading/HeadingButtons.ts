import JWEditor, { Button } from '../core/src/JWEditor';
import { VNode } from '../core/src/VNodes/VNode';
import { HeadingNode } from './HeadingNode';

function selectedNodes(editor: JWEditor): VNode[] {
    const range = editor.vDocument.selection.range;
    let selectedNodes: VNode[];
    if (range.isCollapsed()) {
        selectedNodes = [range.start];
    } else {
        selectedNodes = range.selectedNodes();
    }
    return selectedNodes;
}
function headingButton(level): Button {
    return {
        title: 'Heading' + level,
        class: 'h' + level,
        commandId: 'applyHeadingStyle',
        commandArgs: { level: level },
        selected: async (editor: JWEditor): Promise<boolean> => {
            return selectedNodes(editor).every(node => {
                return node.ancestor(ancestor => {
                    return ancestor.is(HeadingNode) && ancestor.level === level;
                });
            });
        },
    };
}

export const ParagraphButton = {
    title: 'Paragraph',
    commandId: 'applyHeadingStyle',
    commandArgs: { level: 0 },
    selected: async (editor: JWEditor): Promise<boolean> => {
        return selectedNodes(editor).every(node => {
            return node.ancestor(ancestor => {
                return ancestor.is(editor.createBaseContainer().constructor);
            });
        });
    },
};
export const Heading1Button = headingButton(1);
export const Heading2Button = headingButton(2);
export const Heading3Button = headingButton(3);
export const Heading4Button = headingButton(4);
export const Heading5Button = headingButton(5);
export const Heading6Button = headingButton(6);
