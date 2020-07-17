import { RenderingEngine, RenderingIdentifier } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultDomObjectRenderer } from './DefaultDomObjectRenderer';
import { DefaultDomObjectModifierRenderer } from './DefaultDomObjectModifierRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { AbstractNode, isNodePredicate } from '../../core/src/VNodes/AbstractNode';
import { Format } from '../../core/src/Format';
import { Modifier } from '../../core/src/Modifier';
import { flat } from '../../utils/src/utils';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';

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

export type DomObjectElement = {
    tag: string;
    attributes?: Record<string, string>;
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

type RenderingBatchUnit = [VNode, [Format, ModifierRenderer<DomObject>][], NodeRenderer<DomObject>];

export class DomObjectRenderingEngine extends RenderingEngine<DomObject> {
    static readonly id: RenderingIdentifier = 'dom/object';
    static readonly defaultRenderer = DefaultDomObjectRenderer;
    static readonly defaultModifierRenderer = DefaultDomObjectModifierRenderer;
    readonly cachedSameModifier: Map<Modifier, Map<Modifier, boolean>> = new Map();

    /**
     * Render the attributes of the given VNode onto the given DOM Element.
     *
     * @param Class
     * @param node
     * @param element
     */
    renderAttributes<T extends typeof Attributes>(Class: T, node: VNode, item: DomObject): void {
        if ('tag' in item) {
            const attributes = node.modifiers.find(Class);
            if (attributes) {
                const attr = item.attributes || {};
                for (const name of attributes.keys()) {
                    const value = attributes.get(name);
                    if (name in attr) {
                        attr[name] = item.attributes[name];
                        if (name === 'class') {
                            attr[name] = (attr[name] + ' ' + value).trim();
                        } else if (name === 'style') {
                            attr[name] += '; ' + value;
                        }
                    } else {
                        attr[name] = value;
                    }
                }
                item.attributes = attr;
            }
        }
    }
    /**
     * @overwrite
     */
    async renderChildren(node: VNode): Promise<Array<DomObject | VNode>> {
        const children: Array<DomObject | VNode> = [];
        if (node.hasChildren()) {
            for (const child of node.childVNodes) {
                if (child.tangible) {
                    children.push(child);
                }
            }
        } else if (!isNodePredicate(node, AtomicNode)) {
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
    async resolveChildren(domObject: DomObject): Promise<void> {
        const stack = [domObject];
        for (const domObject of stack) {
            if ('children' in domObject) {
                const children: DomObject[] = [];
                const childNodes = domObject.children.filter(
                    child => child instanceof AbstractNode,
                ) as VNode[];
                const domObjects = await this.render(childNodes);
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
        nodes: VNode[],
        rendered?: NodeRenderer<DomObject>,
    ): [VNode[], Promise<DomObject[]>][] {
        const renderingUnits = this._getRenderingUnits(nodes, rendered);
        return this._renderBatched(renderingUnits);
    }
    /**
     * @override
     */
    invalidateRendererCache(objects: Set<VNode | Modifier>): void {
        super.invalidateRendererCache(objects);
        for (const object of objects) {
            if (object instanceof Modifier) {
                const modifiers = this.cachedSameModifier.get(object);
                if (modifiers) {
                    this.cachedSameModifier.delete(object);
                    for (const [modifier] of modifiers) {
                        const cache = this.cachedSameModifier.get(modifier);
                        cache.delete(object);
                    }
                }
            }
        }

        // TODO: invalidate for linked rendering
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
        renderingUnits: RenderingBatchUnit[],
    ): [VNode[], Promise<DomObject[]>][] {
        const renderings: [VNode[], Promise<DomObject[]>][] = [];

        for (let unitIndex = 0; unitIndex < renderingUnits.length; unitIndex++) {
            let nextUnitIndex = unitIndex;
            const unit = renderingUnits[unitIndex];
            if (unit[1].length) {
                // Group same formating.
                const [modifier, modifierRenderer] = unit[1].shift();
                const newRenderingUnits: RenderingBatchUnit[] = [unit];
                let nextUnit: RenderingBatchUnit;
                while (
                    (nextUnit = renderingUnits[nextUnitIndex + 1]) &&
                    unit[0].parent === nextUnit[0].parent &&
                    nextUnit[1][0] &&
                    modifierRenderer === nextUnit[1][0][1] &&
                    this._getSameModifier(modifier, nextUnit[1][0][0])
                ) {
                    newRenderingUnits.push([nextUnit[0], nextUnit[1].slice(1), nextUnit[2]]);
                    nextUnitIndex++;
                }

                // Render wrapped nodes.
                const renderingGroups = this._renderBatched(newRenderingUnits);
                const nodes = flat(renderingGroups.map(u => u[0]));

                const promises = renderingGroups.map(u => u[1]);
                const promise = Promise.all(promises);
                const unitPromise = promise.then(async domObjectLists => {
                    const flatten = flat(domObjectLists);
                    const domObjects: DomObject[] = [];
                    for (const domObject of flatten) {
                        if (!domObjects.includes(domObject)) {
                            domObjects.push(domObject);
                        }
                    }
                    // Create format.
                    const rendering = await modifierRenderer.render(modifier, domObjects, nodes);
                    return flatten.map(() => rendering);
                });
                renderings.push([nodes, unitPromise]);
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
                    renderings.push([siblings, currentRenderer.renderBatch(siblings)]);
                    nextUnitIndex--;
                }
            }
            unitIndex = nextUnitIndex;
        }
        return renderings;
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
        nodes: VNode[],
        rendered?: NodeRenderer<DomObject>,
    ): RenderingBatchUnit[] {
        // Consecutive char nodes are rendered in same time.
        const renderingUnits: RenderingBatchUnit[] = [];
        const selected = new Set<VNode>();
        for (const node of nodes) {
            if (selected.has(node)) {
                continue;
            }
            if (node.hasChildren()) {
                const renderer = this.getCompatibleRenderer(node, rendered);
                if (renderer) {
                    const modifierRenderers = this._getFormatRenderer(node);
                    renderingUnits.push([node, modifierRenderers, renderer]);
                }
                selected.add(node);
            } else {
                const siblings = node.parent?.children();
                if (!siblings || siblings.indexOf(node) === -1) {
                    // Render node like MarkerNode.
                    const renderer = this.getCompatibleRenderer(node, rendered);
                    if (renderer) {
                        const modifierRenderers = this._getFormatRenderer(node);
                        renderingUnits.push([node, modifierRenderers, renderer]);
                    }
                    selected.add(node);
                } else {
                    for (const sibling of siblings) {
                        if (!selected.has(sibling)) {
                            const renderer = this.getCompatibleRenderer(sibling, rendered);
                            if (renderer) {
                                const modifierRenderers = this._getFormatRenderer(sibling);
                                renderingUnits.push([sibling, modifierRenderers, renderer]);
                            }
                        }
                        selected.add(sibling);
                    }
                }
            }
        }
        return renderingUnits;
    }
    private _getFormatRenderer(node: VNode): [Format, ModifierRenderer<DomObject>][] {
        const modifierRenderers: [Format, ModifierRenderer<DomObject>][] = [];
        node.modifiers.map(modifier => {
            if (modifier instanceof Format) {
                modifierRenderers.push([modifier, this.getCompatibleModifierRenderer(modifier)]);
            }
        });
        return modifierRenderers;
    }
    private _getSameModifier(a: Modifier, b: Modifier): boolean {
        let aValues = this.cachedSameModifier.get(a);
        if (!aValues) {
            aValues = new Map();
            this.cachedSameModifier.set(a, aValues);
        } else if (aValues.has(b)) {
            return aValues.get(b);
        }
        let bValues = this.cachedSameModifier.get(b);
        if (!bValues) {
            bValues = new Map();
            this.cachedSameModifier.set(b, bValues);
        }
        const value = a.isSameAs(b) && b.isSameAs(a);

        aValues.set(b, value);
        bValues.set(a, value);
        return value;
    }
}
