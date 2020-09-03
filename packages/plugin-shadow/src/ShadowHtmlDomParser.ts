import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { HtmlDomParsingEngine, HtmlNode } from '../../plugin-html/src/HtmlDomParsingEngine';
import { ShadowNode } from './ShadowNode';
import { nodeName } from '../../utils/src/utils';
import { TagNode } from '../../core/src/VNodes/TagNode';

export class ShadowHtmlDomParser extends AbstractParser<Node> {
    static id = HtmlDomParsingEngine.id;
    engine: HtmlDomParsingEngine;

    predicate = (item: HTMLElement): boolean => {
        return item instanceof HTMLElement && !!item.shadowRoot;
    };

    /**
     * Parse a shadow node and extract styling from shadow root.
     *
     * @param item
     */
    async parse(item: HTMLElement): Promise<VNode[]> {
        const shadowRoot = item.shadowRoot;
        const shadow = new ShadowNode();
        const childNodes = Array.from(shadowRoot.childNodes) as HtmlNode[];
        const nodes = await this.engine.parse(...childNodes);
        shadow.append(...nodes);
        if (nodeName(item) === 'JW-SHADOW') {
            return [shadow];
        } else {
            const element = new TagNode({ htmlTag: nodeName(item) });
            const attributes = this.engine.parseAttributes(item);
            if (attributes.length) {
                element.modifiers.append(attributes);
            }
            element.append(shadow);
            return [element];
        }
    }
}
