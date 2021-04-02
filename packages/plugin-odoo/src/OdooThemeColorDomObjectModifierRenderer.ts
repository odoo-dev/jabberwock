import {
    DomObjectRenderingEngine,
    DomObject,
    DomObjectElement,
    DomObjectAttributes,
} from '../../plugin-renderer-dom-object/src/DomObjectRenderingEngine';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { AttributesDomObjectModifierRenderer } from '../../plugin-xml/src/AttributesDomObjectModifierRenderer';

export class OdooThemeColorDomObjectModifierRenderer extends AttributesDomObjectModifierRenderer {
    static odooThemeColor = /^var\(--.*\)$/g;
    static id = DomObjectRenderingEngine.id;
    engine: DomObjectRenderingEngine;
    predicate = Attributes;

    async render(modifier: Attributes, contents: DomObject[]): Promise<DomObject[]> {
        contents = await super.render(modifier, contents);
        for (const content of contents) {
            const attributes = (content as DomObjectElement)?.attributes;
            if (attributes) {
                this._checkCssStyle(attributes, 'color', 'text-');
                this._checkCssStyle(attributes, 'background-color', 'bg-');
            }
        }
        return contents;
    }

    _checkCssStyle(
        attributes: DomObjectAttributes,
        styleKey: string,
        odooClassPrefix: string,
    ): void {
        if (!attributes.style) return;

        const odooClassBaseValue = this._getOdooThemeColorClassForStyleColor(
            attributes.style[styleKey],
        );
        if (odooClassBaseValue !== '') {
            delete attributes.style[styleKey];
            if (!attributes.class) {
                attributes.class = new Set();
            }
            attributes.class.add(odooClassPrefix + odooClassBaseValue);
        }
    }

    _getOdooThemeColorClassForStyleColor(styleValue: string): string {
        if (
            styleValue &&
            styleValue.match(OdooThemeColorDomObjectModifierRenderer.odooThemeColor)
        ) {
            return styleValue.substring(6, styleValue.length - 1);
        }
        return '';
    }
}
