import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { UnderlineFormat } from './UnderlineFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { UnderlineXmlDomParser } from './UnderlineXmlDomParser';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { isInTextualContext } from '../../utils/src/utils';

export class Underline<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Keymap & Layout> = {
        parsers: [UnderlineXmlDomParser],
        shortcuts: [
            {
                pattern: 'CTRL+U',
                commandId: 'toggleFormat',
                commandArgs: { FormatClass: UnderlineFormat } as FormatParams,
            },
        ],
        components: [
            {
                id: 'UnderlineButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'underline',
                        label: 'Toggle underline',
                        commandId: 'toggleFormat',
                        commandArgs: { FormatClass: UnderlineFormat } as FormatParams,
                        visible: isInTextualContext,
                        selected: (editor: JWEditor): boolean => {
                            const range = editor.selection.range;
                            if (range.isCollapsed()) {
                                const pluginInline = editor.plugins.get(Inline);
                                return !!pluginInline
                                    .getCurrentModifiers(range)
                                    ?.find(UnderlineFormat);
                            } else {
                                const startIsFormated = !!range.start
                                    .nextSibling(InlineNode)
                                    ?.modifiers.find(UnderlineFormat);
                                if (!startIsFormated || range.isCollapsed()) {
                                    return startIsFormated;
                                } else {
                                    return !!range.end
                                        .previousSibling(InlineNode)
                                        ?.modifiers.find(UnderlineFormat);
                                }
                            }
                        },
                        modifiers: [new Attributes({ class: 'fa fa-underline fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['UnderlineButton', ['actionables']]],
    };
}
