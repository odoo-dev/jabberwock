import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { BlockquoteXmlDomParser } from './BlockquoteXmlDomParser';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { isInTextualContext } from '../../utils/src/utils';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Layout } from '../../plugin-layout/src/Layout';
import { CommandParams } from '../../core/src/Dispatcher';
import { HeadingNode } from '../../plugin-heading/src/HeadingNode';
import { ParagraphNode } from '../../plugin-paragraph/src/ParagraphNode';
import { PreNode } from '../../plugin-pre/src/PreNode';
import { BlockquoteNode } from './BlockquoteNode';
import { VRange } from '../../core/src/VRange';
import { InsertParagraphBreakParams } from '../../core/src/Core';

export function isInBlockquote(range: VRange): boolean {
    const startBlockquote = !!range.start.closest(BlockquoteNode);
    if (!startBlockquote || range.isCollapsed()) {
        return startBlockquote;
    } else {
        return !!range.end.closest(BlockquoteNode);
    }
}

export class Blockquote<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    commands = {
        applyBlockquoteStyle: {
            handler: this.applyBlockquoteStyle,
        },
        insertParagraphBreak: {
            selector: [BlockquoteNode],
            handler: this.insertParagraphBreak,
        },
    };
    readonly loadables: Loadables<Parser & Layout> = {
        parsers: [BlockquoteXmlDomParser],
        components: [
            {
                id: 'BlockquoteButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'blockquote',
                        label: 'Blockquote',
                        commandId: 'applyBlockquoteStyle',
                        visible: isInTextualContext,
                        selected: (editor: JWEditor): boolean => {
                            return isInBlockquote(editor.selection.range);
                        },
                        modifiers: [new Attributes({ class: 'blockquote' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['BlockquoteButton', ['actionables']]],
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Change the formatting of the nodes in given range to Blockquote.
     *
     * @param params
     */
    applyBlockquoteStyle(params: CommandParams): void {
        for (const node of params.context.range.targetedNodes(
            node =>
                node instanceof HeadingNode ||
                node instanceof ParagraphNode ||
                node instanceof PreNode,
        )) {
            const blockquote = new BlockquoteNode();
            blockquote.modifiers = node.modifiers.clone();
            node.replaceWith(blockquote);
        }
    }
    /**
     * Insert a new paragraph after the blockquote, or a line break within it.
     *
     * @param params
     */
    async insertParagraphBreak(params: InsertParagraphBreakParams): Promise<void> {
        const range = params.context.range;
        if (!range.isCollapsed()) {
            range.empty();
        }
        if (range.end.nextSibling()) {
            // Insert paragraph break within a blockquote inserts a line break
            // instead.
            await params.context.execCommand('insertLineBreak');
        } else {
            // Insert paragraph break at the end of a blockquote inserts a new
            // paragraph after it.
            const blockquote = range.targetedNodes(BlockquoteNode)[0];
            const duplicate = blockquote.splitAt(range.start);
            const DefaultContainer = this.editor.configuration.defaults.Container;
            const newContainer = new DefaultContainer();
            duplicate.replaceWith(newContainer);
        }
    }
}
