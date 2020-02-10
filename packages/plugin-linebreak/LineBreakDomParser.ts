import { LineBreakNode } from './LineBreakNode';
import { AbstractParser } from '../core/src/AbstractParser';
import { DomParsingEngine } from '../plugin-dom/DomParsingEngine';

export class LineBreakDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && item.nodeName === 'BR';
    };

    async parse(item: Element): Promise<LineBreakNode[]> {
        if (!item.nextSibling) {
            // A <br/> with no siblings is there only to make its parent visible.
            // Consume it since it was just parsed as its parent element node.
            // TODO: do this less naively to account for formatting space.
            return [];
        }
        const lineBreak = new LineBreakNode();
        lineBreak.attributes = this.engine.parseAttributes(item);
        return [lineBreak];
    }
}
