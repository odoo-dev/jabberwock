import { VNode } from '../../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from '../../../plugin-xml/src/XmlDomParsingEngine';
import { AbstractParser } from '../../../plugin-parser/src/AbstractParser';
import { ZoneNode } from '../../../plugin-layout/src/ZoneNode';
import { nodeName } from '../../../utils/src/utils';

export class ZoneXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'T' && !!item.getAttribute('t-zone');
    };

    async parse(item: Element): Promise<VNode[]> {
        return [new ZoneNode({ managedZones: [item.getAttribute('t-zone')] })];
    }
}
