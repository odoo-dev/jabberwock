import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../core/src/AbstractParser';
import { VElement } from '../../core/src/VNodes/VElement';
import { DomParsingEngine } from './DomParsingEngine';

export class DefaultDomParser extends AbstractParser<Node> {
    static id = 'dom';
    engine: DomParsingEngine;

    async parse(item: Node): Promise<VNode[]> {
        const element = new VElement(item.nodeName);
        if (item instanceof Element) {
            element.attributes = this.engine.parseAttributes(item);
        }
        // If the node could not be parsed, create a generic element node with
        // the HTML tag of the DOM Node. This way we may not support the node
        // but we don't break it either.
        const nodes = await this.engine.parse(...item.childNodes);
        element.append(...nodes);
        return [element];
    }
}
