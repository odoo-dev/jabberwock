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
}
