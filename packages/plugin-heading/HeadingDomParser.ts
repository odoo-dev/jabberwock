import { HeadingNode } from './HeadingNode';
import { AbstractParser } from '../core/src/AbstractParser';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

const HeadingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

export class HeadingDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && HeadingTags.includes(item.nodeName);
    };

    async parse(item: Element): Promise<HeadingNode[]> {
        const heading = new HeadingNode(parseInt(item.nodeName[1], 10));
        heading.attributes = this.engine.parseAttributes(item);
        const nodes = await this.engine.parse(...item.childNodes);
        heading.append(...nodes);
        return [heading];
    }
}
