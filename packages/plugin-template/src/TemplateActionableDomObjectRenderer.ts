import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { Template } from './Template';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import {
    ActionableDomObjectRenderer,
    DomObjectActionable,
} from '../../plugin-dom-layout/src/ActionableDomObjectRenderer';
import { TemplateThumbnailSelectorNode } from './TemplateThumbnailSelectorNode';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';

export class TemplateActionableDomObjectRenderer extends ActionableDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = (node: VNode): boolean =>
        node instanceof ActionableNode && !!node.ancestor(TemplateThumbnailSelectorNode);

    async render(
        node: ActionableNode,
        worker: RenderingEngineWorker<DomObject>,
    ): Promise<DomObjectActionable> {
        const domObject = await super.render(node, worker);
        const templatePlugin = this.engine.editor.plugins.get(Template);
        const name = node.actionName
            .split('-')
            .slice(1)
            .join('-');
        const template = templatePlugin.configuration.templateConfigurations[name];
        domObject.tag = 'JW-TEMPLATE';
        domObject.children = [
            {
                tag: 'JW-LABEL',
                attributes: { class: new Set(['label']) },
                children: [{ text: template.label }],
            },
            {
                tag: 'JW-THUMB',
                attributes: { style: { 'background-image': 'url("' + template.thumbnail + '")' } },
            },
        ];
        return domObject;
    }
}
