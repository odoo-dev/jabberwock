import { JWPlugin } from '../core/src/JWPlugin';
import { ParsingFunction, ParsingContext, ParsingMap } from '../core/src/Parser';
import { CharNode, FormatType, FORMAT_TYPES } from './CharNode';
import { removeFormattingSpace } from '../utils/src/formattingSpace';
import { createMap } from '../core/src/VDocumentMap';
import { Format } from '../utils/src/Format';
import { FormatParams, InsertTextParams } from '../core/src/CorePlugin';

export class Char extends JWPlugin {
    commands = {
        insertText: {
            handler: this.insertText.bind(this),
        },
        applyFormat: {
            handler: this.applyFormat.bind(this),
        },
    };
    static parsingPredicate(node: Node): ParsingFunction {
        if (node.nodeType === Node.TEXT_NODE) {
            return Char.parse;
        }
    }
    static parse(context: ParsingContext): [ParsingContext, ParsingMap] {
        const vNodes: CharNode[] = [];
        const text = removeFormattingSpace(context.currentNode);
        const format = context.format;
        for (let i = 0; i < text.length; i++) {
            const parsedVNode = new CharNode(text.charAt(i), { ...format });
            vNodes.push(parsedVNode);
        }
        const parsingMap = createMap(
            vNodes.map(vNode => {
                const domNodes = [context.currentNode];
                let parent = context.currentNode.parentNode;
                while (parent && Format.tags.includes(parent.nodeName)) {
                    domNodes.unshift(parent);
                    parent = parent.parentNode;
                }
                return [vNode, domNodes];
            }),
        );
        vNodes.forEach(node => context.parentVNode.append(node));
        return [context, parsingMap];
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Apply the `format` to the range.
     *
     * If the range is collapsed, set the format on the range so we know in the next insert
     * which format should be used.
     */
    applyFormat(params: FormatParams): void {
        const formatName = params.format;
        const range = this.editor.vDocument.range;
        if (range.isCollapsed()) {
            if (!this.editor.vDocument.formatCache) {
                this.editor.vDocument.formatCache = this._getCurrentFormat();
            }
            this.editor.vDocument.formatCache[formatName] = !this.editor.vDocument.formatCache[
                formatName
            ];
        } else {
            const selectedChars = range.selectedNodes(CharNode);

            // If there is no char with the format `formatName` in the range, set the format to true
            // for all nodes.
            if (!selectedChars.every(char => char.format[formatName])) {
                selectedChars.forEach(char => {
                    char[formatName] = true;
                });
                // If there is at least one char in with the format `fomatName` in the range, set the
                // format to false for all nodes.
            } else {
                selectedChars.forEach(char => {
                    char[formatName] = false;
                });
            }
        }
    }
    /**
     * Insert text at range.
     *
     * If the range is collapsed, add `text` to the vDocument and copy the formating of the
     * previous char or the next char.
     *
     * If the range is not collapsed, replace the text with the formating that was present in the
     * range.
     *
     * @param text
     */
    insertText(params: InsertTextParams): void {
        const text = params.value;
        const format = this._getCurrentFormat();
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('');
        const nodes = characters.map(char => new CharNode(char, format));
        this.editor.vDocument.formatCache = null;
        nodes.forEach(node => this.editor.vDocument.insert(node));
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Get the format for the next insertion.
     */
    _getCurrentFormat(): FormatType {
        const range = this.editor.vDocument.range;
        let format: FormatType = {};
        if (this.editor.vDocument.formatCache) {
            return this.editor.vDocument.formatCache;
        } else if (range.isCollapsed()) {
            const charToCopyFormat = (range.start.previousSibling(CharNode) ||
                range.start.nextSibling(CharNode) || {
                    format: {},
                }) as CharNode;
            format = { ...charToCopyFormat.format };
        } else {
            const selectedChars = range.selectedNodes(CharNode);
            FORMAT_TYPES.forEach(formatName => {
                format[formatName] = selectedChars.some(char => char.format[formatName]);
            });
        }
        return format;
    }
}
