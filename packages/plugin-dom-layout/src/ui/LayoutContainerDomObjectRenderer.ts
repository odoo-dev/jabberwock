import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../../plugin-renderer/src/AbstractRenderer';
import { LayoutContainer } from './LayoutContainerNode';

export class LayoutContainerDomObjectRenderer extends AbstractRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = LayoutContainer;

    async render(node: LayoutContainer): Promise<DomObject> {
        return {
            children: [...node.children()],
        };
    }
}
