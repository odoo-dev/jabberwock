import { VNode } from '../../core/src/VNodes/VNode';
import {
    LayoutEngine,
    ComponentId,
    DomZonePosition,
    ComponentDefinition,
} from '../../plugin-layout/src/LayoutEngine';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { Direction, VSelectionDescription } from '../../core/src/VSelection';
import { DomSelectionDescription } from '../../plugin-dom-editable/src/EventNormalizer';
import JWEditor from '../../core/src/JWEditor';
import { DomReconciliationEngine } from './DomReconciliationEngine';
import { LayoutContainer } from './LayoutContainerNode';
import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { TagNode } from '../../core/src/VNodes/TagNode';
import { flat, isContentEditable } from '../../utils/src/utils';
import { Modifier } from '../../core/src/Modifier';
import { RenderingEngineCache } from '../../plugin-renderer/src/RenderingEngineCache';
import { ChangesLocations } from '../../core/src/Memory/Memory';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { RuleProperty } from '../../core/src/Mode';

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

    private _rendererCache: RenderingEngineCache<DomObject>;

    defaultRootComponent: ComponentDefinition = {
        id: 'editor',
        async render(): Promise<VNode[]> {
            const editor = new TagNode({ htmlTag: 'JW-EDITOR' });
            editor.append(new ZoneNode({ managedZones: ['main'] }));
            editor.append(new ZoneNode({ managedZones: ['default'] }));
            return [editor];
        },
    };

    //--------------------------------------------------------------------------
    // Lifecycle
    //--------------------------------------------------------------------------

    async start(): Promise<void> {
        for (const componentId in this.locations) {
            this.renderingMap[componentId] = [];
            this.componentZones[componentId] = ['root'];
            if (!this.componentDefinitions[componentId]) {
                throw new Error('Layout component "' + componentId + '" not found.');
            }
        }
        if (!flat(Object.values(this.componentZones)).includes('root')) {
            this.componentDefinitions.editor = this.defaultRootComponent;
            this.componentZones.editor = ['root'];
        }
        for (const componentId in this.componentDefinitions) {
            this._prepareLayoutContainerAndLocation(this.componentDefinitions[componentId]);
        }

        await super.start();
    }
    async stop(): Promise<void> {
        for (const componentId in this.componentDefinitions) {
            const location = this.locations[componentId];
            if (location) {
                const nodes = this.components[componentId];
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
        this._markedForRedraw = new Set();
        this.location = null;
        this.locations = {};
        this._rendererCache = null;
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
    async redraw(params?: ChangesLocations): Promise<void> {
        if (this._currentlyRedrawing) {
            throw new Error('Double redraw detected');
        }
        this._currentlyRedrawing = true;
        return this._redraw(params)
            .then(() => {
                this._currentlyRedrawing = false;
            })
            .catch(error => {
                this._currentlyRedrawing = false;
                throw error;
            });
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
        if (!start) {
            return;
        }
        const end = this._domReconciliationEngine.locate(
            selection.focusNode,
            selection.focusOffset,
        );
        if (!end) {
            return;
        }
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

    private async _redraw(
        params: ChangesLocations = {
            add: [],
            move: [],
            remove: [],
            update: [],
        },
    ): Promise<void> {
        const updatedNodes = [...this._getInvalidNodes(params)];

        const layout = this.editor.plugins.get(Renderer);
        const engine = layout.engines['object/html'] as DomObjectRenderingEngine;
        const cache = (this._rendererCache = await engine.render(
            updatedNodes,
            this._rendererCache,
            !!this._rendererCache,
        ));

        this._domReconciliationEngine.update(
            updatedNodes,
            cache.renderings,
            cache.locations,
            cache.renderingDependent,
            this._markedForRedraw,
        );
        this._markedForRedraw = new Set();

        // Append in dom if needed.
        for (const componentId in this.locations) {
            const nodes = this.components[componentId];
            const needInsert = nodes.find(node => {
                const domNodes = this._domReconciliationEngine.toDom(node);
                return !domNodes.length || domNodes.some(node => !node.parentNode);
            });
            if (needInsert) {
                this._appendComponentInDom(componentId);
            }
        }

        this._renderSelection();
    }
    /**
     * Get the invalidated nodes in the rendering.
     * Clear the renderer in cache for this node or modifier. The cache
     * renderer is added only for performance at redrawing time. The
     * invalidation are automatically made from memory changes.
     */
    private _getInvalidNodes(diff: ChangesLocations): Set<VNode> {
        const cache = this._rendererCache;
        const remove = new Set<VNode>();
        const update = new Set<VNode>();
        const updatedModifiers = new Set<Modifier>();
        const updatedSiblings = new Set<VNode>();

        const add = new Set<VNode>();

        // Add new nodes for redrawing it.
        for (const object of diff.add) {
            if (object instanceof AbstractNode) {
                add.add(object as VNode);
            } else if (object instanceof Modifier) {
                updatedModifiers.add(object);
            }
        }
        // Add re-inserted nodes (after unfo for eg) for redrawing it.
        // Can be marked as moved because its elements still contain references.
        for (const object of diff.move) {
            if (
                object instanceof AbstractNode &&
                object.parent &&
                !add.has(object as VNode) &&
                !cache?.renderings.get(object as VNode)
            ) {
                add.add(object as VNode);
                for (const child of object.descendants()) {
                    add.add(child);
                }
            }
        }

        for (const node of add) {
            if (!node.parent) {
                add.delete(node);
                remove.add(node);
                if (node.childVNodes) {
                    for (const child of node.descendants()) {
                        add.delete(node);
                        remove.add(child);
                    }
                }
            }
        }

        if (cache) {
            // Select the removed VNode and Modifiers.
            const allRemove = new Set(diff.remove);
            for (const object of diff.remove) {
                if (object instanceof AbstractNode) {
                    remove.add(object as VNode);
                } else {
                    if (object instanceof Modifier) {
                        updatedModifiers.add(object);
                    }
                    for (const [parent] of this.editor.memory.getParents(object)) {
                        if (parent instanceof AbstractNode) {
                            update.add(parent as VNode);
                        } else if (parent instanceof Modifier) {
                            updatedModifiers.add(parent);
                        }
                    }
                }
            }
            const filterd = this._filterInRoot(new Set(remove));
            for (const node of filterd.remove) {
                update.delete(node);
                remove.add(node);
                if (node.childVNodes) {
                    for (const child of node.descendants()) {
                        remove.add(child);
                    }
                }
            }
            for (const node of filterd.keep) {
                update.add(node); // TODO: memory change to have real add and not add + move.
            }

            const needSiblings = new Set<AbstractNode>();

            // Filter to keep only update not added or removed nodes.
            const paramsUpdate: [object, string[] | number[] | void][] = [];
            diff.update.filter(up => {
                const object = up[0];
                if (up[1] && object instanceof AbstractNode && !object.parent) {
                    remove.add(object as VNode);
                    for (const child of object.descendants()) {
                        remove.add(child);
                    }
                } else if (!remove.has(object as VNode)) {
                    paramsUpdate.push(up);
                }
            });

            const mayBeAlreadyRemoved: VNode[] = [];

            // Select the updated VNode and Modifiers and the VNode siblings.
            // From the parent, select the removed VNode siblings.
            for (const [object, changes] of paramsUpdate) {
                if (
                    allRemove.has(object) ||
                    remove.has(object as VNode) ||
                    update.has(object as VNode) ||
                    updatedModifiers.has(object as Modifier)
                ) {
                    continue;
                }
                if (object instanceof AbstractNode) {
                    update.add(object as VNode);
                    needSiblings.add(object);
                    mayBeAlreadyRemoved.push(object as VNode);
                } else {
                    if (object instanceof Modifier) {
                        updatedModifiers.add(object);
                    }
                    for (const [parent, parentProp] of this.editor.memory.getParents(object)) {
                        if (parent instanceof AbstractNode) {
                            if (remove.has(parent as VNode)) {
                                // The node was already removed in an other memory slice.
                            } else if (!parent.parent) {
                                // An old removed node can change. For eg: move a children
                                // into the active VDocument.
                                remove.add(parent as VNode);
                                for (const child of parent.descendants()) {
                                    remove.add(child);
                                    update.delete(child);
                                }
                            } else if (
                                changes &&
                                parentProp[0][0] === 'childVNodes' &&
                                typeof changes[0] === 'number'
                            ) {
                                // If change a children (add or remove) redraw the node and
                                // siblings.
                                const childVNodes = parent.childVNodes;
                                for (let i = 0; i < changes.length; i++) {
                                    const index = changes[i] as number;
                                    const child = childVNodes[index];
                                    if (child) {
                                        if (!add.has(child)) {
                                            update.add(child);
                                            mayBeAlreadyRemoved.push(child);
                                        }
                                        if (changes[i - 1] !== index - 1) {
                                            const previous = child.previousSibling();
                                            if (
                                                previous &&
                                                !add.has(previous) &&
                                                !update.has(previous)
                                            ) {
                                                updatedSiblings.add(previous);
                                                mayBeAlreadyRemoved.push(previous);
                                            }
                                        }
                                        if (changes[i + 1] !== index + 1) {
                                            const next = child.nextSibling();
                                            if (next && !add.has(next) && !update.has(next)) {
                                                if (next) {
                                                    updatedSiblings.add(next);
                                                    mayBeAlreadyRemoved.push(next);
                                                }
                                            }
                                        }
                                    } else {
                                        const children = parent.children();
                                        if (children.length) {
                                            const last = children[children.length - 1];
                                            if (last && !add.has(last) && !update.has(last)) {
                                                updatedSiblings.add(last);
                                                mayBeAlreadyRemoved.push(last);
                                            }
                                        }
                                    }
                                }
                                update.add(parent as VNode);
                                mayBeAlreadyRemoved.push(parent as VNode);
                            } else {
                                update.add(parent as VNode);
                                needSiblings.add(parent);
                                mayBeAlreadyRemoved.push(parent as VNode);
                            }
                        } else if (parent instanceof Modifier) {
                            updatedModifiers.add(parent);
                        }
                    }
                }
            }

            for (const node of this._filterInRoot(new Set(mayBeAlreadyRemoved)).remove) {
                update.delete(node);
                remove.add(node);
                add.delete(node);
                needSiblings.delete(node);
                updatedSiblings.delete(node);
            }

            // If any change invalidate the siblings.
            for (const node of needSiblings) {
                const next = node.nextSibling();
                if (next) updatedSiblings.add(next);
                const previous = node.previousSibling();
                if (previous) updatedSiblings.add(previous);
            }

            // Invalidate compatible renderer cache.
            for (const node of update) {
                cache.cachedCompatibleRenderer.delete(node);
            }
            for (const node of remove) {
                cache.cachedCompatibleRenderer.delete(node);
            }

            // Add removed nodes modifiers for invalidation.
            for (const node of remove) {
                if (node.modifiers) {
                    // If the node is created after this memory slice (undo),
                    // the node has no values, no id, no modifiers... But the
                    // modifiers is inside the list of removed objects.
                    node.modifiers.map(modifier => updatedModifiers.add(modifier));
                }
            }

            // Invalidate compatible renderer cache and modifier compare cache.
            for (const modifier of updatedModifiers) {
                cache.cachedCompatibleModifierRenderer.delete(modifier);
                const id = cache.cachedModifierId.get(modifier);
                if (id) {
                    const keys = cache.cachedIsSameAsModifierIds[id];
                    if (keys) {
                        for (const key of keys) {
                            delete cache.cachedIsSameAsModifier[key];
                        }
                        delete cache.cachedIsSameAsModifierIds[id];
                    }
                }
            }

            // Add the siblings to invalidate the sibling groups.
            for (const sibling of updatedSiblings) {
                update.add(sibling);
            }

            // Get all linked and dependent VNodes and Modifiers to invalidate cache.
            const treated = new Set<DomObject>();
            const nodesOrModifiers = [...update, ...remove, ...updatedModifiers];
            const treatedItem = new Set<VNode | Modifier>(nodesOrModifiers);
            for (const nodeOrModifier of nodesOrModifiers) {
                const linkedRenderings = cache.nodeDependent.get(nodeOrModifier);
                if (linkedRenderings) {
                    for (const link of linkedRenderings) {
                        if (!treated.has(link)) {
                            treated.add(link);
                            const from = cache.renderingDependent.get(link);
                            if (from) {
                                for (const n of from) {
                                    if (!treatedItem.has(n)) {
                                        // Add to invalid domObject origin nodes or modifiers.
                                        nodesOrModifiers.push(n);
                                        treatedItem.add(n);
                                    }
                                }
                            }
                        }
                    }
                }
                const linkedNodes = cache.linkedNodes.get(nodeOrModifier);
                if (linkedNodes) {
                    for (const node of linkedNodes) {
                        if (!treatedItem.has(node)) {
                            // Add to invalid linked nodes of linkes nodes.
                            nodesOrModifiers.push(node);
                            treatedItem.add(node);
                        }
                    }
                }
                if (nodeOrModifier instanceof AbstractNode) {
                    update.add(nodeOrModifier);
                } else {
                    updatedModifiers.add(nodeOrModifier);
                }
            }

            // Remove all removed children from node to update.
            for (const node of remove) {
                update.delete(node);
            }

            // Invalidate VNode cache origin, location and linked.
            for (const node of [...update, ...remove]) {
                cache.renderingPromises.delete(node);
                const item = cache.renderings.get(node);
                if (item) {
                    const items = [item];
                    for (const item of items) {
                        cache.renderingDependent.delete(item);
                        cache.locations.delete(item);
                        if ('children' in item) {
                            for (const child of item.children) {
                                if (!(child instanceof AbstractNode)) {
                                    items.push(child);
                                }
                            }
                        }
                    }
                }
                cache.renderings.delete(node);
                cache.nodeDependent.delete(node);
                cache.linkedNodes.delete(node);
            }

            // Invalidate Modifiers cache linked.
            for (const modifier of updatedModifiers) {
                cache.nodeDependent.delete(modifier);
            }
        }
        for (const node of add) {
            update.add(node);
        }

        // Render nodes.
        return update;
    }
    private _filterInRoot(nodes: Set<VNode>): { keep: Set<VNode>; remove: Set<VNode> } {
        const inRoot = new Set<VNode>([this.root]);
        const notRoot = new Set<VNode>();
        const nodesInRoot = new Set<VNode>();
        const nodesInNotRoot = new Set<VNode>();
        for (const node of nodes) {
            const parents: VNode[] = [];
            let ancestor = node;
            while (ancestor) {
                parents.push(ancestor);
                if (inRoot.has(ancestor)) {
                    // The VNode is in the domLayout.
                    nodesInRoot.add(node);
                    break;
                }
                ancestor = ancestor.parent;
                if (!ancestor || !ancestor.id || notRoot.has(ancestor)) {
                    // A VNode without an id does not exist yet/anymore in the
                    // current memory slice.
                    // The VNode is not in the domLayout.
                    nodesInNotRoot.add(node);
                    break;
                }
            }
            if (nodesInRoot.has(node)) {
                for (const parent of parents) {
                    inRoot.add(parent);
                }
            } else {
                for (const parent of parents) {
                    notRoot.add(parent);
                }
            }
        }
        return { keep: nodesInRoot, remove: nodesInNotRoot };
    }
    /**
     * Render the given VSelection as a DOM selection in the given target.
     *
     * @param selection
     * @param target
     */
    private _renderSelection(): void {
        const selection = this.editor.selection;
        const range = selection.range;
        if (selection.range.isCollapsed()) {
            // Prevent rendering a collapsed selection in a non-editable context.
            const target =
                range.start.previousSibling() || range.end.nextSibling() || range.startContainer;
            const isEditable = this.editor.mode.is(target, RuleProperty.EDITABLE);
            const isInMain = target.ancestor(
                node => node instanceof ZoneNode && node.managedZones.includes('main'),
            );
            if ((!isEditable && !isContentEditable(target)) || !isInMain) {
                document.getSelection().removeAllRanges();
                return;
            }
        }
        const domNodes = this._domReconciliationEngine.toDom(selection.anchor.parent);
        if (!domNodes.length) {
            document.getSelection().removeAllRanges();
            return;
        }
        if (
            selection.anchor.ancestors().pop() !== this.root ||
            selection.focus.ancestors().pop() !== this.root
        ) {
            console.warn('Cannot render a selection that is outside the Layout.');
            document.getSelection().removeAllRanges();
        }
        const anchor = this._domReconciliationEngine.getLocations(selection.anchor);
        const focus = this._domReconciliationEngine.getLocations(selection.focus);

        const doc = anchor[0].ownerDocument;
        const domSelection = doc.getSelection();

        if (
            domSelection.anchorNode === anchor[0] &&
            domSelection.anchorOffset === anchor[1] &&
            domSelection.focusNode === focus[0] &&
            domSelection.focusOffset === focus[1]
        ) {
            return;
        }

        const domRange = doc.createRange();
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
        for (const node of this.components[id]) {
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
        if (zone?.includes('root')) {
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
