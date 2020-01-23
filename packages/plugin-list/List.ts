import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { ListNode, ListType } from './ListNode';
import { ParagraphNode } from '../plugin-paragraph/ParagraphNode';
import { utils } from '../utils/src/utils';

const listTags = ['UL', 'OL'];
const listContextTags = listTags.concat('LI');
/**
 * Return true if the node is a text node containing only whitespace or nothing.
 *
 * @param node
 */
function _isEmptyTextNode(node: Node): boolean {
    return node.nodeType === Node.TEXT_NODE && /^\s*$/.test(node.textContent);
}

export class List extends JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [List.parse];
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (listTags.includes(context.currentNode.nodeName)) {
            return List.parseList({ ...context });
        } else if (context.currentNode.nodeName === 'LI') {
            return List.parseListItem({ ...context });
        }
    }
    /**
     * Parse a list (UL, OL).
     *
     * @param context
     */
    static parseList(currentContext: ParsingContext): [ParsingContext, ParsingMap] {
        const domNode = currentContext.currentNode;
        const parentNode = domNode.parentNode;
        const parentName = parentNode && parentNode.nodeName;
        const parentVNode = currentContext.parentVNode;
        if (listContextTags.includes(parentName) && !parentVNode.is(ListNode)) {
            // We're about to parse an indented list. In our abstraction, an
            // indented list is a direct child of its parent list, regardless
            // of what was already in its <li> parent. So the following example:
            // <ul><li>abc<ul><li>def</li></ul></li></ul>
            // when parsed in our abstraction is equivalent to:
            // <ul><li>abc</li><li><ul><li>def</li></ul></li></ul>
            // Both will eventually be rendered as the former.
            // Set the parent to be the list node rather than the list item.
            currentContext.parentVNode = parentVNode.ancestor(ListNode);
        }
        const listType = domNode.nodeName === 'UL' ? ListType.UNORDERED : ListType.ORDERED;
        const listNode = new ListNode(listType);
        const parsingMap = new Map([[listNode, [currentContext.currentNode]]]);
        currentContext.parentVNode.append(listNode);
        return [currentContext, parsingMap];
    }
    /**
     * Parse a list element (LI).
     *
     * @param context
     */
    static parseListItem(currentContext: ParsingContext): [ParsingContext, ParsingMap] {
        const context = { ...currentContext };
        const children = Array.from(context.currentNode.childNodes);
        const parsingMap: ParsingMap = new Map();
        // An empty text node as first child should be skipped.
        while (children.length && _isEmptyTextNode(children[0])) {
            children.shift();
        }
        // A list item with no children should be skipped.
        if (!children.length) {
            return [context, parsingMap];
        }
        // Inline elements in a list item should be wrapped in a paragraph.
        if (!utils.isBlock(children[0]) || children[0].nodeName === 'BR') {
            const paragraph = new ParagraphNode(); // todo: remove reference to plugin
            context.parentVNode.append(paragraph);
            context.parentVNode = paragraph;
            parsingMap.set(paragraph, [context.currentNode]);
        }
        // Now we can move on to the list item's contents, to be added to
        // the paragraph created above, or to the list itself in the case of
        // blocks.
        return [context, parsingMap];
    }
}
