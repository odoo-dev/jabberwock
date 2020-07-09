import { RenderingEngine, RenderingIdentifier } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultDomObjectRenderer } from './DefaultDomObjectRenderer';
import { DefaultDomObjectModifierRenderer } from './DefaultDomObjectModifierRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { Modifier } from '../../core/src/Modifier';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { RuleProperty } from '../../core/src/Mode';

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
                this._addOrigin(attributes, item);
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
        } else if (
            !node.is(AtomicNode) &&
            this.editor.mode.is(node, RuleProperty.ALLOW_EMPTY) !== true
        ) {
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
    renderBatched(nodes: VNode[], rendered?: NodeRenderer<DomObject>): Promise<void>[] {
        const renderingUnits = this._getRenderingUnits(nodes, rendered);
        return this._renderBatched(renderingUnits);
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
    private _renderBatched(renderingUnits: RenderingBatchUnit[]): Promise<void>[] {
        const batchPromises: Promise<void>[] = [];

        // Remove modifier who render nothing.
        for (const unit of renderingUnits) {
            for (let i = unit[1].length - 1; i >= 0; i--) {
                if (this._modifierIsSameAs(unit[1][i], null)) {
                    unit[1].splice(i, 1);
                }
            }
        }

        for (let unitIndex = 0; unitIndex < renderingUnits.length; unitIndex++) {
            let nextUnitIndex = unitIndex;
            const unit = renderingUnits[unitIndex];
            if (unit[1].length) {
                // Group same formating.
                const modifier = unit[1].shift();
                const newRenderingUnits: RenderingBatchUnit[] = [unit];
                let lastUnit: RenderingBatchUnit = unit;
                let nextUnit: RenderingBatchUnit;
                while (
                    (nextUnit = renderingUnits[nextUnitIndex + 1]) &&
                    lastUnit[0].parent === nextUnit[0].parent &&
                    nextUnit[1].length &&
                    this._modifierIsSameAs(modifier, nextUnit[1]?.[0])
                ) {
                    nextUnitIndex++;
                    lastUnit = renderingUnits[nextUnitIndex];
                    newRenderingUnits.push([lastUnit[0], lastUnit[1].slice(1), lastUnit[2]]);
                }
                // Render wrapped nodes.
                const promises = this._renderBatched(newRenderingUnits);
                const nodes: VNode[] = newRenderingUnits.map(u => u[0]);
                const modifierPromise = Promise.all(promises).then(async () => {
                    const domObjects: DomObject[] = [];
                    for (const domObject of nodes.map(node => this.renderings.get(node))) {
                        if (!domObjects.includes(domObject)) {
                            domObjects.push(domObject);
                        }
                    }
                    // Create format.
                    const modifierRenderer = this.getCompatibleModifierRenderer(modifier, nodes);
                    const wraps = await modifierRenderer.render(modifier, domObjects, nodes);

                    // Add origins.
                    for (const wrap of wraps) {
                        const stack = [wrap];
                        for (const domObject of stack) {
                            const origins = this.from.get(domObject);
                            if (origins) {
                                for (const origin of origins) {
                                    this._addOrigin(origin, wrap);
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
                        this._addOrigin(modifier, wrap);
                    }

                    // Update the renderings promise.
                    for (const node of nodes) {
                        const wrap = wraps.find(wrap => this.from.get(wrap)?.includes(node));
                        this.renderings.set(node, wrap);
                    }
                });
                for (const node of nodes) {
                    this.renderingPromises.set(node, modifierPromise);
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
                            currentRenderer.renderBatch(siblings).then(domObjects => {
                                // Set the value, add origins and locations.
                                for (const index in siblings) {
                                    const node = siblings[index];
                                    const value = domObjects[index];
                                    this._addOrigin(node, value);
                                    this._addDefaultLocation(node, value);
                                    this.renderings.set(node, value);
                                }
                                resolve();
                            });
                        });
                    });
                    for (const sibling of siblings) {
                        this.renderingPromises.set(sibling, promise);
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
                    const modifiers = node.modifiers.map(modifer => modifer);
                    renderingUnits.push([node, modifiers, renderer]);
                }
                selected.add(node);
            } else {
                const siblings = node.parent?.children();
                if (!siblings || siblings.indexOf(node) === -1) {
                    // Render node like MarkerNode.
                    const renderer = this.getCompatibleRenderer(node, rendered);
                    if (renderer) {
                        const modifiers = node.modifiers.map(modifer => modifer);
                        renderingUnits.push([node, modifiers, renderer]);
                    }
                    selected.add(node);
                } else {
                    for (const sibling of siblings) {
                        if (!selected.has(sibling)) {
                            const modifiers = sibling.modifiers.map(modifer => modifer);
                            const renderer = this.getCompatibleRenderer(sibling, rendered);
                            if (renderer) {
                                renderingUnits.push([sibling, modifiers, renderer]);
                            }
                        }
                        selected.add(sibling);
                    }
                }
            }
        }
        return renderingUnits;
    }
    protected _addDefaultLocation(node: VNode, domObject: DomObject): void {
        let located = false;
        const stack = [domObject];
        for (const object of stack) {
            if (this.locations.get(object)) {
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
            this.locations.set(domObject, [node]);
        }
    }
    private _modifierIsSameAs(modifierA: Modifier | void, modifierB: Modifier | void): boolean {
        return (
            (!modifierA || modifierA.isSameAs(modifierB)) &&
            (!modifierB || modifierB.isSameAs(modifierA))
        );
    }
}
