import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { PreDomParser } from './PreDomParser';
import { PreDomRenderer } from './PreDomRenderer';
import { CommandParams } from '../../core/src/Dispatcher';
import { VNode, isLeaf } from '../../core/src/VNodes/VNode';
import { distinct } from '../../utils/src/utils';
import { PreNode } from './PreNode';

export class Pre<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    commands = {
        applyPreStyle: {
            handler: this.applyPreStyle,
        },
    };
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [PreDomParser],
        renderers: [PreDomRenderer],
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
        const range = params.context.range;
        let nodesToConvert: VNode[];
        if (range.isCollapsed()) {
            nodesToConvert = [range.start.parent];
        } else {
            const selectedLeaves = range.selectedNodes(isLeaf);
            nodesToConvert = distinct(
                selectedLeaves.map(leaf => (leaf.atomic ? leaf.parent : leaf)),
            );
        }
        for (const node of nodesToConvert) {
            const pre = new PreNode();
            pre.attributes = { ...node.attributes };
            node.before(pre);
            node.mergeWith(pre);
        }
    }
}
