import { JWPlugin } from '../core/src/JWPlugin';
import { CharNode } from './CharNode';
import { RangeParams } from '../core/src/CorePlugin';
import { Inline } from '../plugin-inline/Inline';
import { CharFormatDomRenderer } from './CharFormatDomRenderer';
import { CharDomRenderer } from './CharDomRenderer';
import { CharDomParser } from './CharDomParser';

export interface InsertTextParams extends RangeParams {
    text: string;
}

export class Char extends JWPlugin {
    readonly parsers = [CharDomParser];
    readonly renderers = [CharFormatDomRenderer, CharDomRenderer];
    commands = {
        insertText: {
            handler: this.insertText.bind(this),
        },
    };

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
        const inlinePlugin = this.editor.plugins.find(plugin => plugin instanceof Inline) as Inline; // todo: some form of hook...
        let formats = [];
        if (inlinePlugin) {
            formats = inlinePlugin.getCurrentFormats();
        }
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
        if (inlinePlugin) {
            inlinePlugin.resetFormatCache();
        }
    }
}
