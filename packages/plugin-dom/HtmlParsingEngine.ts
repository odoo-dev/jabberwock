import { ParsingEngine } from '../plugin-parser/src/ParsingEngine';
import { DefaultHtmlParser } from './DefaultHtmlParser';

export class HtmlParsingEngine extends ParsingEngine<string> {
    static readonly id = 'html';
    static readonly defaultParser = DefaultHtmlParser;
}
