import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { VNode, Point, RelativePosition } from '../../core/src/VNodes/VNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { LinkFormat } from '../../plugin-link/src/LinkFormat';
import { Layout } from '../../plugin-layout/src/Layout';
import { OdooStructureNode } from '../../plugin-odoo/src/OdooStructureNode';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/ui/DomLayoutEngine';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { HtmlDomRenderingEngine } from '../../plugin-html/src/HtmlDomRenderingEngine';
import { CharNode } from '../../plugin-char/src/CharNode';
import { Inline } from '../../plugin-inline/src/Inline';
import { Parser } from '../../plugin-parser/src/Parser';

interface SelectedLinkInfo {
    /**
     * The selected text
     */
    text: string;
    /**
     * The url of the link
     */
    url: string;
    /**
     * The css class associated with the link
     */
    class: string;
    /**
     * The target of an html anchor.
     * Could be "_blank", "_self" ,"_parent", "_top" or the framename.
     */
    target: string;
}

export class DomHelpers<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    commands = {
        'dom.addClass': {
            handler: this.addClass.bind(this),
        },
        'dom.removeClass': {
            handler: this.removeClass.bind(this),
        },
        'dom.toggleClass': {
            handler: this.toggleClass.bind(this),
        },
        'dom.setAttribute': {
            handler: this.setAttribute.bind(this),
        },
        'dom.setStyle': {
            handler: this.setStyle.bind(this),
        },
        'dom.remove': {
            handler: this.remove.bind(this),
        },
        'dom.empty': {
            handler: this.empty.bind(this),
        },
        'dom.replace': {
            handler: this.replace.bind(this),
        },
        'dom.wrap': {
            handler: this.wrap.bind(this),
        },
        'dom.moveBefore': {
            handler: this.moveBefore.bind(this),
        },
        'dom.moveAfter': {
            handler: this.moveAfter.bind(this),
        },
        'dom.getRecordCover': {
            handler: this.getRecordCover.bind(this),
        },
        'dom.getLinkInfo': {
            handler: this.getLinkInfo.bind(this),
        },
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add a class or a list of classes to a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    addClass(params: { domNode: Node | Node[]; class: string | string[] }): void {
        const classes = Array.isArray(params.class) ? params.class : [params.class];
        for (const node of this._getNodes(params.domNode)) {
            node.modifiers.get(Attributes).classList.add(...classes);
        }
    }
    /**
     * Remove a class or a list of classes from a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    removeClass(params: { domNode: Node | Node[]; class: string | string[] }): void {
        const classes = Array.isArray(params.class) ? params.class : [params.class];
        for (const node of this._getNodes(params.domNode)) {
            node.modifiers.get(Attributes).classList.remove(...classes);
        }
    }
    /**
     * Add or remove a class or a list of classes from a DOM node or a list of
     * DOM nodes.
     *
     * @param params
     */
    toggleClass(params: { domNode: Node | Node[]; class: string }): void {
        const classes = Array.isArray(params.class) ? params.class : [params.class];
        for (const node of this._getNodes(params.domNode)) {
            node.modifiers.get(Attributes).classList.toggle(...classes);
        }
    }
    /**
     * Set an attribute on a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    setAttribute(params: { domNode: Node | Node[]; name: string; value: string }): void {
        for (const node of this._getNodes(params.domNode)) {
            node.modifiers.get(Attributes).set(params.name, params.value);
        }
    }
    /**
     * Set a style key/value pair on a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    setStyle(params: {
        domNode: Node | Node[];
        name: string;
        value: string;
        important?: boolean;
    }): void {
        for (const node of this._getNodes(params.domNode)) {
            const value = params.important ? params.value + ' !important' : params.value;
            node.modifiers.get(Attributes).style.set(params.name, value);
        }
    }
    /**
     * Remove a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    remove(params: { domNode: Node | Node[] }): void {
        for (const node of this._getNodes(params.domNode)) {
            node.remove();
        }
    }
    /**
     * Remove the contents of a DOM node or of a list of DOM nodes.
     *
     * @param params
     */
    empty(params: { domNode: Node | Node[] }): void {
        for (const node of this._getNodes(params.domNode)) {
            node.empty();
        }
    }
    /**
     * Replace a DOM node or a list of DOM nodes with the given HTML content.
     *
     * @param params
     */
    async replace(params: { domNodes: Node | Node[]; html: string }): Promise<void> {
        const nodes = this._getNodes(params.domNodes);
        const parsedNodes = await this._parseHTMLString(params.html);
        const firstNode = nodes[0];
        for (const parsedNode of parsedNodes) {
            firstNode.before(parsedNode);
        }
        for (const node of nodes) {
            node.remove();
        }
    }
    /**
     * Wrap the given HTML content within a DOM container.
     *
     * @param params
     */
    async wrap(params: { domContainer: Node; html: string }): Promise<void> {
        const container = this._getNodes(params.domContainer)[0];
        if (!(container instanceof ContainerNode)) {
            throw new Error(
                'The provided container must be a ContainerNode in the Jabberwock structure.',
            );
        }
        const parsedNodes = await this._parseHTMLString(params.html);
        for (const parsedNode of parsedNodes) {
            container.wrap(parsedNode);
        }
    }
    /**
     * Move a DOM Node before another.
     *
     * @param params
     */
    moveBefore(params: { fromDomNode: Node; toDomNode: Node }): void {
        const toNode = this._getNodes(params.toDomNode)[0];
        for (const fromNode of this._getNodes(params.fromDomNode)) {
            fromNode.before(toNode);
        }
    }
    /**
     * Move a DOM Node after another.
     *
     * @param params
     */
    moveAfter(params: { fromDomNode: Node; toDomNode: Node }): void {
        const toNodes = this._getNodes(params.toDomNode);
        const toNode = toNodes[toNodes.length - 1];
        for (const fromNode of this._getNodes(params.fromDomNode).reverse()) {
            fromNode.after(toNode);
        }
    }

