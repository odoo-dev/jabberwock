import { RenderingEngine } from '../../plugin-renderer/src/RenderingEngine';
import { DefaultDomObjectRenderer } from './DefaultDomObjectRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

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

export class DomObjectRenderingEngine extends RenderingEngine<DomObject> {
    static readonly id = 'dom/object';
    static readonly defaultRenderer = DefaultDomObjectRenderer;
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
                const attr = {};
                for (const name of attributes.keys()) {
                    const value = attributes.get(name);
                    if (item.attributes && name in item.attributes) {
                        attr[name] = item.attributes[name];
                        if (name === 'class') {
                            attr[name] += ' ' + value;
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
        } else if (!node.is(AtomicNode)) {
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
}
