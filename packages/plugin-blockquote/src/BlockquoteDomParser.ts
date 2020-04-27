import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { BlockquoteNode } from './BlockquoteNode';
import { nodeName } from '../../utils/src/utils';

export class BlockquoteDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'BLOCKQUOTE';
    };

    async parse(item: Element): Promise<BlockquoteNode[]> {
        const blockquote = new BlockquoteNode();
        blockquote.attributes = this.engine.parseAttributes(item);
        const nodes = await this.engine.parse(...item.childNodes);
        blockquote.append(...nodes);
        return [blockquote];
    }
}
