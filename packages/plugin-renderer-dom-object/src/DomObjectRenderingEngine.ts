import { RenderingEngine, RenderingIdentifier } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultDomObjectRenderer } from './DefaultDomObjectRenderer';
import { DefaultDomObjectModifierRenderer } from './DefaultDomObjectModifierRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { Modifier } from '../../core/src/Modifier';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { RuleProperty } from '../../core/src/Mode';
import {
    RenderingEngineWorker,
    RenderingEngineCache,
} from '../../plugin-renderer/src/RenderingEngineCache';

/**
 * Renderer a node can define the location when define the nodes attributes.
 *
 * Object = {
 *  tag: 'DIV',
 *  children: [
 *    { tag: 'A' },
 *    { tag: 'B' },
 *    { tag: 'C' },
 *  ],
 * };
 * Which renders: <div><a/><b/><c/></div>
 *
 * In this case, the location BEFORE come from:
 *      |<div><a/><b/><c/></div>
 * If not container:
 *      <div>[<a/>]<b/><c/></div>
 *      <div><a/>[<b/>]<c/></div>
 *
 * In this case, the location INSIDE come from (if container):
 *      <div>[<a/>]<b/><c/></div>
 *      <div><a/>[<b/>]<c/></div>
 *      <div><a/><b/>[<c/>]</div>
 *
 * In this case, the location AFTER come from:
 *      <div><a/><b/><c/></div>|
 * If not container:
 *      <div><a/><b/>[<c/>]</div>
 *      <div><a/><b/><c/>|</div>
 *
 * ----------------------------------------
 *
 * Object = {
 *  tag: 'DIV',
 *  children: [
 *    { tag: 'A' },
 *    { tag: 'B' },
 *    { tag: 'C' },
 *    { tag: 'D' },
 *  ],
 * };
 * Which renders: <div><a/><b/><c/><d/></div>
 *
 * In this case, the location BEFORE come from:
 *      |<div><a/><b/><c/><d/></div>
 * If not container:
 *      <div>[<a/>]<b/><c/><d/></div>
 *      <div><a/>[<b/>]<c/><d/></div>
 *      <div><a/><b/>[<c/>]<d/></div>
 *
 * In this case, the location INSIDE come from (if container):
 *      <div>[<a/>]<b/><c/><d/></div>
 *      <div><a/>[<b/>]<c/><d/></div>
 *      <div><a/><b/>[<c/>]<d/></div>
 *      <div><a/><b/><c/>[<d/>]</div>
 *      <div><a/><b/><c/><d/>|</div>
 *
 * In this case, the location AFTER come from:
 *      <div><a/><b/><c/><d/></div>|
 * If not container:
 *      <div><a/><b/>[<c/>]<d/></div>
 *      <div><a/><b/><c/>[<d/>]</div>
 *      <div><a/><b/><c/><d/>|</div>
 *
 * ----------------------------------------
 *
 * Object = {
 *  tag: 'DIV',
 *  children: [
 *    { tag: 'A' },
 *    { tag: 'B' },
 *    { tag: 'C' },
 *  ],
 * };
 * Which renders: <div><a/><b/><c/></div>
 *
 * With the following `locate`call:
 * this.engine.locate([node], Object.children[0])
 *
 * In this case, the location BEFORE come from:
 *      |<div><a/><b/><c/></div>
 *      <div>[<a/>]<b/><c/></div>
 *      <div><a/><b/><c/></div>
 *
 * In this case, the location AFTER come from:
 *      <div><a/>[<b/>]<c/></div>
 *      <div><a/><b/>[<c/>]</div>
 *      <div><a/><b/><c/>|</div>
 *      <div><a/><b/><c/></div>|
 *
 * ----------------------------------------
 *
 * Object = {
 *  tag: 'DIV',
 *  children: [
 *    { tag: 'A' },
 *    { tag: 'B' },
 *    { tag: 'C' },
 *  ],
 * };
 * Which renders: <div><a/><b/><c/></div>
 *
 * With the following `locate`calls:
 * this.engine.locate([node], Object.children[0])
 * this.engine.locate([node], Object.children[1])
 *
 * In this case, the location BEFORE come from:
 *      |<div><a/><b/><c/></div>
 *      <div>[<a/>]<b/><c/></div>
 *      <div><a/><b/>[<c/>]</div>
 *
 * In this case, the location AFTER come from:
 *      <div><a/>[<b/>]<c/></div>
 *      <div><a/><b/><c/>|</div>
 *      <div><a/><b/><c/></div>|
 *
 * ----------------------------------------
 *
 * Object = {
 *  children: [
 *    { textNode: 'A' },
 *    { tag: 'B' },
 *    { textNode: 'C' },
 *  ],
 * };
 * Which renders: a<b/>b
 *
 * With the following `locate`calls:
 * this.engine.locate([node], Object.children[0])
 * this.engine.locate([node], Object.children[1])
 *
 * In this case, the location BEFORE come from:
 *      |a<b/>b
 *      a[<b/>]b
 *      a<b/>|b
 *
 * In this case, the location AFTER come from:
 *      a|<b/>b
 *      a<b/>b|
 *
 * ----------------------------------------
 *
 * Object = {
 *  children: [
 *    { tag: 'A' },
 *    {
 *      tag: 'B',
 *      children: [
 *          { tag: 'B2' },
 *          { tag: 'B3' },
 *      ],
 *    },
 *    { tag: 'C' },
 *  ],
 * };
 * Which renders: <a/><b><b2/><b3/></b><c/>
 *
 * With the following `locate`call:
 * this.engine.locate([node], Object.children[2])
 *
 * In this case <a/><b>[<b2/>]<b3/>/b><c/> is BEFORE
 *
 * ----------------------------------------
 *
 * Object = {
 *  children: [
 *    { tag: 'A' },
 *    { tag: 'B' },
 *    { tag: 'C' },
 *  ],
 * };
 * Which renders: <a/></b><c/>
 *
 * With the following `locate`calls:
 * this.engine.locate([node1, node2], Object)
 *
 * In this case <a/></b>[<c/>] is AFTER node2
 * In this case <a/>[</b>]<c/> is BEFORE node2
 * In this case [<a/>]</b><c/> is BEFORE node1
 *
 */

