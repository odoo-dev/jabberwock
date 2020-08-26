import {
    DomObjectRenderingEngine,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { IconDomObjectRenderer } from '../../plugin-icon/src/IconDomObjectRenderer';
import { DocumentIconNode } from './DocumentIconNode';
import { DomObjectAttributes } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';

export class DocumentIconDomObjectRenderer extends IconDomObjectRenderer {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = DocumentIconNode;

    _createIcon(node: DocumentIconNode): DomObjectElement {
        const element = super._createIcon(node);
        const attributes: DomObjectAttributes = element.attributes ? element.attributes : {};
        element.attributes = attributes;
        element.attributes.href = node.iconLink;
        return element;
    }
}
