import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';
import { VNode } from '../../core/src/VNodes/VNode';
import { BootstrapButtonNode } from './BootstrapButtonNode';
import { CharNode } from '../../plugin-char/src/CharNode';

export class BootstrapButtonXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;
    predicate = (item: Node): boolean => {
        return item instanceof Element && nodeName(item) === 'A' && item.classList.contains('btn');
    };

    /**
     * Parse a bold node.
     *
     * @param item
     */
    async parse(item: Element): Promise<VNode[]> {
        const button = new BootstrapButtonNode();
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            button.modifiers.append(attributes);
        }
        const children = await this.engine.parse(...item.childNodes);
        button.append(new CharNode({ char: '\u200B' }), ...children);
        return [button, new CharNode({ char: '\u200B' })];
    }
}
