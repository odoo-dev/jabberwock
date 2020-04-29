import { VNode, RelativePosition, Point } from '../../../core/src/VNodes/VNode';
import {
    LayoutEngine,
    ComponentId,
    DomZonePosition,
    ComponentDefinition,
} from '../../../plugin-layout/src/LayoutEngine';
import { Parser } from '../../../plugin-parser/src/Parser';
import { ParsingEngine } from '../../../plugin-parser/src/ParsingEngine';
import { Renderer } from '../../../plugin-renderer/src/Renderer';
import { RenderingEngine } from '../../../plugin-renderer/src/RenderingEngine';
import { ZoneNode, ZoneIdentifier } from '../../../plugin-layout/src/ZoneNode';
import { nodeLength } from '../../../utils/src/utils';
import { Direction, VSelectionDescription } from '../../../core/src/VSelection';
import { ContainerNode } from '../../../core/src/VNodes/ContainerNode';
import { LayoutContainer } from './LayoutContainerNode';
import { MarkerNode } from '../../../core/src/VNodes/MarkerNode';
import { DomMap, DomPoint } from './DomMap';
import { DomSelectionDescription } from '../../../plugin-dom-editable/src/EventNormalizer';
import JWEditor from '../../../core/src/JWEditor';

export type DomLayoutLocation = [Node, DomZonePosition];

export class DomLayoutEngine extends LayoutEngine {
    readonly id = 'dom';
    private readonly _domMap = new DomMap();
    // used only to develop and avoid wrong promise from commands
    private _currentlyRedrawing = false;

    private renderingMap: Record<ComponentId, Node[]> = {};
    location: [Node, DomZonePosition];
    locations: Record<ComponentId, DomLayoutLocation> = {};

