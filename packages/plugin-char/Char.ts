import { JWPlugin } from '../core/src/JWPlugin';
import { CharNode, FormatType, FORMAT_TYPES } from './CharNode';
import { RangeParams } from '../core/src/CorePlugin';
import { CharDomRenderer } from './CharDomRenderer';
import { CharDomParser } from './CharDomParser';

export interface InsertTextParams extends RangeParams {
    text: string;
}
export interface FormatParams extends RangeParams {
    format: 'bold' | 'italic' | 'underline';
}

export class Char extends JWPlugin {
    readonly parsers = [CharDomParser];
    readonly renderers = [CharDomRenderer];
    commands = {
        insertText: {
            handler: this.insertText.bind(this),
        },
        applyFormat: {
            handler: this.applyFormat.bind(this),
        },
    };
    shortcuts = [
        {
            pattern: 'CTRL+B',
            commandId: 'applyFormat',
            commandArgs: { format: 'bold' } as FormatParams,
        },
        {
            pattern: 'CTRL+I',
            commandId: 'applyFormat',
            commandArgs: { format: 'italic' } as FormatParams,
        },
        {
            pattern: 'CTRL+U',
            commandId: 'applyFormat',
            commandArgs: { format: 'underline' } as FormatParams,
        },
    ];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

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
        const format = this._getCurrentFormat();
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            range.empty();
        }
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('');
        characters.forEach(char => {
            const vNode = new CharNode(char, format);
            range.start.before(vNode);
        });
        this.editor.vDocument.formatCache = null;
    }
    /**
     * Apply the `format` to the selection.
     *
     * If the selection is collapsed, set the format on the selection so we know
     * in the next insert which format should be used.
     */
    applyFormat(params: FormatParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const formatName = params.format;
        if (range.isCollapsed()) {
            if (!this.editor.vDocument.formatCache) {
                this.editor.vDocument.formatCache = this._getCurrentFormat();
            }
            this.editor.vDocument.formatCache[formatName] = !this.editor.vDocument.formatCache[
                formatName
            ];
        } else {
            const selectedChars = range.selectedNodes(CharNode);

            // If there is no char with the format `formatName` in the
            // selection, set the format to true for all nodes.
            if (!selectedChars.every(char => char.format[formatName])) {
                selectedChars.forEach(char => {
                    char[formatName] = true;
                });
                // If there is at least one char in with the format `fomatName`
                // in the selection, set the format to false for all nodes.
            } else {
                selectedChars.forEach(char => {
                    char[formatName] = false;
                });
            }
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Get the format for the next insertion.
     */
    _getCurrentFormat(range = this.editor.vDocument.selection.range): FormatType {
        let format: FormatType = {};
        if (this.editor.vDocument.formatCache) {
            return this.editor.vDocument.formatCache;
        } else if (range.isCollapsed()) {
            const charToCopyFormat = range.start.previousSibling(CharNode) ||
                range.start.nextSibling(CharNode) || {
                    format: {},
                };
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
