import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { HtmlDomRenderingEngine } from './HtmlDomRenderingEngine';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';

export class DefaultHtmlDomRenderer extends NodeRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;

    async render(node: VNode): Promise<Node[]> {
        const renderer = this.engine.editor.plugins.get(Renderer);
        const objectEngine = renderer.engines['object/html'] as DomObjectRenderingEngine;
        const cache = await objectEngine.render([node]);
        const domNodes: Node[] = [];
        for (const [, domObject] of cache.renderings) {
            await objectEngine.resolveChildren(domObject, cache.worker);
            const domNode = this._objectToDom(domObject);
            if (domNode instanceof DocumentFragment) {
                domNodes.push(...domNode.childNodes);
            } else {
                domNodes.push(domNode);
            }
        }
        return domNodes;
    }
    private _objectToDom(domObject: DomObject): Node {
        let domNode: Node;
        if ('tag' in domObject) {
            const element = document.createElement(domObject.tag);
            const attributes = domObject.attributes;
            if (attributes) {
                for (const name in attributes) {
                    if (name === 'style') {
                        element.setAttribute(
                            'style',
                            Object.keys(attributes.style)
                                .map(styleName => `${styleName}: ${attributes.style[styleName]};`)
                                .join(''),
                        );
                    } else if (name === 'class') {
                        const classList = attributes[name];
                        for (const className of classList) {
                            element.classList.add(className);
                        }
                    } else {
                        const value = attributes[name];
                        if (typeof value === 'string') {
                            element.setAttribute(name, value);
                        }
                    }
                }
            }
            if (domObject.children) {
                for (const child of domObject.children) {
                    if (!(child instanceof AbstractNode)) {
                        element.appendChild(this._objectToDom(child));
                    }
                }
            }
            // Implement attach & detach: domObject into html.
            element.addEventListener('detach', () => {
                [...element.children].forEach(childElement => {
                    childElement.dispatchEvent(new CustomEvent('detach'));
                });
                if (domObject.detach) {
                    domObject.detach(element);
                }
            });
            if (domObject.attach) {
                domObject.attach(element);
            }
            domNode = element;
        } else if ('text' in domObject) {
            domNode = document.createTextNode(domObject.text);
        } else if ('children' in domObject) {
            domNode = document.createDocumentFragment();
            for (const child of domObject.children) {
                if (!(child instanceof AbstractNode)) {
                    domNode.appendChild(this._objectToDom(child));
                }
            }
        } else {
            domNode = document.createDocumentFragment();
            for (const domObjectNode of domObject.dom) {
                domNode.appendChild(domObjectNode);
            }
        }
        return domNode;
    }
}
