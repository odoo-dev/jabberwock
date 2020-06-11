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
import { ZoneNode, ZoneIdentifier } from '../../../plugin-layout/src/ZoneNode';
import { nodeLength } from '../../../utils/src/utils';
import { Direction, VSelectionDescription } from '../../../core/src/VSelection';
import { ContainerNode } from '../../../core/src/VNodes/ContainerNode';
import { DomMap } from './DomMap';
import { DomSelectionDescription } from '../../../plugin-dom-editable/src/EventNormalizer';
import JWEditor from '../../../core/src/JWEditor';
import { DomReconciliationEngine } from './DomReconciliationEngine';
import { LayoutContainer } from './LayoutContainerNode';
import { DomObject } from '../../../plugin-html/src/DomObjectRenderingEngine';

export type DomPoint = [Node, number];
export type DomLayoutLocation = [Node, DomZonePosition];

export class DomLayoutEngine extends LayoutEngine {
    static readonly id = 'dom';
    readonly _domReconciliationEngine = new DomReconciliationEngine();

    // used only to develop and avoid wrong promise from commands
    private _currentlyRedrawing = false;

    private renderingMap: Record<ComponentId, Node[]> = {};
    private _markedForRedraw = new Set<Node>();
    location: [Node, DomZonePosition];
    locations: Record<ComponentId, DomLayoutLocation> = {};

