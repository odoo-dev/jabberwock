import { VNode } from '../../core/src/VNodes/VNode';
import { HtmlTextParsingEngine } from './HtmlTextParsingEngine';
import { AbstractParser } from '../../plugin-parser/src/AbstractParser';
import { Parser } from '../../plugin-parser/src/Parser';

export const autoCloseTag = [
    'AREA',
    'BASE',
    'BR',
    'COL',
    'EMBED',
    'HR',
    'IMG',
    'INPUT',
    'KEYGEN',
    'LINK',
    'META',
    'PARAM',
    'SOURCE',
    'TRACK',
    'WBR',
];
const autoCloseRegExp = new RegExp('<((' + autoCloseTag.join('|') + ')[^>]*)>', 'gi');

export class DefaultHtmlTextParser extends AbstractParser<string> {
    static id = 'text/html';
    engine: HtmlTextParsingEngine;

    async parse(item: string): Promise<VNode[]> {
        const domParser = new DOMParser();
        const template = item
            .replace(autoCloseRegExp, match =>
                match[match.length - 2] === '/' ? match : match.slice(0, -1) + '/>',
            )
            .replace(/&/g, '&amp;');
        const xmlDoc = domParser.parseFromString('<t>' + template + '</t>', 'text/xml');
        const parser = this.engine.editor.plugins.get(Parser);
        return parser.parse('dom/xml', ...xmlDoc.firstChild.childNodes);
    }
}
