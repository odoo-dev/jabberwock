import { ModifierRenderer } from '../../plugin-renderer/src/ModifierRenderer';
import { DomObjectRenderingEngine, DomObject } from './DomObjectRenderingEngine';
import { Format } from '../../core/src/Format';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class FormatDomObjectModifierRenderer extends ModifierRenderer<DomObject> {
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = Format;

    /**
     * Rendering for Format Modifier.
     *
     * @param format
     * @param contents
     */
    async render(format: Format, contents: DomObject[]): Promise<DomObject[]> {
        const domObject: DomObject = {
            tag: format.htmlTag.toUpperCase(),
            children: contents,
        };
        const attributes = format.modifiers.find(Attributes);
        const keys = attributes?.keys();
        if (keys?.length) {
            domObject.attributes = {};

            const attr = domObject.attributes;
            for (const name of keys) {
                if (name === 'class') {
                    if (!attr.class) attr.class = new Set();
                    for (const className of attributes.classList.items()) {
                        attr.class.add(className);
                    }
                } else if (name === 'style') {
                    attr.style = Object.assign({}, attributes.style.toJSON(), attr.style);
                } else {
                    attr[name] = attributes.get(name);
                }
            }
        }
        return [domObject];
    }
}
