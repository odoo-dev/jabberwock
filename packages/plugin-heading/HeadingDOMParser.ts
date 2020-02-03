import { HeadingNode } from './HeadingNode';
import { AbstractParser } from '../core/src/AbstractParser';

const HeadingTags = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'];

export class HeadingDomParser extends AbstractParser<Node> {
    static id = 'dom';

    predicate = (item: Node): boolean => {
        return HeadingTags.includes(item.nodeName);
    };

    async parse(item: Node): Promise<HeadingNode[]> {
        const heading = new HeadingNode(parseInt(item.nodeName[1], 10));
        const nodes = await this.engine.parse(...item.childNodes);
        heading.append(...nodes);
        return [heading];
    }
}
