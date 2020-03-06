import { AbstractParser } from '../../core/src/AbstractParser';
import { DomParsingEngine } from '../../plugin-dom/src/DomParsingEngine';
import { MetadataNode } from './MetadataNode';

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
        return item instanceof Element && METADATA_NODENAMES.includes(item.tagName);
    };

    async parse(item: Element): Promise<MetadataNode[]> {
        const technical = new MetadataNode(item.tagName as 'SCRIPT' | 'STYLE');
        technical.attributes = this.engine.parseAttributes(item);
        technical.contents = item.innerHTML;
        return [technical];
    }
}
