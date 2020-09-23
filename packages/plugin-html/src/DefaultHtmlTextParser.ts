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
const autoCloseRegExp = new RegExp('<((' + autoCloseTag.join('|') + ')(\\s[^>]*)?)>', 'gi');

export class DefaultHtmlTextParser extends AbstractParser<string> {
    static id = 'text/html';
    engine: HtmlTextParsingEngine;

    async parse(item: string): Promise<VNode[]> {
        const domParser = new DOMParser();
        let template = item;

        // Parse as xml, we must escape "<" & ">" in attributes.
        let inTag = false;
        let attributeQuote = '"';
        let attributeIndex = -1;
        for (let i = 0; i < template.length; i++) {
            if (inTag && (template[i] === '"' || template[i] === "'")) {
                if (attributeIndex === -1) {
                    attributeIndex = i;
                    attributeQuote = template[i];
                } else if (attributeQuote === template[i]) {
                    const attribute = template.slice(attributeIndex, i + 1);
                    const fixed = attribute.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                    template = template.slice(0, attributeIndex) + fixed + template.slice(i + 1);
                    attributeIndex = -1;
                    i += fixed.length - attribute.length;
                }
            }
            if (attributeIndex === -1) {
                if (template[i] === '<') {
                    inTag = true;
                } else if (template[i] === '>') {
                    inTag = false;
                }
            }
        }

        // Auto close tags.
        template = template.replace(autoCloseRegExp, match =>
            match[match.length - 2] === '/' ? match : match.slice(0, -1) + '/>',
        );

        // Unescape spaces.
        template = template.replace(/&nbsp;/g, '\u00A0');

        const xmlDoc = domParser.parseFromString('<t>' + template + '</t>', 'text/xml');
        const parser = this.engine.editor.plugins.get(Parser);

        return parser.parse('dom/xml', ...xmlDoc.firstChild.childNodes);
    }
}
