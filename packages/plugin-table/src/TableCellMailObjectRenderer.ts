import { NodeRenderer } from '../../plugin-renderer/src/NodeRenderer';
import { TableCellNode } from './TableCellNode';
import {
    DomObject,
    DomObjectElement,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { MailObjectRenderingEngine } from '../../plugin-mail/src/MailObjectRenderingEngine';
import { MailRenderingEngineWorker } from '../../plugin-mail/src/MailRenderingEngineCache';

export class TableCellMailObjectRenderer extends NodeRenderer<DomObject> {
    static id = MailObjectRenderingEngine.id;
    engine: MailObjectRenderingEngine;
    predicate = TableCellNode;

    /**
     * Special rendering for mail clients.
     *
     * @override
     */
    async render(cell: TableCellNode, worker: MailRenderingEngineWorker): Promise<DomObject> {
        const cellObject = (await this.super.render(cell, worker)) as DomObjectElement;
        const styleFromRules = await worker.getStyleFromCSSRules(cell, cellObject);

        // Text-align inheritance does not seem to get past <td> elements.
        const textAlign =
            cellObject.attributes?.style?.['text-align'] || styleFromRules.current['text-align'];
        if (!textAlign || (textAlign === 'inherit' && styleFromRules.inherit['text-align'])) {
            cellObject.attributes = cellObject.attributes || {};
            cellObject.attributes.style = cellObject.attributes.style || {};
            cellObject.attributes.style['text-align'] = styleFromRules.inherit['text-align'];
        }

        // Empty td are not displayed on Apple Mail.
        if (!cell.hasChildren()) {
            cellObject.children = [{ text: '&nbsp;' }];
        }
        return cellObject;
    }
}
