import { removeFormattingSpace } from '../../utils/src/formattingSpace';
import { CharNode } from './CharNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { VNode } from '../../core/src/VNodes/VNode';
import { isInstanceOf } from '../../utils/src/utils';

export class CharXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => isInstanceOf(item, Text);

    async parse(item: Node): Promise<VNode[]> {
        const nodes: VNode[] = [];
        const text = removeFormattingSpace(item);
        for (let i = 0; i < text.length; i++) {
            const char = text.charAt(i);
            let parsedVNode: VNode;
            if (char === '\n') {
                parsedVNode = new this.engine.editor.configuration.defaults.Separator();
            } else {
                parsedVNode = new CharNode({ char: char });
            }
            nodes.push(parsedVNode);
        }
        return nodes;
    }
}
