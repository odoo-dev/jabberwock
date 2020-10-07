import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { HtmlDomParsingEngine, HtmlNode } from '../../plugin-html/src/HtmlDomParsingEngine';
import { nodeName, flat } from '../../utils/src/utils';
import { IframeNode } from './IframeNode';
import { IframeContainerNode } from './IframeContainerNode';
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
        if (item.getAttribute('name') && item.getAttribute('name') === 'jw-iframe') {
            const iframe = new IframeContainerNode();
            const attributes = this.engine.parseAttributes(item);
            if (attributes.length) {
                iframe.modifiers.append(attributes);
            }
            const childNodes = item.src
                ? []
                : (Array.from(item.contentWindow?.document.body?.childNodes || []) as HtmlNode[]);
            let nodes = await this.engine.parse(...childNodes);
            nodes = flat(
                nodes.map(node => (node instanceof ShadowNode ? node.childVNodes : [node])),
            );
            iframe.append(...nodes);
            return [iframe];
        } else {
            const iframe = new IframeNode();
            const attributes = this.engine.parseAttributes(item);
            if (attributes.length) {
                iframe.modifiers.append(attributes);
            }
            return [iframe];
        }
    }
}
