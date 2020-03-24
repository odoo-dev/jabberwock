import { PreNode } from './PreNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';

export class PreDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.tagName === 'PRE';
    };

    async parse(item: Element): Promise<PreNode[]> {
        const pre = new PreNode();
        pre.attributes = this.engine.parseAttributes(item);
        const children = await this.engine.parse(...item.childNodes);
        // TODO: parse contained \n as LineBreaks.
        pre.append(...children);
        return [pre];
    }
}
