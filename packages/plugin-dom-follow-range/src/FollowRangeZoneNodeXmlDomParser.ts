import { VNode } from '../../core/src/VNodes/VNode';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { FollowRangeZoneNode } from './FollowRangeZoneNode';
import { nodeName } from '../../utils/src/utils';

export class FollowRangeZoneNodeXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'T-RANGE';
    };

    async parse(item: Element): Promise<VNode[]> {
        const zones = [];
        for (const child of item.querySelectorAll('t[t-zone]')) {
            zones.push(child.getAttribute('t-zone'));
        }
        return [new FollowRangeZoneNode({ managedZones: zones })];
    }
}
