import { DocumentIconDomObjectRenderer } from '../../plugin-document-icon/src/DocumentIconDomObjectRenderer';
import { DomObject } from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { RenderingEngineWorker } from '../../plugin-renderer/src/RenderingEngineCache';
import { IconNode } from '../../plugin-icon/src/IconNode';
import { odooIconPostRender } from './odooUtils';

export class OdooDocumentIconDomObjectRenderer extends DocumentIconDomObjectRenderer {
    async render(node: IconNode, worker: RenderingEngineWorker<DomObject>): Promise<DomObject> {
        const domObject: DomObject = await super.render(node, worker);
        return odooIconPostRender(node, domObject, this.engine.editor);
    }
}
