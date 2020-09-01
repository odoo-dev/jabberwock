import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { BoldFormat } from './BoldFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { BoldXmlDomParser } from './BoldXmlDomParser';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { isInTextualContext } from '../../utils/src/utils';

export class Bold<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Keymap & Layout> = {
        parsers: [BoldXmlDomParser],
        shortcuts: [
            {
                pattern: 'CTRL+B',
                commandId: 'toggleFormat',
                commandArgs: { FormatClass: BoldFormat } as FormatParams,
            },
        ],
        components: [
            {
                id: 'BoldButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'bold',
                        label: 'Toggle bold',
                        commandId: 'toggleFormat',
                        commandArgs: { FormatClass: BoldFormat } as FormatParams,
                        visible: isInTextualContext,
                        selected: (editor: JWEditor): boolean => {
                            const range = editor.selection.range;
                            if (range.isCollapsed()) {
                                return !!range.modifiers?.find(BoldFormat);
                            } else {
                                const startIsFormated = !!range.start
                                    .nextSibling(InlineNode)
                                    ?.modifiers.find(BoldFormat);
                                if (!startIsFormated || range.isCollapsed()) {
                                    return startIsFormated;
                                } else {
                                    return !!range.end
                                        .previousSibling(InlineNode)
                                        ?.modifiers.find(BoldFormat);
                                }
                            }
                        },
                        modifiers: [new Attributes({ class: 'fa fa-bold fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['BoldButton', ['actionables']]],
    };
}