    async getRecordCover(): Promise<Node> {
        const layout = this.editor.plugins.get(Layout);
        const domLayout = layout.engines.dom as DomLayoutEngine;
        const editableNode = domLayout.components.get('editable')[0] as ContainerNode;
        const covers = editableNode.descendants(node => {
            const attributes = node.modifiers.find(Attributes);

            if (attributes && attributes.length && typeof attributes.get('class') === 'string') {
                return attributes.classList.has('o_record_cover_container');
            }
        });
        const cover = covers && covers[0];
        if (cover) return domLayout.getDomNodes(cover)[0];
    }
    async getSelectedText(params: CommandParams): Promise<string> {
        const selectedNode = params.context.range.selectedNodes().map(node => node.clone());
        const container = new ContainerNode();
        container.append(...selectedNode);
        const renderer = this.editor.plugins.get(Renderer);
        const renderedNode = await renderer.render<HTMLElement[]>(
            HtmlDomRenderingEngine.id,
            container,
        );
        // todo: what if there is more rendered nodes?
        return renderedNode ? renderedNode[0].innerText : '';
    }
    async getSelectedLink(params: CommandParams): Promise<string> {
        const selectedNode = params.context.range.selectedNodes().map(node => node.clone());
        const nodeWithFormat: InlineNode = selectedNode.find(
            node =>
                node.is(InlineNode) &&
                node.modifiers.find(modifier => modifier instanceof LinkFormat),
        ) as InlineNode;
        const linkFormat: LinkFormat =
            nodeWithFormat &&
            (nodeWithFormat.modifiers.find(
                modifier => modifier instanceof LinkFormat,
            ) as LinkFormat);
        return linkFormat ? linkFormat.url : '';
    }
    getLinkInfo(params: CommandParams): SelectedLinkInfo {
        const targettedNodes = params.context.range.targetedNodes(CharNode);
        const text = targettedNodes.map(x => x.char).join('');
        //
        const inline = this.editor.plugins.get(Inline);
        const modifiers = inline.getCurrentModifiers(params.context.range);
        return {
            text: text,
            url: modifiers.get(LinkFormat)?.url,
            class: modifiers.get(Attributes)?.get('class'),
            target: modifiers
                .get(LinkFormat)
                ?.modifiers?.get(Attributes)
                ?.get('target'),
        } as SelectedLinkInfo;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    async _parseHTMLString(content: string): Promise<VNode[]> {
        const parser = this.editor.plugins.get(Parser);
        const domParser = parser && parser.engines.dom;
        if (!domParser) {
            // TODO: remove this when the editor can be instantiated on
            // something else than DOM.
            throw new Error(`No DOM parser installed.`);
        }
        const div = document.createElement('div');
        div.innerHTML = content;
        return (await domParser.parse(div))[0].children();
    }
    _getNodes(domNode: Node | Node[]): VNode[] {
        const layout = this.editor.plugins.get(Layout);
        const domEngine = layout.engines.dom as DomLayoutEngine;
        let nodes: VNode[] = [];
        if (Array.isArray(domNode)) {
            for (const oneDomNode of domNode) {
                nodes.push(...domEngine.getNodes(oneDomNode));
            }
        } else {
            nodes = domEngine.getNodes(domNode);
        }
        return nodes;
    }
}
