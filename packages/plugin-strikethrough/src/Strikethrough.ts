import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { StrikethroughFormat } from './StrikethroughFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { StrikethroughXmlDomParser } from './StrikethroughXmlDomParser';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { isInTextualContext } from '../../utils/src/utils';

export class Strikethrough<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Keymap & Layout> = {
        parsers: [StrikethroughXmlDomParser],
        shortcuts: [
            {
                pattern: 'ALT+SHIFT+(',
                commandId: 'toggleFormat',
                commandArgs: { FormatClass: StrikethroughFormat } as FormatParams,
            },
        ],
        components: [
            {
                id: 'StrikethroughButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'strikethrough',
                        label: 'Toggle strikethrough',
                        commandId: 'toggleFormat',
                        commandArgs: { FormatClass: StrikethroughFormat } as FormatParams,
                        visible: isInTextualContext,
                        selected: (editor: JWEditor): boolean => {
                            const range = editor.selection.range;
                            if (range.isCollapsed()) {
                                return !!range.modifiers.find(StrikethroughFormat);
                            } else {
                                const startIsFormated = !!range.start
                                    .nextSibling(InlineNode)
                                    ?.modifiers.find(StrikethroughFormat);
                                if (!startIsFormated || range.isCollapsed()) {
                                    return startIsFormated;
                                } else {
                                    return !!range.end
                                        .previousSibling(InlineNode)
                                        ?.modifiers.find(StrikethroughFormat);
                                }
                            }
                        },
                        modifiers: [new Attributes({ class: 'fa fa-strikethrough fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['StrikethroughButton', ['actionables']]],
    };
}
