import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { VNode } from '../../core/src/VNodes/VNode';
import { InlineNode } from './InlineNode';
import { Format } from '../../core/src/Format';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';

export abstract class FormatXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;
    /**
     * Parse a span node.
     *
     * @param nodes
     */
    applyFormat(format: Format, nodes: VNode[]): void {
        for (const node of nodes) {
            format.clone().applyTo(node);
        }
    }
}
