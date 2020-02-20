import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { CharNode } from './CharNode';
import { CommandParams } from '../core/src/Dispatcher';
import { FormatParams, Inline } from '../plugin-inline/Inline';
import { CharFormatDomRenderer } from './CharFormatDomRenderer';
import { CharDomRenderer } from './CharDomRenderer';
import { CharDomParser } from './CharDomParser';
import { InlineNode } from '../plugin-inline/InlineNode';
import { VNode } from '../core/src/VNodes/VNode';
import { Formats } from '../plugin-inline/Formats';

export interface InsertTextParams extends CommandParams {
    text: string;
}

export class Char<T extends JWPluginConfig> extends JWPlugin<T> {
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
    formatCache: Formats = null;

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
        const range = params.context.range;
        const text = params.text;
        const formats = this.getCurrentFormats();
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            range.empty();
        }
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('');
        characters.forEach(char => {
            const vNode = new CharNode(char, formats.clone());
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
        const range = params.context.range;
        const FormatClass = params.FormatClass;

        if (!range.isCollapsed()) return;

        if (!this.formatCache) {
            this.formatCache = this.getCurrentFormats();
        }
        this.formatCache.toggle(FormatClass);
    }
    /**
     * Get the format for the next insertion.
     */
    getCurrentFormats(range = this.editor.selection.range): Formats {
        if (this.formatCache) {
            return this.formatCache;
        }

        let inlineToCopyFormat: VNode;
        if (range.isCollapsed()) {
            inlineToCopyFormat = range.start.previousSibling() || range.start.nextSibling();
        } else {
            inlineToCopyFormat = range.start.nextSibling();
        }
        if (inlineToCopyFormat && inlineToCopyFormat.is(InlineNode)) {
            return inlineToCopyFormat.formats.clone();
        }

        return new Formats();
    }
    /**
     * Each time the selection changes, we reset its format.
     */
    resetFormatCache(): void {
        this.formatCache = null;
    }
}
