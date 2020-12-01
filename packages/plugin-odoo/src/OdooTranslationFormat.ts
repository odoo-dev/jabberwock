import { Format } from '../../core/src/Format';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class OdooTranslationFormat extends Format {
    static initialValues = {};
    breakable = false;
    static hasInitialValue(item: Element): boolean {
        const translationId = item.getAttribute('data-oe-translation-id');
        return OdooTranslationFormat.initialValues[translationId] === item.textContent;
    }
    static addInitialValue(item: Element): void {
        const translationId = item.getAttribute('data-oe-translation-id');
        OdooTranslationFormat.initialValues[translationId] = item.textContent;
    }
    constructor(htmlTag: string, translationId: string) {
        super(htmlTag);
        this.translationId = translationId;
    }
    get name(): string {
        return `OdooTranslation: ${super.name}`;
    }
    // TODO: Attributes on OdooTranslation should reactively read the values set
    // on the node itself rather than having to manually synchronize them.
    get translationId(): string {
        return this.modifiers.find(Attributes)?.get('data-oe-translation-id');
    }
    set translationId(translationId: string) {
        this.modifiers.get(Attributes).set('data-oe-translation-id', translationId);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    clone(): this {
        const clone = super.clone();
        clone.translationId = this.translationId;
        return clone;
    }
}
