import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Metadata } from '../../plugin-metadata/src/Metadata';
import { isInstanceOf } from '../../utils/src/utils';

type StyleCache = {
    selector: string;
    style: Record<string, string>;
};

export class Stylesheet<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Metadata];
    private rulesCache = new Map<Document | ShadowRoot, StyleCache[]>();

    /**
     * Returns the css rules which applies on an node.
     *
     * @param {DOMElement} Node
     * @returns {Object} css property name -> css property value
     */
    getStyleFromCSSRules(node: Node): Record<string, string> {
        const el = isInstanceOf(node, Element) ? node : node.parentElement;
        return this.getFilteredStyleFromCSSRules(
            selector => el.matches(selector),
            node.ownerDocument,
        );
    }

    getFilteredStyleFromCSSRules(
        filter: (selector: string) => boolean,
        doc: Document | ShadowRoot = document,
    ): Record<string, string> {
        const ruleList: StyleCache[] = [];
        for (const rule of this._getMatchedCSSRules(doc)) {
            if (filter(rule.selector)) {
                ruleList.push(rule);
            }
        }
        return this._rulesToStyle(ruleList);
    }

    private _rulesToStyle(ruleList: StyleCache[]): Record<string, string> {
        ruleList.sort((a, b) => {
            return this._specificity(a.selector) - this._specificity(b.selector);
        });

        const style: Record<string, string> = {};
        for (const rule of ruleList) {
            for (const prop in rule.style) {
                const value = rule.style[prop];
                if (
                    prop.indexOf('-webkit') === -1 &&
                    (!style[prop] ||
                        style[prop].indexOf('important') === -1 ||
                        value.indexOf('important') !== -1)
                ) {
                    style[prop] = value;
                }
            }
        }

        for (const prop in style) {
            const value = style[prop];
            if (value.indexOf('important') !== -1) {
                style[prop] = value.slice(0, value.length - 11);
            }
        }

        // The css generates all the attributes separately and not in simplified form.
        // In order to have a better compatibility (outlook for example) we simplify the css tags.
        // e.g. border-left-style: none; border-bottom-s .... will be simplified in border-style = none
        const props = [
            { property: 'margin' },
            { property: 'padding' },
            { property: 'border', propertyEnd: '-style', defaultValue: 'none' },
        ];
        for (const propertyInfo of props) {
            const p = propertyInfo.property;
            const e = propertyInfo.propertyEnd || '';
            const defVal = propertyInfo.defaultValue || 0;

            if (
                style[p + '-top' + e] ||
                style[p + '-right' + e] ||
                style[p + '-bottom' + e] ||
                style[p + '-left' + e]
            ) {
                if (
                    style[p + '-top' + e] === style[p + '-right' + e] &&
                    style[p + '-top' + e] === style[p + '-bottom' + e] &&
                    style[p + '-top' + e] === style[p + '-left' + e]
                ) {
                    // keep => property: [top/right/bottom/left value];
                    style[p + e] = style[p + '-top' + e];
                } else {
                    // keep => property: [top value] [right value] [bottom value] [left value];
                    style[p + e] =
                        (style[p + '-top' + e] || defVal) +
                        ' ' +
                        (style[p + '-right' + e] || defVal) +
                        ' ' +
                        (style[p + '-bottom' + e] || defVal) +
                        ' ' +
                        (style[p + '-left' + e] || defVal);
                    if (
                        style[p + e].indexOf('inherit') !== -1 ||
                        style[p + e].indexOf('initial') !== -1
                    ) {
                        // keep => property-top: [top value]; property-right: [right value]; property-bottom: [bottom value]; property-left: [left value];
                        delete style[p + e];
                        continue;
                    }
                }
                delete style[p + '-top' + e];
                delete style[p + '-right' + e];
                delete style[p + '-bottom' + e];
                delete style[p + '-left' + e];
            }
        }

        if (style['border-bottom-left-radius']) {
            style['border-radius'] = style['border-bottom-left-radius'];
            delete style['border-bottom-left-radius'];
            delete style['border-bottom-right-radius'];
            delete style['border-top-left-radius'];
            delete style['border-top-right-radius'];
        }

        // if the border styling is initial we remove it to simplify the css tags for compatibility.
        // Also, since we do not send a css style tag, the initial value of the border is useless.
        for (const prop in Object.keys(style)) {
            if (prop.indexOf('border') !== -1 && style[prop] === 'initial') {
                delete style[prop];
            }
        }

        // text-decoration rule is decomposed in -line, -color and -style. This is
        // however not supported by many browser/mail clients and the editor does
        // not allow to change -color and -style rule anyway
        if (style['text-decoration-line']) {
            style['text-decoration'] = style['text-decoration-line'];
            delete style['text-decoration-line'];
            delete style['text-decoration-color'];
            delete style['text-decoration-style'];
        }

        return style;
    }

    private _specificity(selector: string): number {
        // http://www.w3.org/TR/css3-selectors/#specificity
        let a = 0;
        let b = 0;
        let c = 0;
        selector
            .replace(/#[a-z0-9_-]+/gi, function() {
                a++;
                return '';
            })
            .replace(/(\.[a-z0-9_-]+)|(\[.*?\])/gi, function() {
                b++;
                return '';
            })
            .replace(/(^|\s+|:+)[a-z0-9_-]+/gi, function(a) {
                if (a.indexOf(':not(') === -1) c++;
                return '';
            });
        return a * 100 + b * 10 + c;
    }

    private _getMatchedCSSRules(doc: Document | ShadowRoot): StyleCache[] {
        let rulesCache = this.rulesCache.get(doc);
        if (!rulesCache) {
            rulesCache = [];
            const sheets: CSSStyleSheet[] = [];
            for (const sheet of doc.styleSheets) {
                if (sheet instanceof CSSStyleSheet) {
                    try {
                        // try...catch because browser may not able to enumerate rules for cross-domain sheets
                        if (!sheet.rules) continue;
                    } catch (e) {
                        console.warn("Can't read the css rules of: " + sheet.href, e);
                        continue;
                    }
                    sheets.push(sheet);
                }
            }
            for (const sheet of sheets) {
                for (const rule of sheet.rules) {
                    if (rule instanceof CSSStyleRule && rule.selectorText?.indexOf("'") === -1) {
                        // We don't parse CSSMediaRule or CSSKeyframesRule.
                        // TODO: add better parser for quote inside selector.
                        const fullSelectors = rule.selectorText;
                        const style = {};
                        for (let i = 0; i < rule.style.length; i++) {
                            const prop = rule.style[i];
                            const value = rule.style[prop];
                            if (prop.indexOf('animation') !== -1) {
                                continue;
                            }
                            style[prop] =
                                style[
                                    prop.replace(/-(.)/g, function(a, b) {
                                        return b.toUpperCase();
                                    })
                                ];
                            if (new RegExp(prop + 's*:[^:;]+!important').test(rule.cssText)) {
                                style[prop] += ' !important';
                            }
                            style[prop] = value;
                        }
                        for (const selector of fullSelectors.split(',')) {
                            rulesCache.push({ selector: selector, style: style });
                        }
                    }
                }
            }
            this.rulesCache.set(doc, rulesCache);
        }
        return rulesCache;
    }
}
