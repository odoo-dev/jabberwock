import { ParagraphNode } from './ParagraphNode';
import { AbstractParser } from '../core/src/AbstractParser';

export class ParagraphDomParser extends AbstractParser<Node> {
    static id = 'dom';

    predicate = (item: Node): boolean => {
        return item.nodeName === 'P';
    };

    async parse(item: Node): Promise<ParagraphNode[]> {
        const paragraph = new ParagraphNode();
        const nodes = await this.engine.parse(...item.childNodes);
        paragraph.append(...nodes);
        return [paragraph];
    }
}
