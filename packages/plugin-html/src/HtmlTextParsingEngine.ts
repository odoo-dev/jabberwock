import { ParsingEngine } from '../../plugin-parser/src/ParsingEngine';
import { DefaultHtmlTextParser } from './DefaultHtmlTextParser';

export class HtmlTextParsingEngine extends ParsingEngine<string> {
    static readonly id = 'text/html';
    static readonly defaultParser = DefaultHtmlTextParser;
}
