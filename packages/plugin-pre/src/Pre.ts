import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { PreXmlDomParser } from './PreXmlDomParser';
import { PreDomObjectRenderer } from './PreDomObjectRenderer';
import { CommandParams } from '../../core/src/Dispatcher';
import { PreNode } from './PreNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { PreCharDomObjectRenderer } from './PreCharDomObjectRenderer';
import { PreSeparatorDomObjectRenderer } from './PreSeparatorDomObjectRenderer';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export class Pre<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    commands = {
        applyPreStyle: {
            handler: this.applyPreStyle,
        },
    };
    readonly loadables: Loadables<Parser & Renderer & Layout> = {
        parsers: [PreXmlDomParser],
        renderers: [PreDomObjectRenderer, PreSeparatorDomObjectRenderer, PreCharDomObjectRenderer],
        components: [
            {
                id: 'PreButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'pre',
                        label: 'Pre',
                        commandId: 'applyPreStyle',
                        selected: (editor: JWEditor): boolean => {
                            const nodes = editor.selection.range.targetedNodes();
                            return (
                                nodes.length &&
                                nodes.every(node => {
                                    return node.closest(PreNode);
                                })
                            );
                        },
                        modifiers: [new Attributes({ class: 'pre' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['PreButton', 'actionables']],
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Change the formatting of the nodes in given range to Pre.
     *
     * @param params
     */
    applyPreStyle(params: CommandParams): void {
        for (const node of params.context.range.targetedNodes(ContainerNode)) {
            const pre = new PreNode();
            pre.modifiers = node.modifiers.clone();
            node.replaceWith(pre);
        }
    }
}
