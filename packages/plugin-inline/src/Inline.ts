import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { Format } from './Format';
import { InlineNode } from './InlineNode';
import { Constructor } from '../../utils/src/utils';
import { VNode } from '../../core/src/VNodes/VNode';
import { Formats } from './Formats';
import { getStyles } from '../../utils/src/utils';

export interface FormatParams extends CommandParams {
    FormatClass: Constructor<Format>;
}
interface InlineCache {
    format: Formats | null,
    style: Record<string, string> | null,
}

export class Inline<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    commands = {
        toggleFormat: {
            handler: this.toggleFormat,
        },
    };
    commandHooks = {
        setSelection: this.resetCache,
    };
    /**
     * When applying a format or a style on a collapsed range, cache the
     * calculation of the format or style in the following property. This value
     * is reset each time the range changes in a document.
     */
    cache: InlineCache = {
        format: null,
        style: null,
    }

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
            if (!this.cache.format) {
                this.cache.format = this.getCurrentFormats(range);
            }
            const index = this.cache.format.findIndex(f => f instanceof FormatClass);
            if (index !== -1) {
                this.cache.format.splice(index, 1);
            } else {
                this.cache.format.push(new FormatClass());
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
            if (!this.cache.format) {
                this.cache.format = this.getCurrentFormats(range);
            }
            return !!this.cache.format.find(format => format instanceof FormatClass);
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
        if (this.cache.format) {
            return this.cache.format;
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
     * Get the styles for the next insertion.
     */
    getCurrentStyles(range = this.editor.selection.range): Record<string, string> {
        if (this.cache.style) {
            return this.cache.style;
        }

        let inlineToCopyStyles: VNode;
        if (range.isCollapsed()) {
            inlineToCopyStyles = range.start.previousSibling() || range.start.nextSibling();
        } else {
            inlineToCopyStyles = range.start.nextSibling();
        }
        if (inlineToCopyStyles && inlineToCopyStyles.is(InlineNode)) {
            return getStyles(inlineToCopyStyles);
        }

        return {};
    }
    /**
     * Each time the selection changes, we reset its format and style.
     */
    resetCache(): void {
        this.cache = {
            format: null,
            style: null,
        };
    }
}