export type DomObjectAttributes = Record<string, string | Set<string> | Record<string, string>> & {
    class?: Set<string>;
    style?: Record<string, string>;
};
export type DomObjectElement = {
    tag: string;
    attributes?: DomObjectAttributes;
    children?: Array<DomObject | VNode>;
    attach?: (domNode: Element) => void;
    detach?: (domNode: Element) => void;
    shadowRoot?: boolean;
};
export type DomObjectFragment = {
    children: Array<DomObject | VNode>;
    attach?: (...domNodes: Node[]) => void;
    detach?: (...domNodes: Node[]) => void;
};
export type DomObjectText = {
    text: string;
    attach?: (...texts: Text[]) => void;
    detach?: (...texts: Text[]) => void;
};
export type DomObjectNative = {
    dom: Node[];
    attach?: (...domNodes: Node[]) => void;
    detach?: (...domNodes: Node[]) => void;
};
export type DomObject = DomObjectElement | DomObjectFragment | DomObjectText | DomObjectNative;

type RenderingBatchUnit = [VNode, Modifier[], NodeRenderer<DomObject>];

export class DomObjectRenderingEngine extends RenderingEngine<DomObject> {
    static readonly id: RenderingIdentifier = 'dom/object';
    static readonly defaultRenderer = DefaultDomObjectRenderer;
    static readonly defaultModifierRenderer = DefaultDomObjectModifierRenderer;

