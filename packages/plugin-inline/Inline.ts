import { JWPlugin } from '../core/src/JWPlugin';
import { RangeParams } from '../core/src/CorePlugin';
import { Format } from './Format';
import { InlineNode } from './InlineNode';

export interface FormatParams extends RangeParams {
    format: Format;
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
        const format = params.format;
        const range = this.editor.vDocument.selection.range;
        if (range.isCollapsed()) {
            if (!this.formatCache) {
                this.formatCache = this.getCurrentFormats();
            }
            const index = this.formatCache.findIndex(f => f.name === format.name);
            if (index !== -1) {
                this.formatCache.splice(index, 1);
            } else {
                this.formatCache.push(format.shallowDuplicate());
            }
        } else {
            const selectedInlines = range.selectedNodes(InlineNode);

            // If every char in the range has the format `format.name`, remove
            // the format for all of them.
            const allHaveFormat = selectedInlines.every(inline => {
                return !!inline.formats.find(f => f.name === format.name);
            });
            if (allHaveFormat) {
                selectedInlines.forEach(inline => {
                    const index = inline.formats.findIndex(f => f.name === format.name);
                    const matchingFormat = inline.formats[index];
                    if (matchingFormat.attributes && matchingFormat.attributes.size) {
                        matchingFormat.attributes.forEach((value: string, key: string) => {
                            if (!inline.attributes) {
                                inline.attributes = new Map<string, string>();
                            }
                            inline.attributes.set(key, value);
                        });
                    }
                    inline.formats.splice(index, 1);
                });
                // If there is at least one char in the range without the format
                // `format.name`, set the format for all nodes.
            } else {
                selectedInlines.forEach(inline => {
                    if (!inline.formats.find(f => f.isSameAs(format))) {
                        inline.formats.push(format.shallowDuplicate());
                    }
                });
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
