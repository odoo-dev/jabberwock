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
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add a class or a list of classes to a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async addClass(domNode: Node | Node[], className: string | string[]): Promise<void> {
        const classes = Array.isArray(className) ? className : [className];
        for (const node of this.getNodes(domNode)) {
            node.modifiers.get(Attributes).classList.add(...classes);
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Remove a class or a list of classes from a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async removeClass(domNode: Node | Node[], className: string | string[]): Promise<void> {
        const classes = Array.isArray(className) ? className : [className];
        for (const node of this.getNodes(domNode)) {
            node.modifiers.get(Attributes).classList.remove(...classes);
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Add or remove a class or a list of classes from a DOM node or a list of
     * DOM nodes.
     *
     * @param params
     */
    async toggleClass(domNode: Node | Node[], className: string): Promise<void> {
        const classes = Array.isArray(className) ? className : [className];
        for (const node of this.getNodes(domNode)) {
            node.modifiers.get(Attributes).classList.toggle(...classes);
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Set an attribute on a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async setAttribute(domNode: Node | Node[], name: string, value: string): Promise<void> {
        for (const node of this.getNodes(domNode)) {
            node.modifiers.get(Attributes).set(name, value);
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Set a style key/value pair on a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async setStyle(
        domNode: Node | Node[],
        name: string,
        value: string,
        important?: boolean,
    ): Promise<void> {
        for (const node of this.getNodes(domNode)) {
            value = important ? value + ' !important' : value;
            node.modifiers.get(Attributes).style.set(name, value);
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Remove a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async remove(domNode: Node | Node[]): Promise<void> {
        for (const node of this.getNodes(domNode)) {
            node.remove();
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Remove the contents of a DOM node or of a list of DOM nodes.
     *
     * @param params
     */
    async empty(domNode: Node | Node[]): Promise<void> {
        for (const node of this.getNodes(domNode)) {
            node.empty();
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Replace a DOM node or a list of DOM nodes with the given HTML content.
     *
     * @param params
     */
    async replace(domNodes: Node | Node[], html: string): Promise<void> {
        const nodes = this.getNodes(domNodes);
        const parsedNodes = await this._parseHtmlString(html);
        const firstNode = nodes[0];
        for (const parsedNode of parsedNodes) {
            firstNode.before(parsedNode);
        }
        for (const node of nodes) {
            node.remove();
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Wrap the given HTML content within a DOM container.
     *
     * @param params
     */
    async wrap(domContainer: Node, html: string): Promise<void> {
        const container = this.getNodes(domContainer)[0];
        if (!(container instanceof ContainerNode)) {
            throw new Error(
                'The provided container must be a ContainerNode in the Jabberwock structure.',
            );
        }
        const parsedNodes = await this._parseHtmlString(html);
        for (const parsedNode of parsedNodes) {
            container.wrap(parsedNode);
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Move a DOM Node before another.
     *
     * @param params
     */
    async moveBefore(fromDomNode: Node, toDomNode: Node): Promise<void> {
        const toNode = this.getNodes(toDomNode)[0];
        for (const fromNode of this.getNodes(fromDomNode)) {
            fromNode.before(toNode);
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Move a DOM Node after another.
     *
     * @param params
     */
    async moveAfter(fromDomNode: Node, toDomNode: Node): Promise<void> {
        const toNodes = this.getNodes(toDomNode);
        const toNode = toNodes[toNodes.length - 1];
        for (const fromNode of this.getNodes(fromDomNode).reverse()) {
            fromNode.after(toNode);
        }
        await this.editor.dispatcher.dispatchHooks('@redraw');
    }
    /**
     * Insert html content before, after or inside a DOM Node. If no DOM Node
     * was provided, empty the range and insert the html content before the it.
     *
     * @param params
     */
    async insertHtml(html: string, domNode?: Node, position?: RelativePosition): Promise<VNode[]> {
        let nodes: VNode[];
        if (domNode) {
            nodes = this.getNodes(domNode);
            position = position || RelativePosition.BEFORE;
        } else {
            this.editor.selection.range.empty();
            nodes = [this.editor.selection.range.start];
            position = RelativePosition.BEFORE;
        }
        const parsedNodes = await this._parseHtmlString(html);
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
        await this.editor.dispatcher.dispatchHooks('@redraw');
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