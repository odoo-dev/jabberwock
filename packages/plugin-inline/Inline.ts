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
        'query.isAllFormat': {
            handler: this.isAllFormat.bind(this),
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
        const range = params.range || this.editor.vDocument.selection.range;
        const FormatClass = params.FormatClass;

        if (range.isCollapsed()) return;

        const selectedInlines = range.selectedNodes(InlineNode);

        // If every char in the range has the format `FormatClass`, remove
        // the format for all of them.
        if (this._isAllFormat(FormatClass, range)) {
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
    isAllFormat(params: FormatParams): boolean {
        const range = params.range || this.editor.vDocument.selection.range;
        return this._isAllFormat(params.FormatClass, range);
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _isAllFormat(
        FormatClass: Constructor<Format>,
        range = this.editor.vDocument.selection.range,
    ): boolean {
        return range.selectedNodes(InlineNode).every(inline => {
            return !!inline.formats.find(format => format instanceof FormatClass);
        });
    }
}
