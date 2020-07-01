import { AbstractModifierRenderer } from '../../plugin-renderer/src/AbstractModifierRenderer';
import { DomObjectRenderingEngine, DomObject } from './DomObjectRenderingEngine';
import { Format } from '../../core/src/Format';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class FormatDomObjectModifierRenderer extends AbstractModifierRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = Format;

    /**
     * Rendering for Format Modifier.
     *
     * @param format
     * @param contents
     */
    async render(format: Format, contents: DomObject[]): Promise<DomObject> {
        const domObject: DomObject = {
            tag: format.htmlTag.toUpperCase(),
            attributes: {},
            children: contents,
        };
        const attributes = format.modifiers.find(Attributes);
        if (attributes) {
            for (const name of attributes.keys()) {
                domObject.attributes[name] = attributes.get(name);
            }
        }
        return domObject;
    }
}
