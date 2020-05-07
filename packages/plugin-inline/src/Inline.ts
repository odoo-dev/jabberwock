import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { Format } from './Format';
import { Modifier } from '../../core/src/Modifier';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { InlineNode } from './InlineNode';
import { Constructor } from '../../utils/src/utils';
import { VNode } from '../../core/src/VNodes/VNode';
import { Modifiers } from '../../core/src/Modifiers';
import { getStyles } from '../../utils/src/utils';

export interface FormatParams extends CommandParams {
    FormatClass: Constructor<Format>;
}
interface InlineCache {
    modifiers: Modifiers | null;
    style: Record<string, string> | null;
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
     * When applying a modifier on a collapsed range, cache the calculation of
     * the modifier in the following property. This value is reset each time the
     * range changes in a document.
     */
    cache: InlineCache = {
        modifiers: null,
        style: null,
    };

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
            if (!this.cache.modifiers) {
                this.cache.modifiers = this.getCurrentModifiers(range);
            }
            const index = this.cache.modifiers.findIndex(f => f instanceof FormatClass);
            if (index !== -1) {
                this.cache.modifiers.splice(index, 1);
            } else {
                this.cache.modifiers.push(new FormatClass());
            }
        } else {
            const selectedInlines = range.selectedNodes(InlineNode);

            // If every char in the range has the format `FormatClass`, remove
            // the format for all of them.
            const allHaveFormat = selectedInlines.every(inline => {
                return !!inline.modifiers.find(f => f instanceof FormatClass);
            });
            if (allHaveFormat) {
                for (const inline of selectedInlines) {
                    const index = inline.modifiers.findIndex(f => f instanceof FormatClass);
                    // Apply the attributes of the format we're about to remove to
                    // the inline itself.
                    const matchingFormat = inline.modifiers[index] as Format;
                    const attributes = inline.modifiers.get(Attributes);
                    const matchingFormatAttributes = matchingFormat.modifiers.get(Attributes);
                    if (attributes && matchingFormatAttributes) {
                        for (const key of matchingFormatAttributes.keys()) {
                            attributes.set(key, matchingFormatAttributes.get(key));
                        }
                    } else if (matchingFormatAttributes) {
                        inline.modifiers.append(matchingFormatAttributes.clone());
                    }
                    // Remove the format.
                    inline.modifiers.splice(index, 1);
                }
            } else {
                // If there is at least one char in the range without the format
                // `FormatClass`, set the format for all nodes.
                for (const inline of selectedInlines) {
                    if (!inline.modifiers.find(f => f instanceof FormatClass)) {
                        new FormatClass().applyTo(inline);
                    }
                }
            }
        }
    }
    isAllFormat(FormatClass: Constructor<Modifier>, range = this.editor.selection.range): boolean {
        if (range.isCollapsed()) {
            if (!this.cache.modifiers) {
                this.cache.modifiers = this.getCurrentModifiers(range);
            }
            return !!this.cache.modifiers.find(format => format instanceof FormatClass);
        } else {
            const selectedInlines = range.selectedNodes(InlineNode);
            return (
                selectedInlines.length &&
                selectedInlines.every(
                    char => !!char.modifiers.find(format => format instanceof FormatClass),
                )
            );
        }
    }
    /**
     * Get the modifiers for the next insertion.
     */
    getCurrentModifiers(range = this.editor.selection.range): Modifiers {
        if (this.cache.modifiers) {
            return this.cache.modifiers;
        }

        let inlineToCopyModifiers: VNode;
        if (range.isCollapsed()) {
            inlineToCopyModifiers = range.start.previousSibling() || range.start.nextSibling();
        } else {
            inlineToCopyModifiers = range.start.nextSibling();
        }
        if (inlineToCopyModifiers && inlineToCopyModifiers.is(InlineNode)) {
            return inlineToCopyModifiers.modifiers.clone();
        }

        return new Modifiers();
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
            modifiers: null,
            style: null,
        };
    }
}
