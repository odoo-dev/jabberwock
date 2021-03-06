import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { OwlNode } from './OwlNode';
import { Owl } from './Owl';
import { OwlEnv } from './OwlComponent';

export class OwlDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = OwlNode;
    env: OwlEnv;

    constructor(engine: DomObjectRenderingEngine) {
        super(engine);
        this.env = this.engine.editor.plugins.get(Owl).env;
    }

    async render(node: OwlNode): Promise<DomObject> {
        const components = this.engine.editor.plugins.get(Owl).components;
        const oldOwlComponent = components.get(node);

        const placeholder = document.createElement('jw-placeholer');
        document.body.appendChild(placeholder);
        node.params.Component.env = this.env;
        const component = new node.params.Component(null, node.params.props);
        components.set(node, component);
        await component.mount(placeholder);
        placeholder.remove();

        const domNodes = [...placeholder.childNodes];

        if (oldOwlComponent) {
            if (oldOwlComponent.el.parentNode) {
                for (const domNode of domNodes) {
                    oldOwlComponent.el.parentNode.insertBefore(domNode, oldOwlComponent.el);
                }
            }
            oldOwlComponent.destroy();
        }
        return {
            dom: domNodes,
        };
    }
}
