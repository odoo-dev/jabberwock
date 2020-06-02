import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Inline } from '../../plugin-inline/src/Inline';
import { LinkXmlDomParser } from './LinkXmlDomParser';
import { CommandParams } from '../../core/src/Dispatcher';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { LinkFormat } from './LinkFormat';
import { Char } from '../../plugin-char/src/Char';
import { Modifiers } from '../../core/src/Modifiers';
import { VNode, Typeguard } from '../../core/src/VNodes/VNode';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import linkForm from '../assets/LinkForm.xml';
import { Owl } from '../../plugin-owl/src/Owl';
import { Attributes } from '../../plugin-xml/src/Attributes';

export interface LinkParams extends CommandParams {
    label?: string;
    url?: string;
    /**
     * The target of an html anchor.
     * Could be "_blank", "_self" ,"_parent", "_top" or the framename.
     */
    target?: string;
}

export class Link<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static isLink(node: VNode): node is InlineNode;
    static isLink(link: LinkFormat, node: VNode): node is InlineNode;
    static isLink(link: LinkFormat | VNode, node?: VNode): node is InlineNode {
        if (link instanceof AbstractNode) {
            node = link;
        }
        const format = node.is(InlineNode) && node.modifiers.find(LinkFormat);
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
    readonly loadables: Loadables<Parser & Keymap & Layout & Owl> = {
        parsers: [LinkXmlDomParser],
        shortcuts: [
            {
                pattern: 'CTRL+K',
                selector: [(node: VNode): boolean => !Link.isLink(node)],
                commandId: 'link',
            },
            {
                pattern: 'CTRL+K',
                selector: [Link.isLink],
                commandId: 'unlink',
            },
        ],
        componentZones: [['link', 'float']],
        owlTemplates: [linkForm],
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    async link(params: LinkParams): Promise<void> {
        // If the url is undefined, ask the user to provide one.
        if (!params.url) {
            const layout = this.editor.plugins.get(Layout);
            await layout.remove('link');
            await layout.add('link');

            return this.editor.execCommand('show', { componentID: 'link' });
        }

        // Otherwise create a link and insert it.
        const link = new LinkFormat(params.url);
        if (params.target) {
            link.modifiers.get(Attributes).set('target', params.target);
        }
        return this.editor.execCommand<Char>('insertText', {
            text: params.label || link.url,
            formats: new Modifiers(link),
            select: true,
            context: params.context,
        });
    }
    unlink(params: LinkParams): void {
        const range = params.context.range;
        const node = range.start.previousSibling() || range.start.nextSibling();
        if (!node.is(InlineNode)) return;

        const link = node.modifiers.find(LinkFormat);
        if (!link) return;

        const sameLink: Typeguard<InlineNode> = Link.isLink.bind(Link, link);
        for (const inline of [node, ...node.adjacents(sameLink)]) {
            inline.modifiers.remove(link);
        }
    }
}
