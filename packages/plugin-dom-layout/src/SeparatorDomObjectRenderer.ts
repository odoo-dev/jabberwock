import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { SeparatorNode } from '../../core/src/VNodes/SeparatorNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { ToolbarNode } from '../../plugin-toolbar/src/ToolbarNode';

export class SeparatorDomObjectRenderer extends NodeRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = (node: VNode): boolean =>
        node instanceof SeparatorNode && !!node.ancestor(ToolbarNode);

    async render(separator: SeparatorNode): Promise<DomObject> {
        const objectSeparator: DomObject = {
            tag: 'JW-SEPARATOR',
            attributes: { role: 'separator' },
        };
        this.engine.renderAttributes(Attributes, separator, objectSeparator);
        return objectSeparator;
    }
}
