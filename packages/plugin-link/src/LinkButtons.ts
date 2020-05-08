import JWEditor from '../../core/src/JWEditor';
import { Button } from '../../plugin-toolbar/src/Toolbar';
import { LinkParams } from './Link';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { LinkFormat } from './LinkFormat';

export const LinkButton: Button = {
    title: 'Insert link',
    class: 'fa-link',
    commandId: 'link',
    // TODO: use dialog to get params
    commandArgs: {
        url: 'https://en.wikipedia.org/wiki/Jabberwocky',
        label: 'Jabberwockipedia',
    } as LinkParams,
    selected: (editor: JWEditor): boolean => {
        const range = editor.selection.range;
        const node = range.start.nextSibling() || range.start.previousSibling();
        return node.is(InlineNode) && !!node.formats.get(LinkFormat);
    },
};

export const UnlinkButton: Button = {
    title: 'Remove link',
    class: 'fa-unlink',
    commandId: 'unlink',
    enabled: (editor: JWEditor): boolean => {
        const range = editor.selection.range;
        const node = range.start.nextSibling() || range.start.previousSibling();
        return node.is(InlineNode) && !!node.formats.get(LinkFormat);
    },
};
