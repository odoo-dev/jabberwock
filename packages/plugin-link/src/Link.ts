import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Inline } from '../../plugin-inline/src/Inline';
import { LinkDomParser } from './LinkDomParser';
import { CommandParams } from '../../core/src/Dispatcher';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { LinkFormat } from './LinkFormat';
import { Char } from '../../plugin-char/src/Char';
import { Formats } from '../../plugin-inline/src/Formats';
import { VNode, Typeguard } from '../../core/src/VNodes/VNode';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';

export interface LinkParams extends CommandParams {
    label?: string;
    url?: string;
}

export class Link<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static isLink(node: VNode): node is InlineNode;
    static isLink(link: LinkFormat, node: VNode): node is InlineNode;
    static isLink(link: LinkFormat | VNode, node?: VNode): node is InlineNode {
        if (link instanceof AbstractNode) {
            node = link;
        }
        const format = node.is(InlineNode) && node.formats.get(LinkFormat);
        return link instanceof AbstractNode ? !!format : format === link;
    }
    static dependencies = [Inline];
    commands = {
        link: {
            handler: this.link,
        },
        unlink: {
            handler: this.unlink,
        },
    };
    readonly loadables: Loadables<Parser & Keymap> = {
        parsers: [LinkDomParser],
        shortcuts: [
            {
                pattern: 'CTRL+K',
                selector: [(node: VNode): boolean => !Link.isLink(node)],
                commandId: 'link',
                // TODO: use dialog to get params
                commandArgs: {
                    url: 'https://en.wikipedia.org/wiki/Jabberwocky',
                    label: 'Jabberwockipedia',
                },
            },
            {
                pattern: 'CTRL+K',
                selector: [Link.isLink],
                commandId: 'unlink',
            },
        ],
    };

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
            this.editor.execCommand<Char>('insertText', {
                text: params.label || link.url,
                formats: new Formats(link),
            });
        } else {
            for (const inline of selectedInlines) {
                inline.formats.replace(LinkFormat, link);
            }
        }
    }
    unlink(params: LinkParams): void {
        const range = params.context.range;
        const node = range.start.previousSibling() || range.start.nextSibling();
        if (!node.is(InlineNode)) return;

        const link = node.formats.get(LinkFormat);
        if (!link) return;

        const sameLink: Typeguard<InlineNode> = Link.isLink.bind(Link, link);
        for (const inline of [node, ...node.adjacents(sameLink)]) {
            inline.formats.remove(link);
        }
    }
}
