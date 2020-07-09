import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { LayoutContainer } from './LayoutContainerNode';

export class LayoutContainerDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = LayoutContainer;

    async render(node: LayoutContainer): Promise<DomObject> {
        return {
            children: [...node.childVNodes],
        };
    }
}
