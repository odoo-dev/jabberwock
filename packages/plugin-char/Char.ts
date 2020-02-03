import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingContext, ParsingMap } from '../core/src/Parser';
import { CharNode } from './CharNode';
import { removeFormattingSpace } from '../utils/src/formattingSpace';
import { RangeParams } from '../core/src/CorePlugin';
import { VNode } from '../core/src/VNodes/VNode';
import { MarkerNode } from '../core/src/VNodes/MarkerNode';

export interface InsertTextParams extends RangeParams {
    text: string;
}

export class Char extends JWPlugin {
    readonly parsingFunctions = [this.parse.bind(this)];
    readonly renderingFunctions = {
        dom: this.renderToDom.bind(this),
    };
    commands = {
        insertText: {
            handler: this.insertText.bind(this),
        },
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        if (context.currentNode.nodeType === Node.TEXT_NODE) {
            const vNodes: CharNode[] = [];
            const text = removeFormattingSpace(context.currentNode);
            const format = context.format || {};
            for (let i = 0; i < text.length; i++) {
                const parsedVNode = new CharNode(text.charAt(i), { ...format });
                vNodes.push(parsedVNode);
            }
            const formatTags = Object.values(format).map(value => value.htmlTag);
            const parsingMap = new Map(
                vNodes.map(vNode => {
                    const domNodes = [context.currentNode];
                    let parent = context.currentNode.parentNode;
                    while (parent && formatTags.includes(parent.nodeName)) {
                        domNodes.unshift(parent);
                        parent = parent.parentNode;
                    }
                    return [vNode, domNodes];
                }),
            );
            vNodes.forEach(node => context.parentVNode.append(node));
            return [context, parsingMap];
        }
    }
    async renderToDom(node: VNode, domParent: Node): Promise<Map<VNode, Node[]>> {
        if (node.is(CharNode)) {
            // If the node has a format, render the format nodes first.
            const fragment = document.createDocumentFragment();
            let parent: Node = fragment;
            const renderedFormats = [];
            Object.values(node.format || {}).forEach(value => {
                const formatNode = value.render();
                renderedFormats.push(formatNode);
                parent.appendChild(formatNode);
                // Update the parent so the text is inside the format node.
                parent = formatNode;
            });
            // If the node has attributes, wrap it inside a span with those attributes.
            if (node.attributes && node.attributes.size) {
                const span = document.createElement('span');
                node.attributes.forEach((value: string, name: string) => {
                    span.setAttribute(name, value);
                });
                renderedFormats.push(span);
                parent.appendChild(span);
                // Update the parent so the text is inside the format node.
                parent = span;
            }
            // Consecutive compatible char nodes are rendered as a single text node.
            let text = '' + node.char;
            let next = node.nextSibling();
            const charNodes = [node];
            while (next && Char._isSameTextNode(node, next)) {
                if (next instanceof CharNode) {
                    charNodes.push(next);
                    if (next.char === ' ' && text[text.length - 1] === ' ') {
                        // Browsers don't render consecutive space chars otherwise.
                        text += '\u00A0';
                    } else {
                        text += next.char;
                    }
                }
                next = next.nextSibling();
            }
            // Browsers don't render leading/trailing space chars otherwise.
            text = text.replace(/^ | $/g, '\u00A0');

            // Create and append the text node, update the VDocumentMap.
            const renderedNode = document.createTextNode(text);
            parent.appendChild(renderedNode);
            domParent.appendChild(fragment);
            return new Map(
                [...charNodes, ...renderedFormats].map(node => {
                    return [node, [renderedNode]];
                }),
            );
        }
    }
    /**
     * Insert text at the current position of the selection.
     *
     * If the selection is collapsed, add `text` to the vDocument and copy the
     * formating of the previous char or the next char.
     *
     * If the selection is not collapsed, replace the text with the formating
     * that was present in the selection.
     *
     * @param text
     */
    insertText(params: InsertTextParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const text = params.text;
        const format = this.editor.vDocument.getCurrentFormat();
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            this.editor.vDocument.deleteSelection(range);
        }
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('');
        characters.forEach(char => {
            const vNode = new CharNode(char, format);
            range.start.before(vNode);
        });
        this.editor.vDocument.formatCache = null;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if `a` has the same format properties as `b`.
     *
     * @param a
     * @param b
     */
    static _isSameTextNode(a: VNode, b: VNode): boolean {
        if (a.is(CharNode) && b.is(CharNode)) {
            // Char VNodes are the same text node if they have the same format,
            // attributes and format attributes.
            const formats = Object.keys({ ...a.format, ...b.format });
            const attributes = [
                ...(a.attributes || new Map()).keys(),
                ...(b.attributes || new Map()).keys(),
            ];
            return (
                formats.every(k => {
                    const aFormat = (a.format || {})[k];
                    const bFormat = (b.format || {})[k];
                    if (aFormat) {
                        if (!bFormat) {
                            return false;
                        } else {
                            const formatAttributes = [
                                ...(aFormat.attributes || new Map()).keys(),
                                ...(bFormat.attributes || new Map()).keys(),
                            ];
                            return formatAttributes.every(
                                k =>
                                    (aFormat.attributes || new Map()).get(k) ===
                                    (bFormat.attributes || new Map()).get(k),
                            );
                        }
                    } else {
                        return !bFormat;
                    }
                }) &&
                attributes.every(
                    k => (a.attributes || new Map()).get(k) === (b.attributes || new Map()).get(k),
                )
            );
        } else if (a.is(MarkerNode) || b.is(MarkerNode)) {
            // A Marker node is always considered to be part of the same text
            // node as another node in the sense that the text node must not
            // be broken up just because it contains a marker.
            return true;
        } else {
            // Nodes that are not valid in a text node must end the text node.
            return false;
        }
    }
}
