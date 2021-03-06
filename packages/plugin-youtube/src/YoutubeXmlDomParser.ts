import { YoutubeNode } from './YoutubeNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class YoutubeXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (item: Node): boolean => {
        const isYoutubeVideo =
            item instanceof Element &&
            nodeName(item) === 'IFRAME' &&
            item.getAttribute('src') &&
            item.getAttribute('src').includes('youtu');
        return isYoutubeVideo;
    };

    async parse(item: Element): Promise<YoutubeNode[]> {
        const youtube = new YoutubeNode();
        youtube.modifiers.append(this.engine.parseAttributes(item));
        return [youtube];
    }
}
