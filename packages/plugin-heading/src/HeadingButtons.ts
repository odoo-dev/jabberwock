import JWEditor from '../../core/src/JWEditor';
import { HeadingNode } from './HeadingNode';
import { HeadingParams } from './Heading';
import { Button } from '../../plugin-toolbar/src/Toolbar';

function headingButton(level): Button {
    return {
        title: 'Heading' + level,
        class: 'h' + level,
        commandId: 'applyHeadingStyle',
        commandArgs: { level: level } as HeadingParams,
        selected: (editor: JWEditor): boolean => {
            return editor.selection.range.targetedNodes().every(node => {
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
    commandArgs: { level: 0 } as HeadingParams,
    selected: (editor: JWEditor): boolean => {
        return editor.selection.range.targetedNodes().every(node => {
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
