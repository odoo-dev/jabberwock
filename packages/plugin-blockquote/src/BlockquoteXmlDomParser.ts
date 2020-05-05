import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { BlockquoteNode } from './BlockquoteNode';
import { nodeName } from '../../utils/src/utils';

export class BlockquoteXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

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
