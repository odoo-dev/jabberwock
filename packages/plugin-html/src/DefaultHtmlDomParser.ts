import { DefaultXmlDomParser } from '../../plugin-xml/src/DefaultXmlDomParser';
import { HtmlDomParsingEngine } from './HtmlDomParsingEngine';

export class DefaultHtmlDomParser extends DefaultXmlDomParser {
    static id = 'dom/html';
    engine: HtmlDomParsingEngine;
}
