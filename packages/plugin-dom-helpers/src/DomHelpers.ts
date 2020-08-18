import { ExecutionContext } from './../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { VNode, RelativePosition } from '../../core/src/VNodes/VNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { Parser } from '../../plugin-parser/src/Parser';
import { Format } from '../../core/src/Format';

export class DomHelpers<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add a class or a list of classes to a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async addClass(
        context: ExecutionContext,
        domNode: Node | Node[],
        className: string | string[],
    ): Promise<void> {
        const domHelpersAddClass = async (): Promise<void> => {
            const classes = Array.isArray(className) ? className : [className];
            for (const node of this.getNodes(domNode)) {
                node.modifiers.get(Attributes).classList.add(...classes);
            }
        };
        return context.execCommand(domHelpersAddClass);
    }
    /**
     * Remove a class or a list of classes from a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async removeClass(
        context: ExecutionContext,
        domNode: Node | Node[],
        className: string | string[],
    ): Promise<void> {
        const domHelpersRemoveClass = async (): Promise<void> => {
            const classes = Array.isArray(className) ? className : [className];
            for (const node of this.getNodes(domNode)) {
                node.modifiers.find(Attributes)?.classList.remove(...classes);
                for (const modifier of node.modifiers.filter(Format)) {
                    modifier.modifiers.find(Attributes)?.classList.remove(...classes);
                }
            }
        };
        return context.execCommand(domHelpersRemoveClass);
    }
    /**
     * Add or remove a class or a list of classes from a DOM node or a list of
     * DOM nodes.
     *
     * @param params
     */
    async toggleClass(
        context: ExecutionContext,
        domNode: Node | Node[],
        className: string,
    ): Promise<void> {
        const domHelpersToggleClass = async (): Promise<void> => {
            const classes = Array.isArray(className) ? className : [className];
            for (const node of this.getNodes(domNode)) {
                node.modifiers.get(Attributes).classList.toggle(...classes);
            }
        };
        return context.execCommand(domHelpersToggleClass);
    }
    /**
     * Set an attribute on a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async setAttribute(
        context: ExecutionContext,
        domNode: Node | Node[],
        name: string,
        value: string,
    ): Promise<void> {
        const domHelpersSetAttribute = async (): Promise<void> => {
            for (const node of this.getNodes(domNode)) {
                node.modifiers.get(Attributes).set(name, value);
            }
        };
        return context.execCommand(domHelpersSetAttribute);
    }

    /**
     * Update the attributes with the given dictionnary and clear all previous
     * attributes.
     */
    async updateAttributes(
        context: ExecutionContext,
        domNode: Node | Node[],
        attributes: { [key: string]: string },
    ): Promise<void> {
        const domHelpersUpdateAttribute = async (): Promise<void> => {
            for (const node of this.getNodes(domNode)) {
                node.modifiers.get(Attributes).clear();
                for (const [name, value] of Object.entries(attributes)) {
                    node.modifiers.get(Attributes).set(name, value);
                }
            }
        };
        return context.execCommand(domHelpersUpdateAttribute);
    }
    /**
     * Set a style key/value pair on a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async setStyle(
        context: ExecutionContext,
        domNode: Node | Node[],
        name: string,
        value: string,
        important?: boolean,
    ): Promise<void> {
        const domHelpersSetStyle = async (): Promise<void> => {
            for (const node of this.getNodes(domNode)) {
                value = important ? value + ' !important' : value;
                node.modifiers.get(Attributes).style.set(name, value);
            }
        };
        return context.execCommand(domHelpersSetStyle);
    }
    /**
     * Remove a DOM node or a list of DOM nodes.
     *
     * @param params
     */
    async remove(
        context: ExecutionContext,

        domNode: Node | Node[],
    ): Promise<void> {
        const domHelpersRemove = async (): Promise<void> => {
            for (const node of this.getNodes(domNode)) {
                node.remove();
            }
        };
        return context.execCommand(domHelpersRemove);
    }
    /**
     * Remove the contents of a DOM node or of a list of DOM nodes.
     *
     * @param params
     */
    async empty(
        context: ExecutionContext,

        domNode: Node | Node[],
    ): Promise<void> {
        const domHelpersEmpty = async (): Promise<void> => {
            for (const node of this.getNodes(domNode)) {
                node.empty();
            }
        };
        return context.execCommand(domHelpersEmpty);
    }
    /**
     * Replace a DOM node or a list of DOM nodes with the given HTML content.
     *
     * @param params
     */
    async replace(context: ExecutionContext, domNodes: Node | Node[], html: string): Promise<void> {
        const domHelpersReplace = async (): Promise<void> => {
            const nodes = this.getNodes(domNodes);
            const parsedNodes = await this._parseHtmlString(html);
            const firstNode = nodes[0];
            for (const parsedNode of parsedNodes) {
                firstNode.before(parsedNode);
            }
            for (const node of nodes) {
                node.remove();
            }
        };
        return context.execCommand(domHelpersReplace);
    }
    /**
     * Wrap the given HTML content within a DOM container.
     *
     * @param params
     */
    async wrap(context: ExecutionContext, domContainer: Node, html: string): Promise<void> {
        const domHelpersWrap = async (): Promise<void> => {
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
        };
        return context.execCommand(domHelpersWrap);
    }
    /**
     * Move a DOM Node before another.
     *
     * @param params
     */
    async moveBefore(context: ExecutionContext, fromDomNode: Node, toDomNode: Node): Promise<void> {
        const domHelpersMoveBefore = async (): Promise<void> => {
            const toNode = this.getNodes(toDomNode)[0];
            for (const fromNode of this.getNodes(fromDomNode)) {
                fromNode.before(toNode);
            }
        };
        return context.execCommand(domHelpersMoveBefore);
    }
    /**
     * Move a DOM Node after another.
     *
     * @param params
     */
    async moveAfter(context: ExecutionContext, fromDomNode: Node, toDomNode: Node): Promise<void> {
        const domHelpersMoveAfter = async (): Promise<void> => {
            const toNodes = this.getNodes(toDomNode);
            const toNode = toNodes[toNodes.length - 1];
            for (const fromNode of this.getNodes(fromDomNode).reverse()) {
                fromNode.after(toNode);
            }
        };
        return context.execCommand(domHelpersMoveAfter);
    }
    /**
     * Insert html content before, after or inside a DOM Node. If no DOM Node
     * was provided, empty the range and insert the html content before the it.
     *
     * @param params
     */
    async insertHtml(
        context: ExecutionContext,
        html: string,
        domNode?: Node,
        position?: RelativePosition,
    ): Promise<VNode[]> {
        let parsedNodes: VNode[];
        await context.execCommand(async () => {
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
