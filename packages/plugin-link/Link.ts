import { JWPlugin } from '../core/src/JWPlugin';
import { Inline } from '../plugin-inline/Inline';
import { LinkDomParser } from './LinkDomParser';
import { CommandParams } from '../core/src/Dispatcher';
import { InlineNode } from '../plugin-inline/InlineNode';
import { LinkFormat } from './LinkFormat';

export interface LinkParams extends CommandParams {
    url?: string;
    label?: string;
}

export class Link extends JWPlugin {
    static dependencies = [Inline];
    readonly parsers = [LinkDomParser];
    commands = {
        link: {
            handler: this.link.bind(this),
        },
    };
    shortcuts = [
        {
            pattern: 'CTRL+K',
            commandId: 'link',
            commandArgs: {
                url: 'https://en.wikipedia.org/wiki/Jabberwocky',
                label: 'Jabberwockipedia',
            }, // todo: pop modal to get url/label
        },
    ];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    link(params: LinkParams): void {
        const range = params.context.range;
        const selectedInlines = range.selectedNodes(InlineNode);

        let link: LinkFormat;
        if (params.url) {
            link = new LinkFormat(params.url);
        } else {
            // Reuse the url of the first link found in range.
            const firstLink = selectedInlines.find(node => node.formats.get(LinkFormat));
            link = firstLink && firstLink.formats.get(LinkFormat).clone();
        }
        // TODO: modal re-using url
        if (!link) return;

        if (range.isCollapsed()) {
            this.editor.execCommand('insertText', {
                text: params.label || link.url,
                formats: [link],
            });
        } else {
            for (const inline of selectedInlines) {
                inline.formats.replace(LinkFormat, link);
            }
        }
    }
    unlink(params: LinkParams): void {
        const range = params.context.range;
        for (const inline of range.selectedNodes(InlineNode)) {
            const linkFormatIndex = inline.formats.findIndex(
                format => format instanceof LinkFormat,
            );
            inline.formats.splice(linkFormatIndex, 1);
        }
    }
}
