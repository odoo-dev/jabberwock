import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CharNode } from './CharNode';
import { CommandParams } from '../../core/src/Dispatcher';
import { Inline } from '../../plugin-inline/src/Inline';
import { CharDomObjectRenderer } from './CharDomObjectRenderer';
import { CharXmlDomParser } from './CharXmlDomParser';
import { Modifiers } from '../../core/src/Modifiers';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Attributes } from '../../plugin-xml/src/Attributes';

import { Point, RelativePosition, VNode } from '../../core/src/VNodes/VNode';

export interface InsertTextParams extends CommandParams {
    text: string;
    select?: boolean;
    formats?: Modifiers;
}
export interface InsertHtmlParams extends CommandParams {
    rangePoint?: Point;
    html: string;
}

export class Char<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [CharXmlDomParser],
        renderers: [CharDomObjectRenderer],
    };
    commands = {
        insertText: {
            handler: this.insertText,
        },
        insertHtml: {
            handler: this.insertHtml,
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
        const modifiers = inline.getCurrentModifiers(range);
        if (params.formats) {
            modifiers.set(...params.formats.map(format => format.clone()));
        }
        const style = inline.getCurrentStyle(range);
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            range.empty();
        }
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('');
        const charNodes = characters.map(char => {
            return new CharNode({ char: char, modifiers: modifiers.clone() });
        });
        charNodes.forEach(charNode => {
            charNode.modifiers.get(Attributes).style = style;
            range.start.before(charNode);
        });
        if (params.select && charNodes.length) {
            this.editor.selection.select(charNodes[0], charNodes[charNodes.length - 1]);
        }
        inline.resetCache();
    }
    async insertHtml(params: InsertHtmlParams): Promise<VNode[]> {
        const parser = this.editor.plugins.get(Parser);
        const domParser = parser && parser.engines['dom/html'];
        if (!domParser) {
            // TODO: remove this when the editor can be instantiated on
            // something else than DOM.
            throw new Error(`No DOM parser installed.`);
        }
        const div = document.createElement('div');
        div.innerHTML = params.html;
        const parsedEditable = await domParser.parse(div);
        const newNodes = parsedEditable[0].children();

        // Remove the contents of the range if needed.
        // todo: use Point or Range but not both.
        const range = params.context.range;
        if (!range.isCollapsed()) {
            range.empty();
        }
        if (params.rangePoint) {
            const [node, position] = params.rangePoint;
            switch (position) {
                case RelativePosition.BEFORE:
                    newNodes.forEach(node.before.bind(node));
                    break;
                case RelativePosition.AFTER:
                    [...newNodes].reverse().forEach(node.after.bind(node));
                    break;
                case RelativePosition.INSIDE:
                    node.append(...newNodes);
                    break;
            }
        } else {
            newNodes.forEach(range.start.before.bind(range.start));
        }
        return newNodes;
    }
}
