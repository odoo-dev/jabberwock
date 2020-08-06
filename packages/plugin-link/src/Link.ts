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
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import linkForm from '../assets/LinkForm.xml';
import { Owl } from '../../plugin-owl/src/Owl';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { OwlNode } from '../../plugin-owl/src/OwlNode';
import { LinkComponent } from './components/LinkComponent';

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
        const format = node instanceof InlineNode && node.modifiers.find(LinkFormat);
        return link instanceof AbstractNode ? !!format : link.isSameAs(format);
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
        components: [
            {
                id: 'link',
                async render(editor: JWEditor, props?: {}): Promise<OwlNode[]> {
                    return [new OwlNode({ Component: LinkComponent, props: props })];
                },
            },
            {
                id: 'LinkButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'link',
                        label: 'Insert link',
                        commandId: 'link',
                        selected: (editor: JWEditor): boolean => {
                            const range = editor.selection.range;
                            const node = range.start.nextSibling() || range.start.previousSibling();
                            return (
                                node &&
                                node instanceof InlineNode &&
                                !!node.modifiers.find(LinkFormat)
                            );
                        },
                        modifiers: [new Attributes({ class: 'fa fa-link fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'UnlinkButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'unlink',
                        label: 'Remove italic',
                        commandId: 'unlink',
                        enabled: (editor: JWEditor): boolean => {
                            const range = editor.selection.range;
                            const node = range.start.nextSibling() || range.start.previousSibling();
                            return (
                                node &&
                                node instanceof InlineNode &&
                                !!node.modifiers.find(LinkFormat)
                            );
                        },
                        modifiers: [new Attributes({ class: 'fa fa-unlink fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [
            ['link', ['float']],
            ['LinkButton', ['actionables']],
            ['UnlinkButton', ['actionables']],
        ],
        owlTemplates: [linkForm],
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    async link(params: LinkParams): Promise<void> {
        // If the url is undefined, ask the user to provide one.
        const range = params.context.range;
        const selectedInlines = range.selectedNodes(InlineNode);
        const label = params.label || selectedInlines.map(node => node.textContent).join('');

        if (!params.url) {
            const firstLink = selectedInlines.find(node => node.modifiers.find(LinkFormat));
            const link = firstLink && firstLink.modifiers.find(LinkFormat).clone();
            const url = link?.url || '';

            const layout = this.editor.plugins.get(Layout);
            await layout.remove('link');
            return layout.append('link', undefined, { label: label, url: url });
        }

        // Otherwise create a link and insert it.
        const link = new LinkFormat(params.url);
        if (params.target) {
            link.modifiers.get(Attributes).set('target', params.target);
        }
        return this.editor.execCommand<Char>('insertText', {
            text: label || link.url,
            formats: new Modifiers(link),
            context: params.context,
        });
    }
    unlink(params: LinkParams): void {
        const range = params.context.range;

        if (range.isCollapsed()) {
            // If no range is selected and we are in a Link : remove the complete link.
            const previousNode = range.start.previousSibling();
            const nextNode = range.start.nextSibling();
            const node = Link.isLink(previousNode) ? previousNode : nextNode;
            if (!Link.isLink(node)) return;

            const link = node.modifiers.find(LinkFormat);
            const sameLink: Typeguard<InlineNode> = Link.isLink.bind(Link, link);
            this._removeLinkOnNodes([node, ...node.adjacents(sameLink)]);
        } else {
            // If a range is selected : remove any link on the selected range.
            const selectedNodes = range.selectedNodes(InlineNode);
            // Remove the format 'LinkFormat' for all nodes.
            this._removeLinkOnNodes(selectedNodes);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Remove all link modifiers on the provided nodes.
     * This method is mainly use by the unlink function of the editor.
     */
    _removeLinkOnNodes(nodes: VNode[]): void {
        for (const node of nodes) {
            node.modifiers.remove(LinkFormat);
        }
    }
}
