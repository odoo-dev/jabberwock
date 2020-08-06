import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { VNode, RelativePosition } from '../../core/src/VNodes/VNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
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
        return this.editor.execCommand(async () => {
            const classes = Array.isArray(className) ? className : [className];
            for (const node of this.getNodes(domNode)) {
                node.modifiers.get(Attributes).classList.add(...classes);
            }
        });
    }
    /**
     * Remove a class or a list of classes from a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async removeClass(domNode: Node | Node[], className: string | string[]): Promise<void> {
        return this.editor.execCommand(async () => {
            const classes = Array.isArray(className) ? className : [className];
            for (const node of this.getNodes(domNode)) {
                node.modifiers.find(Attributes)?.classList.remove(...classes);
            }
        });
    }
    /**
     * Add or remove a class or a list of classes from a DOM node or a list of
     * DOM nodes.
     *
     * @param params
     */
    async toggleClass(domNode: Node | Node[], className: string): Promise<void> {
        return this.editor.execCommand(async () => {
            const classes = Array.isArray(className) ? className : [className];
            for (const node of this.getNodes(domNode)) {
                node.modifiers.get(Attributes).classList.toggle(...classes);
            }
        });
    }
    /**
     * Set an attribute on a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async setAttribute(domNode: Node | Node[], name: string, value: string): Promise<void> {
        return this.editor.execCommand(async () => {
            for (const node of this.getNodes(domNode)) {
                node.modifiers.get(Attributes).set(name, value);
            }
        });
    }

    /**
     * Update the attributes with the given dictionnary and clear all previous
     * attributes.
     */
    async updateAttributes(
        domNode: Node | Node[],
        attributes: { [key: string]: string },
    ): Promise<void> {
        return this.editor.execCommand(async () => {
            for (const node of this.getNodes(domNode)) {
                node.modifiers.get(Attributes).clear();
                for (const [name, value] of Object.entries(attributes)) {
                    node.modifiers.get(Attributes).set(name, value);
                }
            }
        });
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
        return this.editor.execCommand(async () => {
            for (const node of this.getNodes(domNode)) {
                value = important ? value + ' !important' : value;
                node.modifiers.get(Attributes).style.set(name, value);
            }
        });
    }
    /**
     * Remove a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async remove(domNode: Node | Node[]): Promise<void> {
        return this.editor.execCommand(async () => {
            for (const node of this.getNodes(domNode)) {
                node.remove();
            }
        });
    }
    /**
     * Remove the contents of a DOM node or of a list of DOM nodes.
     *
     * @param params
     */
    async empty(domNode: Node | Node[]): Promise<void> {
        return this.editor.execCommand(async () => {
            for (const node of this.getNodes(domNode)) {
                node.empty();
            }
        });
    }
    /**
     * Replace a DOM node or a list of DOM nodes with the given HTML content.
     *
     * @param params
     */
    async replace(domNodes: Node | Node[], html: string): Promise<void> {
        return this.editor.execCommand(async () => {
            const nodes = this.getNodes(domNodes);
            const parsedNodes = await this._parseHtmlString(html);
            const firstNode = nodes[0];
            for (const parsedNode of parsedNodes) {
                firstNode.before(parsedNode);
            }
            for (const node of nodes) {
                node.remove();
            }
        });
    }
    /**
     * Wrap the given HTML content within a DOM container.
     *
     * @param params
     */
    async wrap(domContainer: Node, html: string): Promise<void> {
        return this.editor.execCommand(async () => {
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
        });
    }
    /**
     * Move a DOM Node before another.
     *
     * @param params
     */
    async moveBefore(fromDomNode: Node, toDomNode: Node): Promise<void> {
        return this.editor.execCommand(async () => {
            const toNode = this.getNodes(toDomNode)[0];
            for (const fromNode of this.getNodes(fromDomNode)) {
                fromNode.before(toNode);
            }
        });
    }
    /**
     * Move a DOM Node after another.
     *
     * @param params
     */
    async moveAfter(fromDomNode: Node, toDomNode: Node): Promise<void> {
        return this.editor.execCommand(async () => {
            const toNodes = this.getNodes(toDomNode);
            const toNode = toNodes[toNodes.length - 1];
            for (const fromNode of this.getNodes(fromDomNode).reverse()) {
                fromNode.after(toNode);
            }
        });
    }
    /**
     * Insert html content before, after or inside a DOM Node. If no DOM Node
     * was provided, empty the range and insert the html content before the it.
     *
     * @param params
     */
    async insertHtml(html: string, domNode?: Node, position?: RelativePosition): Promise<VNode[]> {
        let parsedNodes: VNode[];
        await this.editor.execCommand(async () => {
            let nodes: VNode[];
            if (domNode) {
                nodes = this.getNodes(domNode);
                if (!nodes.length) {
                    throw new Error('The given DOM node does not have a corresponding VNode.');
                }
                position = position || RelativePosition.BEFORE;
            } else {
                this.editor.selection.range.empty();
                nodes = [this.editor.selection.range.start];
                position = RelativePosition.BEFORE;
            }
            parsedNodes = await this._parseHtmlString(html);
            switch (position.toUpperCase()) {
                case RelativePosition.BEFORE:
                    for (const parsedNode of parsedNodes) {
                        nodes[0].before(parsedNode);
                    }
                    break;
                case RelativePosition.AFTER:
                    for (const parsedNode of [...parsedNodes].reverse()) {
                        nodes[nodes.length - 1].after(parsedNode);
                    }
                    break;
                case RelativePosition.INSIDE:
                    for (const parsedNode of [...parsedNodes]) {
                        nodes[nodes.length - 1].append(parsedNode);
                    }
                    break;
            }
        });
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
    /**
     * Return the DOM Node(s) matching a VNode or a list of VNodes.
     *
     * @param node
     */
    getDomNodes(node: VNode | VNode[]): Node[] {
        const layout = this.editor.plugins.get(Layout);
        const domEngine = layout.engines.dom as DomLayoutEngine;
        let domNodes: Node[] = [];
        if (Array.isArray(node)) {
            for (const oneNode of node) {
                domNodes.push(...domEngine.getDomNodes(oneNode));
            }
        } else {
            domNodes = domEngine.getDomNodes(node);
        }
        return domNodes;
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
        const div = document.createElement('div');
        div.innerHTML = html;
        return parser.parse('dom/html', ...div.childNodes);
    }
}
