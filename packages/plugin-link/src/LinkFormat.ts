import { Format } from '../../core/src/Format';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { ModifierLevel } from '../../core/src/Modifier';

export class LinkFormat extends Format {
    preserveAfterNode = false;
    preserveAfterParagraphBreak = false;
    preserveAfterLineBreak = true;
    level = ModifierLevel.HIGH;

    constructor(url = '#', target = '') {
        super('A');
        this.url = url;
        if (target) {
            this.target = target;
        }
    }

    // TODO: Attributes on Link should reactively read the values set on the
    // node itself rather than having to manually synchronize them.
    get url(): string {
        return this.modifiers.find(Attributes)?.get('href');
    }

    set url(url: string) {
        this.modifiers.get(Attributes).set('href', url);
    }

    get target(): string {
        return this.modifiers.find(Attributes)?.get('target') || '';
    }

    set target(target: string) {
        if (target.length) {
            this.modifiers.get(Attributes).set('target', target);
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * @override
     */
    clone(): this {
        const clone = super.clone();
        clone.url = this.url;
        return clone;
    }
}
