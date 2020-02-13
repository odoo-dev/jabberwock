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
        // We won't call `getComputedStyle` more than once per node.
        let style = computedStyles.get(node);
        if (!style) {
            style = window.getComputedStyle(node);
        }
        // The node might not be in the DOM, in which case it has no CSS values.
        if (style.display) {
            result = style.display.includes('block') || style.display.includes('list');
        } else {
            result = blockTagNames.includes(node.nodeName);
        }
    } else {
        result = false;
    }
    return result;
}
