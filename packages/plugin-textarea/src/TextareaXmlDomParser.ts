import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';
import { TextareaNode } from './TextareaNode';

export class TextareaXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;
    predicate = (item: Node): boolean => nodeName(item) === 'TEXTAREA';

    /**
     * Parse a list (UL, OL) and its children list elements (LI).
     *
     * @param context
     */
    async parse(item: HTMLTextAreaElement): Promise<VNode[]> {
        const textarea = new TextareaNode({ value: item.value });
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            textarea.modifiers.append(attributes);
        }
        return [textarea];
    }
}
