import { AbstractParser } from '../plugin-parser/src/AbstractParser';
import { VNode } from '../core/src/VNodes/VNode';
import { InlineNode } from './InlineNode';
import { Format } from './Format';

export abstract class FormatParser extends AbstractParser<Node> {
    /**
     * Parse a span node.
     *
     * @param nodes
     */
    applyFormat(format: Format, nodes: VNode[]): void {
        for (const node of nodes) {
            if (node.is(InlineNode)) {
                format.applyTo(node);
            } else {
                const inlineNodes = node.descendants(InlineNode);
                for (const inline of inlineNodes) {
                    format.applyTo(inline);
                }
            }
        }
    }
}
