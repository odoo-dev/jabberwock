import {
    DomObject,
    DomObjectRenderingEngine,
} from '../../plugin-html/src/DomObjectRenderingEngine';
import { AbstractRenderer } from '../../plugin-renderer/src/AbstractRenderer';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { SeparatorNode } from '../../core/src/VNodes/SeparatorNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { ToolbarNode } from './ToolbarNode';

export class SeparatorDomObjectRenderer extends AbstractRenderer<DomObject> {
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
