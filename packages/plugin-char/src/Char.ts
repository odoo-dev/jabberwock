import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CharNode } from './CharNode';
import { CommandParams } from '../../core/src/Dispatcher';
import { Inline } from '../../plugin-inline/src/Inline';
import { CharFormatDomRenderer } from './CharFormatDomRenderer';
import { CharDomRenderer } from './CharDomRenderer';
import { CharDomParser } from './CharDomParser';
import { Formats } from '../../plugin-inline/src/Formats';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';

export interface InsertTextParams extends CommandParams {
    text: string;
    formats?: Formats;
}

export class Char<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [CharDomParser],
        renderers: [CharFormatDomRenderer, CharDomRenderer],
    };
    commands = {
        insertText: {
            handler: this.insertText,
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
        const range = params.context.range;
        const text = params.text;
        const inline = this.editor.plugins.get(Inline);
        const formats = inline.getCurrentFormats(range);
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
        inline.resetFormatCache();
    }
}
