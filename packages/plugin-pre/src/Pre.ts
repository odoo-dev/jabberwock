import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { PreXmlDomParser } from './PreXmlDomParser';
import { PreHtmlDomRenderer } from './PreHtmlDomRenderer';
import { CommandParams } from '../../core/src/Dispatcher';
import { PreNode } from './PreNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { PreCharHtmlDomRenderer } from './PreCharHtmlDomRenderer';
import { PreSeparatorHtmlDomRenderer } from './PreSeparatorHtmlDomRenderer';

export class Pre<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    commands = {
        applyPreStyle: {
            handler: this.applyPreStyle,
        },
    };
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [PreXmlDomParser],
        renderers: [PreHtmlDomRenderer, PreSeparatorHtmlDomRenderer, PreCharHtmlDomRenderer],
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
            pre.attributes = { ...node.attributes };
            node.before(pre);
            node.mergeWith(pre);
        }
    }
}
