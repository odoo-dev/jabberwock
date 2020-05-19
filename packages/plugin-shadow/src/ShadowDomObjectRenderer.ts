import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { ShadowNode } from './ShadowNode';
import { MetadataNode } from '../../plugin-metadata/src/MetadataNode';

export class ShadowDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ShadowNode;

    async render(node: ShadowNode): Promise<DomObject> {
        const element = document.createElement('jw-shadow');
        const shadowRoot = element.attachShadow({ mode: 'open' });
        for (const child of node.childVNodes) {
            if (child.tangible || child.is(MetadataNode)) {
                shadowRoot.append(this.engine.renderPlaceholder(child));
            }
        }
        return {
            dom: [element],
        };
    }
}
