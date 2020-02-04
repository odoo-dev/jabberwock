import { JWPlugin } from '../core/src/JWPlugin';
import { CharNode } from './CharNode';
import { RangeParams } from '../core/src/CorePlugin';
import { FormatParams, Inline } from '../plugin-inline/Inline';
import { CharFormatDomRenderer } from './CharFormatDomRenderer';
import { CharDomRenderer } from './CharDomRenderer';
import { CharDomParser } from './CharDomParser';
import { Format } from '../plugin-inline/Format';
import { InlineNode } from '../plugin-inline/InlineNode';
import { VNode } from '../core/src/VNodes/VNode';
import JWEditor from '../core/src/JWEditor';
import { Constructor } from '../utils/src/utils';

export interface InsertTextParams extends RangeParams {
    text: string;
}

export class Char extends JWPlugin {
    static dependencies = [Inline];
    readonly parsers = [CharDomParser];
    readonly renderers = [CharFormatDomRenderer, CharDomRenderer];
    commands = {
        insertText: {
            handler: this.insertText.bind(this),
        },
    };
    commandHooks = {
        toggleFormat: this.toggleFormat.bind(this),
        setSelection: this.resetFormatCache.bind(this),
    };
    /**
     * When apply format on a collapsed range, cache the calculation of the
     * format the following property. This value is reset each time the range
     * change in a document.
     */
    formatCache: Format[] = null;

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
     * @param params
     */
    insertText(params: InsertTextParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const text = params.text;
        const formats = Char.getCurrentFormats(this.editor);
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            range.empty();
        }
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('');
        characters.forEach(char => {
            const vNode = new CharNode(char, formats);
            range.start.before(vNode);
        });
        this.resetFormatCache();
    }
    /**
     * If the range is collapsed, set the format on the range so we know
     * in the next insert which format should be used.
     *
     * @param params
     */
    toggleFormat(params: FormatParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const FormatClass = params.FormatClass;

        if (!range.isCollapsed()) return;

        if (!this.formatCache) {
            this.formatCache = Char.getCurrentFormats(this.editor);
        }
        const index = this.formatCache.findIndex(f => f instanceof FormatClass);
        if (index !== -1) {
            this.formatCache.splice(index, 1);
        } else {
            this.formatCache.push(new FormatClass());
        }
    }
    static isAllFormat(editor: JWEditor, FormatClass: Constructor<Format>): boolean {
        const range = editor.vDocument.selection.range;
        const charPlugin = editor.plugins.find(plugin => plugin instanceof Char) as Char;
        if (range.isCollapsed()) {
            if (!charPlugin.formatCache) {
                charPlugin.formatCache = Char.getCurrentFormats(editor);
            }
            return !!charPlugin.formatCache.find(format => format instanceof FormatClass);
        } else {
            const selectedChars = range.selectedNodes(CharNode);
            return (
                selectedChars.length &&
                selectedChars.every(
                    char => !!char.formats.find(format => format instanceof FormatClass),
                )
            );
        }
    }
    /**
     * Get the format for the next insertion.
     */
    static getCurrentFormats(editor: JWEditor): Format[] {
        const range = editor.vDocument.selection.range;
        const charPlugin = editor.plugins.find(plugin => plugin instanceof Char) as Char;
        if (charPlugin.formatCache) {
            return charPlugin.formatCache;
        }

        let inlineToCopyFormat: VNode;
        if (range.isCollapsed()) {
            inlineToCopyFormat = range.start.previousSibling() || range.start.nextSibling();
        } else {
            inlineToCopyFormat = range.start.nextSibling();
        }
        if (inlineToCopyFormat && inlineToCopyFormat.is(InlineNode)) {
            return [...inlineToCopyFormat.formats];
        }

        return [];
    }
    /**
     * Each time the selection changes, we reset its format.
     */
    resetFormatCache(): void {
        this.formatCache = null;
    }
}
