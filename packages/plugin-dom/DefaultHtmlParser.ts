import { VNode } from '../core/src/VNodes/VNode';
import { HtmlParsingEngine } from './HtmlParsingEngine';
import { AbstractParser } from '../plugin-parser/src/AbstractParser';
import { Parser } from '../plugin-parser/src/Parser';

const autoCloseRegExp = /(<(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)[^/]*)>/gi;

export class DefaultHtmlParser extends AbstractParser<string> {
    static id = 'dom';
    engine: HtmlParsingEngine;

    async parse(item: string): Promise<VNode[]> {
        const domParser = new DOMParser();
        const template = item.replace(autoCloseRegExp, '$1/>');
        const xmlDoc = domParser.parseFromString('<t>' + template + '</t>', 'text/xml');
        const parser = this.engine.editor.plugins.get(Parser);
        return parser.engines.dom.parse(...xmlDoc.firstChild.childNodes);
    }
}
