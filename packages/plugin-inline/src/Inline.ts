import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { Format } from './Format';
import { InlineNode } from './InlineNode';
import { Constructor } from '../../utils/src/utils';
import { VNode } from '../../core/src/VNodes/VNode';
import { Formats } from './Formats';

export interface FormatParams extends CommandParams {
    FormatClass: Constructor<Format>;
}

export class Inline<T extends JWPluginConfig> extends JWPlugin<T> {
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
    formatCache: Formats = null;

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Apply the `format` to the range.
     *
     * @param params
     */
    toggleFormat(params: FormatParams): void {
        const range = params.context.range;
        const FormatClass = params.FormatClass;

        if (range.isCollapsed()) {
            if (!this.formatCache) {
                this.formatCache = this.getCurrentFormats(range);
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
                    // Apply the attributes of the format we're about to remove to
                    // the inline itself.
                    const matchingFormat = inline.formats[index];
                    for (const key of Object.keys(matchingFormat.attributes)) {
                        inline.attributes[key] = matchingFormat.attributes[key];
                    }
                    // Remove the format.
                    inline.formats.splice(index, 1);
                }
            } else {
                // If there is at least one char in the range without the format
                // `FormatClass`, set the format for all nodes.
                for (const inline of selectedInlines) {
                    if (!inline.formats.find(f => f instanceof FormatClass)) {
                        new FormatClass().applyTo(inline);
                    }
                }
            }
        }
    }
    isAllFormat(FormatClass: Constructor<Format>, range = this.editor.selection.range): boolean {
        if (range.isCollapsed()) {
            if (!this.formatCache) {
                this.formatCache = this.getCurrentFormats(range);
            }
            return !!this.formatCache.find(format => format instanceof FormatClass);
        } else {
            const selectedInlines = range.selectedNodes(InlineNode);
            return (
                selectedInlines.length &&
                selectedInlines.every(
                    char => !!char.formats.find(format => format instanceof FormatClass),
                )
            );
        }
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
