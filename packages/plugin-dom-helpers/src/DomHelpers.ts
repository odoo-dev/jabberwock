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
        for (const node of this.getNodes(params.domNode)) {
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
        for (const node of this.getNodes(params.domNode)) {
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
        for (const node of this.getNodes(params.domNode)) {
            node.modifiers.get(Attributes).classList.toggle(...classes);
        }
    }
    /**
     * Set an attribute on a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    setAttribute(params: { domNode: Node | Node[]; name: string; value: string }): void {
        for (const node of this.getNodes(params.domNode)) {
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
        for (const node of this.getNodes(params.domNode)) {
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
        for (const node of this.getNodes(params.domNode)) {
            node.remove();
        }
    }
    /**
     * Remove the contents of a DOM node or of a list of DOM nodes.
     *
     * @param params
     */
    empty(params: { domNode: Node | Node[] }): void {
        for (const node of this.getNodes(params.domNode)) {
            node.empty();
        }
    }
    /**
     * Replace a DOM node or a list of DOM nodes with the given HTML content.
     *
     * @param params
     */
    async replace(params: { domNodes: Node | Node[]; html: string }): Promise<void> {
        const nodes = this.getNodes(params.domNodes);
        const parsedNodes = await this._parseHtmlString(params.html);
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
        const container = this.getNodes(params.domContainer)[0];
        if (!(container instanceof ContainerNode)) {
            throw new Error(
                'The provided container must be a ContainerNode in the Jabberwock structure.',
            );
        }
        const parsedNodes = await this._parseHtmlString(params.html);
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
        const toNode = this.getNodes(params.toDomNode)[0];
        for (const fromNode of this.getNodes(params.fromDomNode)) {
            fromNode.before(toNode);
        }
    }
    /**
     * Move a DOM Node after another.
     *
     * @param params
     */
    moveAfter(params: { fromDomNode: Node; toDomNode: Node }): void {
        const toNodes = this.getNodes(params.toDomNode);
        const toNode = toNodes[toNodes.length - 1];
        for (const fromNode of this.getNodes(params.fromDomNode).reverse()) {
            fromNode.after(toNode);
        }
    }
    /**
     * Insert html content before, after or inside a DOM Node. If no DOM Node
     * was provided, empty the range and insert the html content before the it.
     *
     * @param params
     */
    async insertHtml(params: {
        html: string;
        domNode?: Node;
        position?: RelativePosition;
    }): Promise<VNode[]> {
        let nodes: VNode[];
        let position: RelativePosition;
        if (params.domNode) {
            nodes = this.getNodes(params.domNode);
            position = params.position || RelativePosition.BEFORE;
        } else {
            this.editor.selection.range.empty();
            nodes = [this.editor.selection.range.start];
            position = RelativePosition.BEFORE;
        }
        const parsedNodes = await this._parseHtmlString(params.html);
        switch (position.toUpperCase()) {
            case RelativePosition.BEFORE.toUpperCase():
                for (const parsedNode of parsedNodes) {
                    nodes[0].before(parsedNode);
                }
                break;
            case RelativePosition.AFTER.toUpperCase():
                for (const parsedNode of parsedNodes.reverse()) {
                    nodes[nodes.length - 1].after(parsedNode);
                }
                break;
            case RelativePosition.INSIDE.toUpperCase():
                for (const parsedNode of parsedNodes.reverse()) {
                    nodes[nodes.length - 1].append(parsedNode);
                }
                break;
        }
        return parsedNodes;
    }
    /**
     * Return the `VNode`(s) matching a DOM Node or a list of DOM Nodes.
     *
     * @param domNode
     */
    getNodes(domNode: Node | Node[]): VNode[] {
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

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Parse an HTML string and return the resulting `VNodes`.
     *
     * @param html
     */
    async _parseHtmlString(html: string): Promise<VNode[]> {
        const parser = this.editor.plugins.get(Parser);
        const domParser = parser && parser.engines['dom/html'];
        if (!domParser) {
            // TODO: remove this when the editor can be instantiated on
            // something else than DOM.
            throw new Error(`No DOM parser installed.`);
        }
        const div = document.createElement('div');
        div.innerHTML = html;
        return (await domParser.parse(div))[0].children();
    }
}
