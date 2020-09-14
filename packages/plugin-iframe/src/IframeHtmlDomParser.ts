import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { HtmlDomParsingEngine, HtmlNode } from '../../plugin-html/src/HtmlDomParsingEngine';
import { IframeNode } from './IframeNode';
import { nodeName, flat } from '../../utils/src/utils';
import { ShadowNode } from '../../plugin-shadow/src/ShadowNode';

export class IframeHtmlDomParser extends AbstractParser<Node> {
    static id = HtmlDomParsingEngine.id;
    engine: HtmlDomParsingEngine;

    predicate = (item: HTMLElement): boolean => {
        return item instanceof HTMLElement && nodeName(item) === 'IFRAME';
    };

    /**
     * Parse a shadow node and extract styling from shadow root.
     *
     * @param item
     */
    async parse(item: HTMLIFrameElement): Promise<VNode[]> {
        const iframe = new IframeNode({ src: item.src });
        const attributes = this.engine.parseAttributes(item);
        if (attributes.length) {
            iframe.modifiers.append(attributes);
        }
        const childNodes = item.src
            ? []
            : (Array.from(item.contentWindow?.document.body?.childNodes || []) as HtmlNode[]);
        let nodes = await this.engine.parse(...childNodes);
        nodes = flat(nodes.map(node => (node instanceof ShadowNode ? node.childVNodes : [node])));
        iframe.append(...nodes);
        return [iframe];
    }
}
