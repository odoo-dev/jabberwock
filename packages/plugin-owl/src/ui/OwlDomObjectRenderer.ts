import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../../plugin-renderer/src/AbstractRenderer';
import { Renderer } from '../../../plugin-renderer/src/RenderingEngine';
import { OwlNode } from './OwlNode';
import { Owl } from '../Owl';
import { OwlEnv } from './OwlComponent';

export class OwlDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = OwlNode;
    env: OwlEnv;

    constructor(engine: DomObjectRenderingEngine, superRenderer: Renderer<DomObject>) {
        super(engine, superRenderer);
        this.env = this.engine.editor.plugins.get(Owl).env;
    }

    async render(node: OwlNode): Promise<DomObject> {
        const components = this.engine.editor.plugins.get(Owl).components;
        if (components.get(node)) {
            components.get(node).destroy();
        }
        const placeholder = document.createElement('jw-placeholer');
        document.body.appendChild(placeholder);
        node.Component.env = this.env;
        const component = new node.Component(null, node.props);
        components.set(node, component);
        await component.mount(placeholder);
        placeholder.remove();

        return {
            dom: [...placeholder.childNodes],
        };
    }
}
