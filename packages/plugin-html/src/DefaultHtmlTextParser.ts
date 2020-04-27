import { VNode } from '../../core/src/VNodes/VNode';
import { HtmlTextParsingEngine } from './HtmlTextParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { Parser } from '../../plugin-parser/src/Parser';

const autoCloseRegExp = /(<(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)[^/]*)>/gi;

export class DefaultHtmlTextParser extends AbstractParser<string> {
    static id = 'text/html';
    engine: HtmlTextParsingEngine;

    async parse(item: string): Promise<VNode[]> {
        const domParser = new DOMParser();
        const template = item.replace(autoCloseRegExp, '$1/>');
        const xmlDoc = domParser.parseFromString('<t>' + template + '</t>', 'text/xml');
        const parser = this.engine.editor.plugins.get(Parser);
        return parser.parse('dom/xml', ...xmlDoc.firstChild.childNodes);
    }
}