    /**
     * Render the attributes of the given VNode onto the given DOM Element.
     *
     * @param Class
     * @param node
     * @param element
     */
    renderAttributes<T extends typeof Attributes>(
        Class: T,
        node: VNode,
        item: DomObject,
        worker: RenderingEngineWorker<DomObject>,
    ): void {
        if ('tag' in item) {
            if (!item.attributes) item.attributes = {};
            const attributes = node.modifiers.find(Class);
            if (attributes) {
                const attr = item.attributes;
                for (const name of attributes.keys()) {
                    if (name === 'class') {
                        if (!attr.class) attr.class = new Set();
                        for (const className of attributes.classList.items()) {
                            attr.class.add(className);
                        }
                    } else if (name === 'style') {
                        attr.style = Object.assign({}, attributes.style.toJSON(), attr.style);
                    } else {
                        attr[name] = attributes.get(name);
                    }
                }
                worker.depends(item, attributes);
            }
        }
    }
    /**
     * @overwrite
     */
    async renderChildren(node: VNode): Promise<Array<DomObject | VNode>> {
        const children: Array<DomObject | VNode> = node.children();
        if (!children.length && this.editor.mode.is(node, RuleProperty.ALLOW_EMPTY) !== true) {
            children.push({ tag: 'BR' });
        }
        return children;
    }
    /**
     * Render a placeholder for the given child node.
     *
     * @param child
     */
    renderPlaceholder(child: VNode): Node {
        const placeholder = document.createElement('jw-domobject-vnode');
        placeholder.id = child.id.toString();
        return placeholder;
    }
    /**
     * Convert every VNode children into domObjects
     *
     * @param domObject
     */
    async resolveChildren(
        domObject: DomObject,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<void> {
        const stack = [domObject];
        for (const domObject of stack) {
            if ('children' in domObject) {
                const children: DomObject[] = [];
                const childNodes = domObject.children.filter(
                    child => child instanceof AbstractNode,
                ) as VNode[];
                const domObjects = await worker.render(childNodes);
                for (const index in domObject.children) {
                    const child = domObject.children[index];
                    let childObject: DomObject;
                    if (child instanceof AbstractNode) {
                        childObject = domObjects.shift();
                    } else {
                        childObject = child;
                    }
                    if (!stack.includes(childObject)) {
                        children.push(childObject);
                        stack.push(childObject);
                    }
                }
                domObject.children = children;
            }
        }
    }
    /**
     * Group the nodes by renderer, siblings and format.
     *
     * @override
     */
    renderBatched(
        cache: RenderingEngineCache<DomObject>,
        nodes: VNode[],
        rendered?: NodeRenderer<DomObject>,
    ): Promise<void>[] {
        const renderingUnits = this._getRenderingUnits(cache, nodes, rendered);
        return this._renderBatched(cache, renderingUnits);
    }
    /**
     * Group the nodes by format and by renderer and call 'renderBatch' with
     * the different group. Wrap the created domObject into the fromated
     * domObjectElement if needed.
     * Return a list of the rendered vNode and list of DomObjects. The indices
     * of the DomObject list match the indices of the given nodes
     * list.
     *
     * @param renderingUnits
     */
    private _renderBatched(
        cache: RenderingEngineCache<DomObject>,
        renderingUnits: RenderingBatchUnit[],
    ): Promise<void>[] {
        const batchPromises: Promise<void>[] = [];
        for (let unitIndex = 0; unitIndex < renderingUnits.length; unitIndex++) {
            let nextUnitIndex = unitIndex;
            const unit = renderingUnits[unitIndex];
            if (unit && unit[1].length) {
                // Group same formating.
                const modifier = unit[1][0];
                let lastUnit: RenderingBatchUnit = [unit[0], unit[1].slice(1), unit[2]];
                const newRenderingUnits: RenderingBatchUnit[] = [lastUnit];
                let nextUnit: RenderingBatchUnit;
                while (
                    (nextUnit = renderingUnits[nextUnitIndex + 1]) &&
                    lastUnit[0].parent === nextUnit[0].parent &&
                    nextUnit[1].length &&
                    this._modifierIsSameAs(cache, modifier, nextUnit[1]?.[0])
                ) {
                    nextUnitIndex++;
                    lastUnit = renderingUnits[nextUnitIndex];
                    newRenderingUnits.push([lastUnit[0], lastUnit[1].slice(1), lastUnit[2]]);
                }
                // Render wrapped nodes.
                const promises = this._renderBatched(cache, newRenderingUnits);
                const nodes: VNode[] = newRenderingUnits.map(u => u[0]);
                const modifierPromise = Promise.all(promises).then(async () => {
                    const domObjects: DomObject[] = [];
                    for (const domObject of nodes.map(node => cache.renderings.get(node))) {
                        if (!domObjects.includes(domObject)) {
                            domObjects.push(domObject);
                        }
                    }
                    // Create format.
                    const modifierRenderer = this.getCompatibleModifierRenderer(cache, modifier);
                    const wraps = await modifierRenderer.render(
                        modifier,
                        domObjects,
                        nodes,
                        cache.worker,
                    );

                    // Add origins.
                    for (const wrap of wraps) {
                        const stack = [wrap];
                        for (const domObject of stack) {
                            const origins = cache.renderingDependent.get(domObject);
                            if (origins) {
                                for (const origin of origins) {
                                    this._depends(cache, origin, wrap);
                                    this._depends(cache, wrap, origin);
                                }
                            }
                            if ('children' in domObject) {
                                for (const child of domObject.children) {
                                    if (!(child instanceof AbstractNode)) {
                                        stack.push(child);
                                    }
                                }
                            }
                        }
                        this._depends(cache, modifier, wrap);
                        this._depends(cache, wrap, modifier);
                    }

                    // Update the renderings promise.
                    for (const node of nodes) {
                        const wrap = wraps.find(wrap =>
                            cache.renderingDependent.get(wrap)?.has(node),
                        );
                        cache.renderings.set(node, wrap);
                    }
                });
                for (const node of nodes) {
                    cache.renderingPromises.set(node, modifierPromise);
                }
                batchPromises.push(modifierPromise);
            } else {
                // Render each node.
                let currentRenderer: NodeRenderer<DomObject>;
                let renderingUnit: RenderingBatchUnit;
                const siblings: VNode[] = [];
                while (
                    (renderingUnit = renderingUnits[nextUnitIndex]) &&
                    (!currentRenderer ||
                        (!renderingUnit[1].length &&
                            currentRenderer === renderingUnit[2] &&
                            (!siblings.length ||
                                siblings[siblings.length - 1].parent === renderingUnit[0].parent)))
                ) {
                    nextUnitIndex++;
                    siblings.push(renderingUnit[0]);
                    currentRenderer = renderingUnit[2];
                }
                if (currentRenderer) {
                    const promise = new Promise<void>(resolve => {
                        Promise.resolve().then(() => {
                            currentRenderer.renderBatch(siblings, cache.worker).then(domObjects => {
                                // Set the value, add origins and locations.
                                for (const index in siblings) {
                                    const node = siblings[index];
                                    const value = domObjects[index];
                                    this._depends(cache, node, value);
                                    this._depends(cache, value, node);
                                    this._addDefaultLocation(cache, node, value);
                                    cache.renderings.set(node, value);
                                }
                                resolve();
                            });
                        });
                    });
                    for (const sibling of siblings) {
                        cache.renderingPromises.set(sibling, promise);
                    }
                    batchPromises.push(promise);
                    nextUnitIndex--;
                }
            }
            unitIndex = nextUnitIndex;
        }
        return batchPromises;
    }
    /**
     * Compute list of nodes, format and rendering.
     * Add the siblings node into the list for future grouping for 'renderBatch'
     * method.
     *
     * @param nodes
     * @param rendered
     */
    private _getRenderingUnits(
        cache: RenderingEngineCache<DomObject>,
        nodes: VNode[],
        rendered?: NodeRenderer<DomObject>,
    ): RenderingBatchUnit[] {
        // Consecutive char nodes are rendered in same time.
        const renderingUnits: RenderingBatchUnit[] = [];
        const setNodes = new Set(nodes); // Use set for perf.

        const selected = new Set<VNode>();
        for (const node of nodes) {
            if (selected.has(node)) {
                continue;
            }
            const parent = node.parent;
            if (parent) {
                const markers: VNode[] = [];
                parent.childVNodes.forEach(sibling => {
                    // Filter and sort the ndoes.
                    if (setNodes.has(sibling)) {
                        if (sibling.tangible) {
                            renderingUnits.push(this._createUnit(cache, sibling, rendered));
                        } else {
                            // Not tangible node are add after other nodes (don't cut text node).
                            markers.push(sibling);
                        }
                        selected.add(sibling);
                    } else if (sibling.tangible) {
                        renderingUnits.push(null);
                    }
                });
                for (const marker of markers) {
                    renderingUnits.push(this._createUnit(cache, marker, rendered));
                }
            } else {
                renderingUnits.push(this._createUnit(cache, node, rendered));
            }
        }
        if (cache.optimizeModifiersRendering) {
            this._optimizeModifiersRendering(cache, renderingUnits);
        }

        return renderingUnits;
    }
    /**
     * The modifiers will be sorted to be rendererd with the minimum of tag and keep the hight
     * modifier level.
     *
     * Eg: change this (without space of course):
     *      <b>
     *          <i>
     *              _
     *              <a href="#">__</a>
     *          </i>
     *          <a href="#">_</a>
     *          <i>
     *              <a href="#">__</a>
     *          </i>
     *      </b>
     * Into this to keep the link:
     *      <b>
     *          <i>_</i>
     *          <a href="#">
     *              <i>__</i>
     *              _
     *              <i>__</i>
     *          </a>
     *      </b>
     *
     * @param cache
     * @param renderingUnits
     */
    private _optimizeModifiersRendering(
        cache: RenderingEngineCache<DomObject>,
        renderingUnits: RenderingBatchUnit[],
    ): void {
        // Clone to use pop after and create the intervales.
        const unitToModifiers = new Map<RenderingBatchUnit, Modifier[]>();
        for (const renderingUnit of renderingUnits) {
            if (renderingUnit) {
                unitToModifiers.set(renderingUnit, [...renderingUnit[1]]);
            }
        }

        // Group by same modifier, then order the modifiers and take care of the level.
        // Create modifiers interval (Modifier, level, index begin, index end).
        const intervals: [Modifier[], number, number, number][] = [];
        for (let i = 0; i < renderingUnits.length; i++) {
            const renderingUnit = renderingUnits[i];
            const unitModifiers = unitToModifiers.get(renderingUnit);
            if (unitModifiers) {
                while (unitModifiers.length) {
                    // Take the first modifier and group.
                    const modifierToSort = unitModifiers.pop();
                    const level = modifierToSort.level;
                    if (!level) {
                        continue;
                    }
                    const modifiers: Modifier[] = [modifierToSort];
                    const groupIndexes: number[] = [0];

                    let next: RenderingBatchUnit;
                    let nextIndex = i + 1;
                    while ((next = renderingUnits[nextIndex]) && unitToModifiers.get(next)) {
                        const modifierIndex = unitToModifiers
                            .get(next)
                            .findIndex(modifier =>
                                this._modifierIsSameAs(cache, modifierToSort, modifier),
                            );
                        if (modifierIndex === -1) {
                            break;
                        } else {
                            const modifier = unitToModifiers.get(next)[modifierIndex];
                            groupIndexes.push(next[1].indexOf(modifier));
                            modifiers.push(modifier);
                            unitToModifiers.get(next).splice(modifierIndex, 1);
                            nextIndex++;
                        }
                    }
                    intervals.push([modifiers, level, i, nextIndex - 1]);
                }
            }
        }

        // Split interval if break an interval with greatest level.
        for (let i = 0; i < intervals.length; i++) {
            const self = intervals[i];
            // Use the same length because the newest are already splitted for this loop.
            const len = intervals.length;
            for (let u = 0; u < len; u++) {
                if (u === i) {
                    continue;
                }
                const other = intervals[u];
                if (
                    self[1] > other[1] ||
                    (self[1] === other[1] && self[3] - self[2] > other[3] - other[2])
                ) {
                    // If greatest level or greatest number of VNodes split other modifiers.
                    if (self[2] > other[2] && self[2] <= other[3] && self[3] > other[3]) {
                        intervals.push([
                            other[0].splice(0, other[3] - self[2] + 1),
                            other[1],
                            self[2],
                            other[3],
                        ]);
                        other[3] = self[2] - 1;
                    } else if (self[3] >= other[2] && self[3] < other[3] && self[2] < other[2]) {
                        intervals.push([
                            other[0].splice(0, self[3] - other[2] + 1),
                            other[1],
                            other[2],
                            self[3],
                        ]);
                        other[2] = self[3] + 1;
                    }
                }
            }
        }

        // Sort by largest interval.
        intervals.sort((a, b) => a[3] - a[2] - b[3] + b[2]);

        // Sort the modifiers in unit from the interval order.
        for (const interval of intervals) {
            const nodes = [];
            for (let i = interval[2]; i <= interval[3]; i++) {
                const modifer = interval[0][i - interval[2]];
                const modifiers = renderingUnits[i][1];
                modifiers.splice(modifiers.indexOf(modifer), 1);
                modifiers.unshift(modifer);
                nodes.push(renderingUnits[i][0]);
            }
        }
    }
    private _createUnit(
        cache: RenderingEngineCache<DomObject>,
        node: VNode,
        rendered?: NodeRenderer<DomObject>,
    ): RenderingBatchUnit {
        const renderer = cache.worker.getCompatibleRenderer(node, rendered);
        // Remove modifier who render nothing.
        const modifiers = node.modifiers.filter(
            modifer => !this._modifierIsSameAs(cache, modifer, null),
        );
        return [node, modifiers, renderer];
    }
    protected _addDefaultLocation(
        cache: RenderingEngineCache<DomObject>,
        node: VNode,
        domObject: DomObject,
    ): void {
        let located = false;
        const stack = [domObject];
        for (const object of stack) {
            if (cache.locations.get(object)) {
                located = true;
                break;
            }
            if ('children' in object) {
                for (const child of object.children) {
                    if (!(child instanceof AbstractNode)) {
                        if (stack.includes(child)) {
                            throw new Error('Loop in rendering object.');
                        }
                        stack.push(child);
                    }
                }
            }
        }
        if (!located) {
            cache.locations.set(domObject, [node]);
        }
    }
}
