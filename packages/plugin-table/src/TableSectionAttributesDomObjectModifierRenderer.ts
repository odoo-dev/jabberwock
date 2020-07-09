import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { TableSectionAttributes } from './TableRowXmlDomParser';

export class TableSectionAttributesDomObjectModifierRenderer extends ModifierRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = TableSectionAttributes;

    /**
     * Rendering for TableSectionAttributes Modifier.
     *
     * @param format
     * @param contents
     */
    async render(format: TableSectionAttributes, contents: DomObject[]): Promise<DomObject[]> {
        return contents;
    }
}
