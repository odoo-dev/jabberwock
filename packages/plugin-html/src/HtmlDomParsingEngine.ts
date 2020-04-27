import { XmlDomParsingEngine } from '../../plugin-xml/src/XmlDomParsingEngine';
import { ParsingIdentifier } from '../../plugin-parser/src/ParsingEngine';

export type HtmlNode = HTMLElement | CharacterData;

export class HtmlDomParsingEngine<T extends HtmlNode = HtmlNode> extends XmlDomParsingEngine<T> {
    static readonly id: ParsingIdentifier = 'dom/html';
    static extends = ['dom/xml'];
}
