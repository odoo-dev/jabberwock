import { JWPlugin, JWPluginConfig } from '../core/src/JWPlugin';
import { CommandParams } from '../core/src/Dispatcher';
import { Format } from './Format';
import { InlineNode } from './InlineNode';
import { Constructor } from '../utils/src/utils';

export interface FormatParams extends CommandParams {
    FormatClass: Constructor<Format>;
}

export class Inline<T extends JWPluginConfig> extends JWPlugin<T> {
    commands = {
        toggleFormat: {
            handler: this.toggleFormat.bind(this),
        },
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

        if (range.isCollapsed()) return;

        const selectedInlines = range.selectedNodes(InlineNode);

        // If every char in the range has the format `FormatClass`, remove
        // the format for all of them.
        const allHaveFormat = selectedInlines.every(inline => {
            return !!inline.formats.get(FormatClass);
        });
        if (allHaveFormat) {
            for (const inline of selectedInlines) {
                // Apply the attributes of the format we're about to remove to
                // the inline itself.
                const matchingFormat = inline.formats.get(FormatClass);
                for (const key of Object.keys(matchingFormat.attributes)) {
                    inline.attributes[key] = matchingFormat.attributes[key];
                }
                // Remove the format.
                inline.formats.remove(matchingFormat);
            }
        } else {
            // If there is at least one char in the range without the format
            // `FormatClass`, set the format for all nodes.
            for (const inline of selectedInlines) {
                if (!inline.formats.get(FormatClass)) {
                    new FormatClass().applyTo(inline);
                }
            }
        }
    }
}
