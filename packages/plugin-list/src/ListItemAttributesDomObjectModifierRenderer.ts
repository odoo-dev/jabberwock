import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';
import {
    DomObjectRenderingEngine,
    DomObject,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { ListItemAttributes } from './ListItemXmlDomParser';

export class ListItemAttributesDomObjectModifierRenderer extends ModifierRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = ListItemAttributes;

    /**
     * Rendering for ListItemAttributes Modifier.
     *
     * @param format
     * @param contents
     */
    async render(format: ListItemAttributes, contents: DomObject[]): Promise<DomObject[]> {
        return contents;
    }
}
