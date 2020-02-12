import { AbstractParser } from '../core/src/AbstractParser';
import { VNode } from '../core/src/VNodes/VNode';
import { InlineNode } from '../plugin-inline/InlineNode';
import { Format } from './Format';

export abstract class FormatDomParser extends AbstractParser<Node> {
    static id = 'dom';

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
