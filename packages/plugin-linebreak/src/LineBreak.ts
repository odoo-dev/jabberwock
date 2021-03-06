import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { LineBreakNode } from './LineBreakNode';
import { LineBreakXmlDomParser } from './LineBreakXmlDomParser';
import { LineBreakDomObjectRenderer } from './LineBreakDomObjectRenderer';
import { Core } from '../../core/src/Core';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { CommandParams } from '../../core/src/Dispatcher';
import { AbstractNodeParams } from '../../core/src/VNodes/AbstractNode';

export class LineBreak<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [LineBreakXmlDomParser],
        renderers: [LineBreakDomObjectRenderer],
    };
    commands = {
        insertLineBreak: {
            handler: this.insertLineBreak,
        },
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a line break node at range.
     */
    async insertLineBreak(params: CommandParams): Promise<void> {
        const modifiers = params.context.range.modifiers
        const nodeParams: AbstractNodeParams = {}
        if (modifiers?.length) {
            nodeParams.modifiers = modifiers.clone();
        }
        await params.context.execCommand<Core>('insert', {
            node: new LineBreakNode(nodeParams),
        });
    }
}
