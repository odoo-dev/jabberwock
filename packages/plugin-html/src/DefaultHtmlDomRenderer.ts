import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { VNode } from '../../core/src/VNodes/VNode';
import { HtmlDomRenderingEngine } from './HtmlDomRenderingEngine';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';

export class DefaultHtmlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom/html';
    engine: HtmlDomRenderingEngine;

    async render(node: VNode): Promise<Node[]> {
        const renderer = this.engine.editor.plugins.get(Renderer);
        const objectEngine = renderer.engines['dom/object'] as DomObjectRenderingEngine;
        const domObject = await objectEngine.render(node);
        await objectEngine.resolveChildren(domObject);
        const domNode = this._objectToDom(domObject);
        return domNode instanceof DocumentFragment ? [...domNode.childNodes] : [domNode];
    }
    private _objectToDom(domObject: DomObject): Node {
        let domNode: Node;
        if ('tag' in domObject) {
            const element = document.createElement(domObject.tag);
            if (domObject.attributes) {
                for (const name in domObject.attributes) {
                    const value = domObject.attributes[name];
                    element.setAttribute(name, value);
                }
            }
            if (domObject.children) {
                for (const child of domObject.children) {
                    if (!(child instanceof AbstractNode)) {
                        element.appendChild(this._objectToDom(child));
                    }
                }
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
            for (const domNode of domObject.dom) {
                domNode.appendChild(domNode);
            }
        }
        return domNode;
    }
}
