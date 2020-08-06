import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Code } from './Code';
import { DomObjectActionable } from '../../plugin-dom-layout/src/ActionableDomObjectRenderer';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class CodeButtonDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = (node: VNode): boolean =>
        node instanceof ActionableNode && node.actionName === 'code';

    async render(
        button: ActionableNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObjectActionable> {
        const domObject = (await this.super.render(button, worker)) as DomObjectActionable;
        const code = this.engine.editor.plugins.get(Code);
        domObject.handler = code.toggle.bind(code);
        return domObject;
    }
}
