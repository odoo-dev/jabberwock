import { JWPlugin } from '../core/src/JWPlugin';
import { RangeParams } from '../core/src/CorePlugin';
import { Format } from './Format';
import { InlineNode } from './InlineNode';
import { Constructor } from '../utils/src/utils';

export interface FormatParams extends RangeParams {
    FormatClass: Constructor<Format>;
}

export class Inline extends JWPlugin {
    commands = {
        toggleFormat: {
            handler: this.toggleFormat.bind(this),
        },
    };
    commandHooks = {
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
     * Apply the `format` to the selection.
     *
     * If the selection is collapsed, set the format on the selection so we know
     * in the next insert which format should be used.
     */
    toggleFormat(params: FormatParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const FormatClass = params.FormatClass;
        if (range.isCollapsed()) {
            if (!this.formatCache) {
                this.formatCache = this.getCurrentFormats();
            }
            const index = this.formatCache.findIndex(f => f instanceof FormatClass);
            if (index !== -1) {
                this.formatCache.splice(index, 1);
            } else {
                this.formatCache.push(new FormatClass());
            }
        } else {
            const selectedInlines = range.selectedNodes(InlineNode);

            // If every char in the range has the format `FormatClass`, remove
            // the format for all of them.
            const allHaveFormat = selectedInlines.every(inline => {
                return !!inline.formats.find(f => f instanceof FormatClass);
            });
            if (allHaveFormat) {
                for (const inline of selectedInlines) {
                    const index = inline.formats.findIndex(f => f instanceof FormatClass);
                    const matchingFormat = inline.formats[index];
                    for (const key of Object.keys(matchingFormat.attributes)) {
                        inline.attributes[key] = matchingFormat.attributes[key];
                    }
                    inline.formats.splice(index, 1);
                }
                // If there is at least one char in the range without the format
                // `FormatClass`, set the format for all nodes.
            } else {
                for (const inline of selectedInlines) {
                    if (!inline.formats.find(f => f instanceof FormatClass)) {
                        new FormatClass().applyTo(inline);
                    }
                }
            }
        }
    }
    /**
     * Get the format for the next insertion.
     */
    getCurrentFormats(range = this.editor.vDocument.selection.range): Format[] {
        let formats: Format[] = [];
        if (this.formatCache) {
            return this.formatCache;
        } else if (range.isCollapsed()) {
            const inlineToCopyFormat = range.start.previousSibling() || range.start.nextSibling();
            if (inlineToCopyFormat && inlineToCopyFormat.is(InlineNode)) {
                formats = [...inlineToCopyFormat.formats];
            }
        } else {
            const selectedInlines = range.selectedNodes(InlineNode);
            selectedInlines.forEach(inline => (formats = [...formats, ...inline.formats]));
        }
        return formats;
    }
    /**
     * Each time the selection changes, we reset its format.
     */
    resetFormatCache(): void {
        this.formatCache = null;
    }
}
