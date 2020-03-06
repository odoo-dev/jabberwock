import { ParagraphNode } from './ParagraphNode';
import { AbstractParser } from '../../core/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';

export class ParagraphDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.tagName === 'P';
    };

    async parse(item: Element): Promise<ParagraphNode[]> {
        const paragraph = new ParagraphNode();
        paragraph.attributes = this.engine.parseAttributes(item);
        const nodes = await this.engine.parse(...item.childNodes);
        paragraph.append(...nodes);
        return [paragraph];
    }
}
