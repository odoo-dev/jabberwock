import { VNode } from '../../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from '../../../plugin-xml/src/XmlDomParsingEngine';
import { AbstractParser } from '../../../plugin-parser/src/AbstractParser';
import { DialogZoneNode } from './DialogZoneNode';
import { nodeName } from '../../../utils/src/utils';

export class DialogZoneXmlDomParser extends AbstractParser<Node> {
    static id = 'dom/xml';
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'T-DIALOG';
    };

    async parse(item: Element): Promise<VNode[]> {
        const zones = [];
        for (const child of item.querySelectorAll('t[t-zone]')) {
            zones.push(child.getAttribute('t-zone'));
        }
        return [new DialogZoneNode(zones)];
    }
}
