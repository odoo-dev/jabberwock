import { VNode } from '../../../core/src/VNodes/VNode';
import { DomParsingEngine } from '../../../plugin-dom/src/DomParsingEngine';
import { AbstractParser } from '../../../plugin-parser/src/AbstractParser';
import { ZoneNode } from '../../../plugin-layout/src/ZoneNode';

const invisibleTag = 't';

export class ZoneDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return (
            item instanceof Element &&
            item.tagName.toLowerCase() === invisibleTag &&
            !!item.getAttribute('t-zone')
        );
    };

    async parse(item: Element): Promise<VNode[]> {
        return [new ZoneNode([item.getAttribute('t-zone')])];
    }
}
