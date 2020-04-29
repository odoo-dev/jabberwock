import { DomRenderingEngine } from '../../../plugin-dom/src/DomRenderingEngine';
import { AbstractRenderer } from '../../../plugin-renderer/src/AbstractRenderer';
import { Renderer } from '../../../plugin-renderer/src/RenderingEngine';
import { OwlNode } from './OwlNode';
import { Owl } from '../Owl';
import { OwlEnv } from './OwlComponent';

export class OwlDomRenderer extends AbstractRenderer<Node[]> {
    static id = 'dom';
    engine: DomRenderingEngine;
    predicate = OwlNode;
    env: OwlEnv;

    constructor(engine: DomRenderingEngine, superRenderer: Renderer<Node[]>) {
        super(engine, superRenderer);
        this.engine = engine;
        this.super = superRenderer;
        const owlPlugin = this.engine.editor.plugins.get(Owl);
        this.env = owlPlugin.owlEnv;
    }

    async render(node: OwlNode): Promise<Node[]> {
        const placeholder = document.createElement('jw-placeholer');
        document.body.appendChild(placeholder);
        node.Component.env = this.env;
        const component = new node.Component(null, node.props);
        await component.mount(placeholder);
        placeholder.remove();
        return [...placeholder.childNodes];
    }
}
