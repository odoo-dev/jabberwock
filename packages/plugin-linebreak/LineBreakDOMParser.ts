import { LineBreakNode } from './LineBreakNode';
import { AbstractParser } from '../core/src/AbstractParser';

export class LineBreakDomParser extends AbstractParser<Node> {
    static id = 'dom';

    predicate = (item: Node): boolean => {
        return item.nodeName === 'BR';
    };

    async parse(item: Node): Promise<LineBreakNode[]> {
        if (!item.nextSibling) {
            // A <br/> with no siblings is there only to make its parent visible.
            // Consume it since it was just parsed as its parent element node.
            // TODO: do this less naively to account for formatting space.
            return [];
        }
        return [new LineBreakNode()];
    }
}
