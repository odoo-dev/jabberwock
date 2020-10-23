import { nodeName } from './utils';

/**
 * The following is a complete list of all HTML "block-level" elements.
 *
 * Source:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/Block-level_elements
 *
 * */
const blockTagNames = [
    'ADDRESS',
    'ARTICLE',
    'ASIDE',
    'BLOCKQUOTE',
    'DETAILS',
    'DIALOG',
    'DD',
    'DIV',
    'DL',
    'DT',
    'FIELDSET',
    'FIGCAPTION',
    'FIGURE',
    'FOOTER',
    'FORM',
    'H1',
    'H2',
    'H3',
    'H4',
    'H5',
    'H6',
    'HEADER',
    'HGROUP',
    'HR',
    'LI',
    'MAIN',
    'NAV',
    'OL',
    'P',
    'PRE',
    'SECTION',
    'TABLE',
    'UL',
    // The following elements are not in the W3C list, for some reason.
    'SELECT',
    'TR',
    'TD',
    'TBODY',
    'THEAD',
    'TH',
];

const computedStyles = new WeakMap<Node, CSSStyleDeclaration>();

/**
 * Return true if the given node is a block-level element, false otherwise.
 *
 * @param node
 */
export function isBlock(node: Node): boolean {
    let result: boolean;
    if (node instanceof Element) {
        const tagName = nodeName(node);
        // Every custom jw-* node will be considered as blocks.
        if (tagName.startsWith('JW-') || tagName === 'T') {
            return true;
        }
        // The node might not be in the DOM, in which case it has no CSS values.
        if (window.document !== node.ownerDocument) {
            return blockTagNames.includes(tagName);
        }
        // We won't call `getComputedStyle` more than once per node.
        let style = computedStyles.get(node);
        if (!style) {
            style = window.getComputedStyle(node);
            computedStyles.set(node, style);
        }
        if (style.display) {
            result = !style.display.includes('inline') && style.display !== 'contents';
        } else {
            result = blockTagNames.includes(tagName);
        }
    } else {
        result = false;
    }
    return result;
}
