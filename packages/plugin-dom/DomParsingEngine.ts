import { ParsingEngine } from '../core/src/ParsingEngine';
import { DefaultDomParser } from './DefaultDomParser';

export class DomParsingEngine extends ParsingEngine<Node> {
    static readonly id = 'dom';
    static readonly defaultParser = DefaultDomParser;
}
