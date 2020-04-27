import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { MetadataNode } from './MetadataNode';
import { nodeName } from '../../utils/src/utils';

// See https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Content_categories#Metadata_content
const METADATA_NODENAMES = [
    'BASE',
    'COMMAND',
    'LINK',
    'META',
    'NOSCRIPT',
    'SCRIPT',
    'STYLE',
    'TITLE',
];

export class MetadataDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    predicate = (item: Node): boolean => {
        return item instanceof Element && METADATA_NODENAMES.includes(nodeName(item));
    };

    async parse(item: Element): Promise<MetadataNode[]> {
        const technical = new MetadataNode(nodeName(item) as 'SCRIPT' | 'STYLE');
        technical.attributes = this.engine.parseAttributes(item);
        technical.contents = item.innerHTML;
        return [technical];
    }
}