    defaultRootComponent: ComponentDefinition = {
        id: 'editor',
        render(editor: JWEditor): Promise<VNode[]> {
            const layout = '<jw-editor><t t-zone="main"/><t t-zone="default"/></jw-editor>';
            return editor.plugins.get(Parser).parse('html', layout);
        },
    };

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    async start(): Promise<void> {
        for (const componentId in this.locations) {
            this.renderingMap[componentId] = [];
            this.componentZones[componentId] = 'root';
            if (!this.componentDefinitions[componentId]) {
                throw new Error('Layout component "' + componentId + '" not found.');
            }
        }
        if (!Object.values(this.componentZones).includes('root')) {
            this.componentDefinitions.editor = this.defaultRootComponent;
            this.componentZones.editor = 'root';
        }
        for (const componentId in this.componentDefinitions) {
            this._prepareLayoutContainerAndLocation(this.componentDefinitions[componentId]);
        }

        await super.start();
        await this.redraw();
    }
    async stop(): Promise<void> {
        for (const componentId in this.componentDefinitions) {
            const location = this.locations[componentId];
            if (location) {
                const nodes = this.components.get(componentId);
                for (const node of nodes) {
                    const domNodes = this.getDomNodes(node);
                    if (location[1] === 'replace') {
                        // Undo the replace that was done by the layout engine.
                        let first = domNodes && domNodes[0];
                        if (!first) {
                            first = this.renderingMap[componentId][0];
                        }
                        if (first && first.parentNode) {
                            first.parentNode.insertBefore(location[0], first);
                        }
                    }
                    for (const domNode of domNodes) {
                        if (domNode.parentNode) {
                            domNode.parentNode.removeChild(domNode);
                        }
                    }
                }
            }
        }
        this._domMap.clear();
        this.renderingMap = {};
        this.location = null;
        this.locations = {};
        return super.stop();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return the VNode(s) corresponding to the given DOM Node.
     *
     * @param Node
     */
    getNodes(domNode: Node): VNode[] {
        const nodes = this._domMap.fromDom(domNode) || [];
        return nodes.filter(node => !(node instanceof ZoneNode));
    }
    getDomNodes(node: VNode): Node[] {
        if (node instanceof LayoutContainer) {
            return node.childVNodes.map(node => this.getDomNodes(node)).flat();
        } else {
            return this._domMap.toDom(node);
        }
    }
    /**
     * Redraw the layout component after insertion.
     * If the target zone is the root, prepare its location before redrawing.
     *
     * @override
     */
    async add(componentId: ComponentId, zoneId: ZoneIdentifier): Promise<VNode[]> {
        const nodes = await super.add(componentId, zoneId);
        // Filter out children of nodes that we are already going to redraw.
        const nodeToRedraw = nodes.filter(node => !node.ancestor(n => nodes.includes(n)));
        for (const node of nodeToRedraw) {
            // only used if the zone want to return a Node but hide the component (eg: a panel)
            await this.redraw(node);
        }
        return nodes;
    }
    /**
     * Redraw the layout component after removal.
     *
     * @override
     */
    async remove(componentId: ComponentId): Promise<ZoneNode[]> {
        const zones = await super.remove(componentId);
        for (const zone of zones) {
            await this.redraw(zone);
        }
        return zones;
    }
    /**
     * Redraw the layout component after showing the component.
     *
     * @override
     */
    async show(componentId: ComponentId): Promise<VNode[]> {
        const nodes = await super.show(componentId);
        for (const node of nodes) {
            await this.redraw(node.ancestor(ZoneNode));
        }
        return nodes;
    }
    /**
     * Redraw the layout component after hidding the component.
     *
     * @override
     */
    async hide(componentId: ComponentId): Promise<VNode[]> {
        const nodes = await super.hide(componentId);
        for (const node of nodes) {
            await this.redraw(node.ancestor(ZoneNode));
        }
        return nodes;
    }
    async redraw(node?: VNode): Promise<void> {
        if (this._currentlyRedrawing) {
            throw new Error('Double redraw detected');
        }
        this._currentlyRedrawing = true;
        // Find the closest node that has already been rendered preciously.
        const nodeToRedraw = node?.closest(n => {
            const domNode = this._domMap.toDom(n).pop();
            return domNode?.ownerDocument.body.contains(domNode);
        });

        if (nodeToRedraw) {
            // redraw item
            const domNodeToRedraw = this._domMap.toDom(nodeToRedraw).pop();
            let componentIdentifier: ComponentId;
            for (const [componentId, nodes] of this.components) {
                if (nodes.includes(nodeToRedraw)) {
                    componentIdentifier = componentId;
                    break;
                }
            }
            if (this.locations[componentIdentifier]) {
                await this._renderNode(nodeToRedraw);
                await this._appendComponentInDom(componentIdentifier);
            } else {
                const parentNode = domNodeToRedraw.parentNode;
                const domNodes = await this._renderNode(nodeToRedraw);
                for (const domNode of domNodes) {
                    if (domNode !== domNodeToRedraw) {
                        parentNode.insertBefore(domNode, domNodeToRedraw);
                    }
                }
                const last = domNodes?.length && domNodes[domNodes.length - 1];
                if (last !== domNodeToRedraw) {
                    parentNode.removeChild(domNodeToRedraw);
                }
            }
        } else {
            // redraw all
            for (const componentId in this.locations) {
                const nodes = this.components.get(componentId);
                for (const node of nodes) {
                    await this._renderNode(node);
                }
                await this._appendComponentInDom(componentId);
            }
        }
        this._renderSelection();
        this._currentlyRedrawing = false;
    }
    async parseElement(element: HTMLElement): Promise<VNode[]> {
        const parser = this.editor.plugins.get(Parser);
        const domParserEngine = parser.engines.dom as ParsingEngine<Node>;
        const parsedVNodes = await domParserEngine.parse(element);

        // Construct DOM map from the parsing in order to parse the selection.
        for (const node of parsedVNodes) {
            this._domMap.set(node, element);
        }
        for (const [domNode, nodes] of domParserEngine.parsingMap) {
            for (const node of nodes) {
                this._domMap.set(node, domNode);
            }
        }

        const domSelection = element.ownerDocument.getSelection();
        const anchorNode = domSelection.anchorNode;
        if (element === anchorNode || element.contains(anchorNode)) {
            const selection = this.parseSelection(domSelection);
            this.editor.selection.set(selection);
        }
        return parsedVNodes;
    }
    /**
     * Parse the dom selection into the description of a VSelection.
     *
     * @param selection
     * @param [direction]
     */
    parseSelection(selection: Selection | DomSelectionDescription): VSelectionDescription {
        const start = this._locate(selection.anchorNode, selection.anchorOffset);
        const end = this._locate(selection.focusNode, selection.focusOffset);
        const [startVNode, startPosition] = start;
        const [endVNode, endPosition] = end;

        let direction: Direction;
        if (selection instanceof Selection) {
            const domRange = selection.rangeCount && selection.getRangeAt(0);
            if (
                domRange.startContainer === selection.anchorNode &&
                domRange.startOffset === selection.anchorOffset
            ) {
                direction = Direction.FORWARD;
            } else {
                direction = Direction.BACKWARD;
            }
        } else {
            direction = selection.direction;
        }

        return {
            anchorNode: startVNode,
            anchorPosition: startPosition,
            focusNode: endVNode,
            focusPosition: endPosition,
            direction: direction,
        };
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Render the given VSelection as a DOM selection in the given target.
     *
     * @param selection
     * @param target
     */
    private _renderSelection(): void {
        const selection = this.editor.selection;
        const domNode = this._domMap.toDom(selection.anchor.parent)[0];
        if (!domNode) {
            return;
        }
        const document = domNode.ownerDocument;
        const anchor = this._getDomLocation(selection.anchor);
        const focus = this._getDomLocation(selection.focus);
        const domSelection = document.getSelection();

        if (
            domSelection.anchorNode === anchor[0] &&
            domSelection.anchorOffset === anchor[1] &&
            domSelection.focusNode === focus[0] &&
            domSelection.focusOffset === focus[1]
        ) {
            return;
        }

        const domRange = document.createRange();
        if (selection.direction === Direction.FORWARD) {
            domRange.setStart(anchor[0], anchor[1]);
            domRange.collapse(true);
        } else {
            domRange.setEnd(anchor[0], anchor[1]);
            domRange.collapse(false);
        }
        domSelection.removeAllRanges();
        domSelection.addRange(domRange);
        domSelection.extend(focus[0], focus[1]);
    }
    private async _appendComponentInDom(id: ComponentId): Promise<void> {
        let [target, position] = this.locations[id];
        const nodes = this.renderingMap[id];
        const first = nodes.find(node => node.parentNode && node.ownerDocument.body.contains(node));

        if (first?.previousSibling) {
            target = first.previousSibling;
            position = 'after';
        } else if (first?.parentNode?.parentNode) {
            target = first.parentNode;
            position = 'prepend';
        } else {
            let previous = id;
            while ((previous = this._getPreviousComponentId(previous))) {
                const last = this.renderingMap[previous][this.renderingMap[previous].length - 1];
                if (last && last.ownerDocument.body.contains(last)) {
                    target = last;
                    position = 'after';
                }
            }
        }

        if (position === 'after' && !target.parentNode) {
            throw new Error('Impossible to render a component after an element with no parent.');
        }
        if (position === 'replace' && !target.parentNode) {
            throw new Error('Impossible to replace an element without any parent.');
        }

        const domNodes = [];
        for (const node of this.components.get(id)) {
            domNodes.push(...this.getDomNodes(node));
        }
        if (!domNodes.length && this.locations[id][1] === 'replace') {
            throw new Error('Impossible to replace a element with an empty template.');
        }

        if (position === 'after') {
            if (target.nextSibling) {
                for (const domNode of domNodes) {
                    target.parentNode.insertBefore(domNode, target.nextSibling);
                }
            } else {
                for (const domNode of domNodes) {
                    target.parentNode.appendChild(domNode);
                }
            }
        } else if (position === 'prepend') {
            const firstChild = target.firstChild;
            for (const domNode of domNodes) {
                target.insertBefore(domNode, firstChild);
            }
        } else if (position === 'replace') {
            for (const domNode of domNodes) {
                target.parentNode.insertBefore(domNode, target);
            }
            target.parentNode.removeChild(target);
        } else {
            for (const domNode of domNodes) {
                target.appendChild(domNode);
            }
        }

        for (const node of this.renderingMap[id]) {
            if (node.parentNode) {
                node.parentNode.removeChild(node);
            }
        }

        this.renderingMap[id] = domNodes;
    }
    private _getPreviousComponentId(id: ComponentId): ComponentId {
        const [target, position] = this.locations[id];
        const locations = Object.values(this.locations);
        const componentIds = Object.keys(this.locations);
        const index = componentIds.indexOf(id);
        if (position === 'after') {
            for (let u = index - 1; u >= 0; u--) {
                const [otherTarget, otherPosition] = locations[u];
                if (
                    target === otherTarget &&
                    (otherPosition === 'after' || otherPosition === 'replace')
                ) {
                    return componentIds[u];
                }
            }
            for (let u = locations.length - 1; u > index; u--) {
                const [otherTarget, otherPosition] = locations[u];
                if (target === otherTarget && otherPosition === 'replace') {
                    return componentIds[u];
                }
            }
        } else if (position === 'replace') {
            for (let u = index - 1; u >= 0; u--) {
                const [otherTarget, otherPosition] = locations[u];
                if (target === otherTarget && otherPosition === 'replace') {
                    return componentIds[u];
                }
            }
        }
    }
    /**
     * Return a position in the VNodes as a tuple containing a reference
     * node and a relative position with respect to this node ('BEFORE' or
     * 'AFTER'). The position is always given on the leaf.
     *
     * @param container
     * @param offset
     */
    private _locate(domNode: Node, domOffset: number): Point {
        let forceAfter = false;
        let forcePrepend = false;
        let container = domNode.childNodes[domOffset] || domNode;
        let offset = container === domNode ? domOffset : 0;
        if (container === domNode && container.childNodes.length) {
            container = container.childNodes[container.childNodes.length - 1];
            offset = nodeLength(container);
            forceAfter = true;
        }
        while (!this.getNodes(container).length) {
            forceAfter = false;
            forcePrepend = false;
            if (container.previousSibling) {
                forceAfter = true;
                container = container.previousSibling;
                offset = nodeLength(container);
            } else {
                forcePrepend = true;
                offset = [].indexOf.call(container.parentNode.childNodes, container);
                container = container.parentNode;
            }
        }

        // When targetting the end of a node, the DOM gives an offset that is
        // equal to the length of the container. In order to retrieve the last
        // descendent, we need to make sure we target an existing node, ie. an
        // existing index.
        const isAfterEnd = offset >= nodeLength(container);
        let index = isAfterEnd ? nodeLength(container) - 1 : offset;
        // Move to deepest child of container.
        while (container.hasChildNodes()) {
            const child = container.childNodes[index];
            if (!this.getNodes(child).length) {
                break;
            }
            container = child;
            index = isAfterEnd ? nodeLength(container) - 1 : 0;
            // Adapt the offset to be its equivalent within the new container.
            offset = isAfterEnd ? nodeLength(container) : index;
        }

        const nodes = this.getNodes(container);

        // Get the VNodes matching the container.
        let reference: VNode;
        if (container.nodeType === Node.TEXT_NODE) {
            // The reference is the index-th match (eg.: text split into chars).
            reference = forceAfter ? nodes[nodes.length - 1] : nodes[index];
        } else {
            reference = nodes[0];
        }
        if (forceAfter) {
            return [reference, RelativePosition.AFTER];
        }
        if (forcePrepend && reference.is(ContainerNode)) {
            return [reference, RelativePosition.INSIDE];
        }

        return reference.locate(container, offset);
    }
    /**
     * Return the location in the DOM corresponding to the location in the
     * VDocument of the given VNode. The location in the DOM is expressed as a
     * tuple containing a reference Node and a relative position with respect to
     * the reference Node.
     *
     * @param node
     */
    private _getDomLocation(node: MarkerNode): DomPoint {
        let reference = node.previousSibling();
        let position = RelativePosition.AFTER;
        if (reference) {
            reference = reference.lastLeaf();
        } else {
            reference = node.nextSibling();
            position = RelativePosition.BEFORE;
            if (reference) {
                reference = reference.firstLeaf();
            }
        }
        if (!reference) {
            reference = node.parent;
            position = RelativePosition.INSIDE;
        }
        // If the given position is "before", the reference DOM Node is the first
        // DOM node matching the given VNode.
        // If the given position is "after", the reference DOM Node is the last DOM
        // node matching the given VNode.
        const locations = this._domMap.toDomPoint(reference);
        const locationIndex = position === RelativePosition.BEFORE ? 0 : locations.length - 1;
        let [domNode, offset] = locations[locationIndex];
        if (domNode.nodeType === Node.TEXT_NODE && offset === -1) {
            // This -1 is a hack to accomodate the VDocumentMap to the new
            // rendering process without altering it for the parser.
            offset = this._domMap.fromDom(domNode).indexOf(reference);
        } else if (position === RelativePosition.INSIDE && offset === -1) {
            offset = 0;
        } else {
            // Char nodes have their offset in the corresponding text nodes
            // registered in the map via `set` but void nodes don't. Their
            // location need to be computed with respect to their parents.
            const container = domNode.parentNode;
            offset = Array.prototype.indexOf.call(container.childNodes, domNode);
            domNode = container;
        }
        if (position === RelativePosition.AFTER) {
            // Increment the offset to be positioned after the reference node.
            offset += 1;
        }
        return [domNode, offset];
    }
    private async _renderNode(node: VNode): Promise<Node[]> {
        const renderer = this.editor.plugins.get(Renderer);
        const domRendererEngine = renderer.engines.dom as RenderingEngine<Node[]>;

        // Clear the rendering cache and update the rendering.
        domRendererEngine.renderings.clear();
        const domNodes = await renderer.render<Node[]>('dom', node);

        // Put the rendered nodes into the map.
        let child = node.lastLeaf();
        while (child) {
            const renderings = domRendererEngine.renderings.get(child);
            if (renderings) {
                const rendering = renderings[renderings.length - 1];
                const renderedNodes = await rendering[1];

                // Remove from cache to update with the newest nodes.
                this._domMap.clear(child);

                // Add in cache.
                for (const domNode of renderedNodes) {
                    this._domMap.set(child, domNode, -1, 'unshift');
                }
            }
            child = child.previous();
        }

        return domNodes || [];
    }
    private _prepareLayoutContainerAndLocation(componentDefinition: ComponentDefinition): void {
        const zone = this.componentZones[componentDefinition.id];
        if (zone === 'root') {
            // automatically wrap the child into a layoutContainer to keep location of all nodes
            // when update the template and redraw
            this.componentDefinitions[componentDefinition.id] = {
                id: componentDefinition.id,
                async render(editor: JWEditor): Promise<LayoutContainer[]> {
                    const nodes = await componentDefinition.render(editor);
                    const layoutContainer = new LayoutContainer();
                    layoutContainer.append(...nodes);
                    return [layoutContainer];
                },
            };
            if (this.location) {
                if (!this.locations[componentDefinition.id]) {
                    this.locations[componentDefinition.id] = this.location;
                    this.renderingMap[componentDefinition.id] = [];
                }
            }
        }
    }
}
