import { AbstractParser } from '../core/src/AbstractParser';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';
import { DividerNode } from './DividerNode';

export class DividerDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.tagName === 'DIV';
    };

    async parse(item: Element): Promise<DividerNode[]> {
        const divider = new DividerNode();
        divider.attributes = this.engine.parseAttributes(item);
        const nodes = await this.engine.parse(...item.childNodes);
        divider.append(...nodes);
        return [divider];
    }
}
