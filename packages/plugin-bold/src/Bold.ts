import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { BoldFormat } from './BoldFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { BoldXmlDomParser } from './BoldXmlDomParser';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-toolbar/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

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
                        selected: (editor: JWEditor): boolean =>
                            editor.plugins.get(Inline).isAllFormat(BoldFormat),
                        modifiers: [new Attributes({ class: 'fa fa-bold fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['BoldButton', 'actionables']],
    };
}
