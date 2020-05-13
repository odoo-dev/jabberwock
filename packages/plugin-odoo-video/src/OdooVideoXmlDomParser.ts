import { OdooVideoNode } from './OdooVideoNode';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { nodeName } from '../../utils/src/utils';

export class OdooVideoXmlDomParser extends AbstractParser<Node> {
    static id = XmlDomParsingEngine.id;
    engine: XmlDomParsingEngine;

    predicate = (node: Node): boolean => {
        const isVideo =
            node instanceof Element &&
            nodeName(node) === 'DIV' &&
            node.classList.contains('media_iframe_video') &&
            node.attributes['data-oe-expression'] &&
            node.attributes['data-oe-expression'].value;
        return isVideo;
    };

    async parse(element: Element): Promise<OdooVideoNode[]> {
        const video = new OdooVideoNode({ src: element.attributes['data-oe-expression'].value });
        video.attributes = this.engine.parseAttributes(element);
        return [video];
    }
}
