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

export interface SetStyleParams {
    /**
     * The `VNode`s whose style we want to change.
     */
    nodes: VNode[];
    /**
     * The css property.
     */
    property: string;
    /**
     * The css value.
     */
    value: string;
    important?: boolean;
}
export interface MoveParams {
    from: VNode;
    to: Point;
}

export interface RemoveParams {
    nodes: VNode[];
}
export interface EmptyParams {
    nodes: VNode[];
}
export interface WrapParams {
    container: ContainerNode;
    html: string;
}
export interface ReplaceParams {
    nodes: VNode[];
    html: string;
}
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
        'dom.move': {
            handler: this.move.bind(this),
        },
        'dom.remove': {
            handler: this.remove.bind(this),
        },
        'dom.empty': {
            handler: this.empty.bind(this),
        },
        'dom.wrap': {
            handler: this.wrap.bind(this),
        },
        'dom.replace': {
            handler: this.replace.bind(this),
        },
        'dom.getStructures': {
            handler: this.getStructures.bind(this),
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
    setStyle(params: SetStyleParams): void {
        for (const node of params.nodes) {
            const value = params.important ? params.value + ' !important' : params.value;
            node.modifiers.get(Attributes).style.set(params.property, value);
        }
    }
    move(params: MoveParams): void {
        switch (params.to[1]) {
            case RelativePosition.AFTER:
                params.from.after(params.to[0]);
                break;
            case RelativePosition.BEFORE:
                params.from.before(params.to[0]);
                break;
            case RelativePosition.INSIDE:
                params.from.append(params.to[0]);
                break;
        }
    }
    remove(params: RemoveParams): void {
        for (const vnode of params.nodes) {
            vnode.remove();
        }
    }
    empty(params: EmptyParams): void {
        for (const vnode of params.nodes) {
            vnode.empty();
        }
    }
    getStructures(): OdooStructureNode[] {
        const layout = this.editor.plugins.get(Layout);
        const domLayout = layout.engines.dom;
        const editable = domLayout.components.get('editable')[0];
        return editable.descendants(OdooStructureNode);
    }
    async wrap(params: WrapParams): Promise<void> {
        const parsedNodes = await this._parseHTMLString(params.html);
        const wrapNode = parsedNodes[0];
        const containerVNodes = [...params.container.childVNodes];
        if (!(wrapNode instanceof ContainerNode)) {
            throw new Error('Impossible to wrap without a ContainerNode. Check "params.html".');
        }
        let vnode: VNode;
        while ((vnode = containerVNodes.shift())) {
            wrapNode.append(vnode);
        }
        params.container.append(wrapNode);
    }

    async replace(params: ReplaceParams): Promise<void> {
        const parsedNodes = await this._parseHTMLString(params.html);
        const firstNode = params.nodes[0];
        parsedNodes.forEach(firstNode.before.bind(firstNode));
        for (const node of params.nodes) {
            node.remove();
        }
    }
    async getRecordCover(): Promise<Node> {
        const layout = this.editor.plugins.get(Layout);
        const domLayout = layout.engines.dom as DomLayoutEngine;
        const editableNode = domLayout.components.get('editable')[0] as ContainerNode;
        const covers = editableNode.descendants(node => {
            const attributes = node.modifiers.find(Attributes);

            if (attributes.length && typeof attributes.get('class') === 'string') {
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
