import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { VNode } from '../../core/src/VNodes/VNode';

export enum AlignType {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
    JUSTIFY = 'justify',
}
export type AlignParams = CommandParams & {
    type: AlignType;
};

export class Align<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [];
    editor: JWEditor;
    commands = {
        align: {
            handler: this.align.bind(this),
        },
    };
    loadables: Loadables<Keymap> = {
        shortcuts: [
            {
                pattern: 'Ctrl+Shift+L',
                commandId: 'align',
                commandArgs: { type: AlignType.LEFT },
            },
            {
                pattern: 'Ctrl+Shift+E',
                commandId: 'align',
                commandArgs: { type: AlignType.CENTER },
            },
            {
                pattern: 'Ctrl+Shift+R',
                commandId: 'align',
                commandArgs: { type: AlignType.RIGHT },
            },
            {
                pattern: 'Ctrl+Shift+J',
                commandId: 'align',
                commandArgs: { type: AlignType.JUSTIFY },
            },
        ],
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the given node has the given alignment style. If no type
     * is passed, return true if the given node has an alignment style at all.
     *
     * @param node
     * @param [type]
     */
    static isAligned(node: VNode, type?: AlignType): boolean {
        if (typeof node.attributes.style !== 'string') {
            return false;
        } else {
            const styles = node.attributes.style.split(';');
            const align = styles.find(style => style.includes('text-align'));
            return type ? align?.includes(type) : !!align;
        }
    }
    /**
     * Align text.
     */
    align(params: AlignParams): void {
        const nodes = params.context.range.targetedNodes(node => !node.atomic);
        const type = params.type;
        for (const node of nodes) {
            const alignedAncestor = node.ancestor(Align.isAligned);

            // Compute current alignment.
            let currentAlignment: string;
            if (typeof alignedAncestor?.attributes.style === 'string') {
                const styles = alignedAncestor.attributes.style.split(';');
                const alignment = styles.find(style => style.includes('text-align'));
                currentAlignment = alignment?.replace(/text-align\s*:|;/, '').trim();
            }

            if (!alignedAncestor || currentAlignment !== type) {
                const textAlign = 'text-align: ' + type.toLowerCase();
                if (Align.isAligned(node)) {
                    // Replace the existing alignment.
                    const styles = (node.attributes.style as string).split(/;\s*/);
                    const alignIndex = styles.findIndex(style => style.startsWith('text-align'));
                    styles[alignIndex] = textAlign;
                    node.attributes.style = styles.join('; ');
                } else if (typeof node.attributes.style === 'string') {
                    // Add an alignment to the existing styles.
                    node.attributes.style = [textAlign, node.attributes.style].join('; ');
                } else {
                    // Create a new style attribute, with an alignment.
                    node.attributes.style = textAlign;
                }
                // Remove unnecessary space from the style attribute.
                node.attributes.style = (node.attributes.style as string).trim();
                if (!node.attributes.style.endsWith(';')) {
                    // Ensure the style attribute ends with a semicolon.
                    node.attributes.style += ';';
                }
            }
        }
    }
}
