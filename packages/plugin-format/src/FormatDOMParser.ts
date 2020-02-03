import { Format } from '../../utils/src/Format';
import { CharNode } from '../../plugin-char/CharNode';
import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../core/src/AbstractParser';

export class FormatDomParser extends AbstractParser<Node> {
    static id = 'dom';

    predicate = (item: Node): boolean => {
        return !!Format.fromTag(item.nodeName);
    };

    async parse(item: Node): Promise<VNode[]> {
        const format = Format.fromTag(item.nodeName);
        const nodes = await this.engine.parse(...item.childNodes);
        for (const node of nodes) {
            if (node.is(CharNode)) {
                node[format] = true;
            } else {
                const charNodes = node.descendants(CharNode);
                for (const char of charNodes) {
                    char[format] = true;
                }
            }
        }
        return nodes;
    }
}
