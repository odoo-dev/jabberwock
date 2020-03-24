import { FontawesomeNode } from './FontawesomeNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';

export class FontawesomeDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return this._isFontawesome(item);
    };

    async parse(item: Element): Promise<FontawesomeNode[]> {
        const fontawesome = new FontawesomeNode(item.nodeName);
        fontawesome.attributes = this.engine.parseAttributes(item);
        return [fontawesome];
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if the given DOM node is a fontawesome.
     *
     * @param item
     */
    _isFontawesome(item: Node): item is Element {
        return (
            item instanceof Element &&
            /(^|[\s*\n*])fa[bdlrs]?[\s*\n*$]/.test(item.className)
        );
    }
}