    defaultRootComponent: ComponentDefinition = {
        id: 'editor',
        render(editor: JWEditor): Promise<VNode[]> {
            const layout = '<jw-editor><t t-zone="main"/><t t-zone="default"/></jw-editor>';
            return editor.plugins.get(Parser).parse('text/html', layout);
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
                    const domNodes = this._domReconciliationEngine.toDom(node);
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
                }
            }
        }
        this.renderingMap = {};
        this.location = null;
        this.locations = {};
        this._domReconciliationEngine.clear();
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
        return this._domReconciliationEngine.fromDom(domNode);
    }
    /**
     * Return the DOM Node(s) corresponding to the given VNode.
     *
     * @param node
     */
    getDomNodes(node: VNode): Node[] {
        return this._domReconciliationEngine.toDom(node);
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
    async redraw(...nodes: VNode[]): Promise<void> {
        if (
            !this.editor.enableRender ||
            (this.editor.preventRenders && this.editor.preventRenders.size)
        ) {
            return;
        }
        if (this._currentlyRedrawing) {
            throw new Error('Double redraw detected');
        }
        this._currentlyRedrawing = true;

        if (nodes.length) {
            for (const index in nodes) {
                let node = nodes[index];
                while (
                    (this._domReconciliationEngine.getRenderedWith(node).length !== 1 ||
                        !this._domReconciliationEngine.toDom(node).length) &&
                    node.parent
                ) {
                    // If the node are redererd with some other nodes then redraw parent.
                    // If not in layout then redraw the parent.
                    node = nodes[index] = node.parent;
                }
            }
        } else {
            // Redraw all.
            for (const componentId in this.locations) {
                nodes.push(...this.components.get(componentId));
            }
        }

        nodes = nodes.filter(node => {
            const ancestor = node.ancestors(ZoneNode).pop();
            return ancestor?.managedZones.includes('root');
        });

        // TODO: adapt when add memory
        for (const node of nodes) {
            if (node instanceof ContainerNode) {
                nodes.push(...node.childVNodes);
            }
        }

        // Render nodes.
        const renderer = this.editor.plugins.get(Renderer);
        const map = new Map<VNode, DomObject>();
        const renderings = await renderer.render<DomObject>('dom/object', nodes);
        for (const index in nodes) {
            map.set(nodes[index], renderings[index]);
        }
        const locations = renderer.engines['dom/object'].locations as Map<DomObject, VNode[]>;
        this._domReconciliationEngine.update(map, locations, this._markedForRedraw);
        this._markedForRedraw = new Set();

        // Append in dom if needed.
        for (const componentId in this.locations) {
            const nodes = this.components.get(componentId);
            const needInsert = nodes.find(node => {
                const domNodes = this._domReconciliationEngine.toDom(node);
                return !domNodes.length || domNodes.some(node => !node.parentNode);
            });
            if (needInsert) {
                this._appendComponentInDom(componentId);
            }
        }

        this._renderSelection();
        this._currentlyRedrawing = false;
    }
    async parseElement(element: HTMLElement): Promise<VNode[]> {
        const parser = this.editor.plugins.get(Parser);
        const domParserEngine = parser.engines['dom/html'] as ParsingEngine<Node>;
        const parsedVNodes = await domParserEngine.parse(element);
        const domSelection = element.ownerDocument.getSelection();
        const anchorNode = domSelection.anchorNode;
        if (element === anchorNode || element.contains(anchorNode)) {
            const domMap = new DomMap();

            // Construct DOM map from the parsing in order to parse the selection.
            for (const node of parsedVNodes) {
                domMap.set(node, element);
            }
            for (const [domNode, nodes] of domParserEngine.parsingMap) {
                for (const node of nodes) {
                    domMap.set(node, domNode);
                }
            }

            const _locate = (domNode: Node, domOffset: number): Point => {
                /**
                 * Return a position in the VNodes as a tuple containing a reference
                 * node and a relative position with respect to this node ('BEFORE' or
                 * 'AFTER'). The position is always given on the leaf.
                 *
                 * @param container
                 * @param offset
                 */
                let forceAfter = false;
                let forcePrepend = false;
                let container = domNode.childNodes[domOffset] || domNode;
                let offset = container === domNode ? domOffset : 0;
                if (container === domNode && container.childNodes.length) {
                    container = container.childNodes[container.childNodes.length - 1];
                    offset = nodeLength(container);
                    forceAfter = true;
                }
                while (!domMap.fromDom(container)) {
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
                    if (!domMap.fromDom(child)) {
                        break;
                    }
                    container = child;
                    index = isAfterEnd ? nodeLength(container) - 1 : 0;
                    // Adapt the offset to be its equivalent within the new container.
                    offset = isAfterEnd ? nodeLength(container) : index;
                }

                const nodes = domMap.fromDom(container);

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
            };

            // Parse the dom selection into the description of a VSelection.
            const start = _locate(domSelection.anchorNode, domSelection.anchorOffset);
            const end = _locate(domSelection.focusNode, domSelection.focusOffset);
            const [startVNode, startPosition] = start;
            const [endVNode, endPosition] = end;
            let direction: Direction;
            if (domSelection instanceof Selection) {
                const domRange = domSelection.rangeCount && domSelection.getRangeAt(0);
                if (
                    domRange.startContainer === domSelection.anchorNode &&
                    domRange.startOffset === domSelection.anchorOffset
                ) {
                    direction = Direction.FORWARD;
                } else {
                    direction = Direction.BACKWARD;
                }
            }
            const selection: VSelectionDescription = {
                anchorNode: startVNode,
                anchorPosition: startPosition,
                focusNode: endVNode,
                focusPosition: endPosition,
                direction: direction,
            };
            this.editor.selection.set(selection);

            domMap.clear();
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
        const start = this._domReconciliationEngine.locate(
            selection.anchorNode,
            selection.anchorOffset,
        );
        const end = this._domReconciliationEngine.locate(
            selection.focusNode,
            selection.focusOffset,
        );
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
    markForRedraw(domNodes: Set<Node>): void {
        for (const domNode of domNodes) {
            this._markedForRedraw.add(domNode);
        }
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
        const domNodes = this._domReconciliationEngine.toDom(selection.anchor.parent);
        if (!domNodes.length) {
            return;
        }
        const anchor = this._domReconciliationEngine.getLocations(selection.anchor);
        const focus = this._domReconciliationEngine.getLocations(selection.focus);

        const document = anchor[0].ownerDocument;
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
    private _appendComponentInDom(id: ComponentId): void {
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

        const domNodes: Node[] = [];
        for (const node of this.components.get(id)) {
            domNodes.push(...this._domReconciliationEngine.toDom(node));
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
            let item: Node = target.firstChild;
            for (const domNode of domNodes) {
                if (!item) {
                    target.appendChild(domNode);
                } else if (domNode !== item) {
                    target.insertBefore(domNode, item);
                } else {
                    item = domNode.nextSibling;
                }
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
            if (node.parentNode && !domNodes.includes(node)) {
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
