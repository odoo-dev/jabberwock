import JWEditor from '../../core/src/JWEditor';
import { Button } from '../../plugin-toolbar/src/Toolbar';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { LinkFormat } from './LinkFormat';

export const LinkButton: Button = {
    title: 'Insert link',
    class: 'fa-link',
    commandId: 'link',
    selected: (editor: JWEditor): boolean => {
        const range = editor.selection.range;
        const node = range.start.nextSibling() || range.start.previousSibling();
        return node && node.is(InlineNode) && !!node.modifiers.find(LinkFormat);
    },
};

export const UnlinkButton: Button = {
    title: 'Remove link',
    class: 'fa-unlink',
    commandId: 'unlink',
    enabled: (editor: JWEditor): boolean => {
        const range = editor.selection.range;
        const node = range.start.nextSibling() || range.start.previousSibling();
        return node && node.is(InlineNode) && !!node.modifiers.find(LinkFormat);
    },
};
