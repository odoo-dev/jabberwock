import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { ItalicFormat } from './ItalicFormat';
import { FormatParams, Inline } from '../../plugin-inline/src/Inline';
import { ItalicXmlDomParser } from './ItalicXmlDomParser';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-toolbar/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class Italic<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Keymap & Layout> = {
        parsers: [ItalicXmlDomParser],
        shortcuts: [
            {
                pattern: 'CTRL+I',
                commandId: 'toggleFormat',
                commandArgs: { FormatClass: ItalicFormat } as FormatParams,
            },
        ],
        components: [
            {
                id: 'ItalicButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'italic',
                        label: 'Toggle italic',
                        commandId: 'toggleFormat',
                        commandArgs: { FormatClass: ItalicFormat } as FormatParams,
                        selected: (editor: JWEditor): boolean =>
                            editor.plugins.get(Inline).isAllFormat(ItalicFormat),
                        modifiers: [new Attributes({ class: 'fas fa-italic fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['ItalicButton', 'actionables']],
    };
}
