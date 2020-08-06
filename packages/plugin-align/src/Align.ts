import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { VNode } from '../../core/src/VNodes/VNode';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';

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
    loadables: Loadables<Keymap & Layout> = {
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
        components: [
            {
                id: 'AlignLeftButton',
                async render(): Promise<ActionableNode[]> {
                    return [alignButton(AlignType.LEFT)];
                },
            },
            {
                id: 'AlignCenterButton',
                async render(): Promise<ActionableNode[]> {
                    return [alignButton(AlignType.CENTER)];
                },
            },
            {
                id: 'AlignRightButton',
                async render(): Promise<ActionableNode[]> {
                    return [alignButton(AlignType.RIGHT)];
                },
            },
            {
                id: 'AlignJustifyButton',
                async render(): Promise<ActionableNode[]> {
                    return [alignButton(AlignType.JUSTIFY)];
                },
            },
        ],
        componentZones: [
            ['AlignLeftButton', ['actionables']],
            ['AlignCenterButton', ['actionables']],
            ['AlignRightButton', ['actionables']],
            ['AlignJustifyButton', ['actionables']],
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
        const align = node.modifiers.find(Attributes)?.style.get('text-align');
        return type ? align?.includes(type) : !!align;
    }
    /**
     * Align text.
     */
    align(params: AlignParams): void {
        const range = params.context.range;
        const nodes = range.targetedNodes();
        const type = params.type;
        for (const node of nodes.filter(node => !nodes.includes(node.parent))) {
            const alignedAncestor = node.closest(Align.isAligned);

            // Compute current alignment.
            const currentAlignment = alignedAncestor?.modifiers
                ?.find(Attributes)
                ?.style.get('text-align');

            if (!alignedAncestor || currentAlignment !== type) {
                node.modifiers.get(Attributes).style.set('text-align', type.toLowerCase());
            }
        }
    }
}

function alignButton(type: AlignType): ActionableNode {
    function isAligned(node: VNode, type: AlignType): boolean {
        const alignedAncestor = node.closest(Align.isAligned);
        return Align.isAligned(alignedAncestor || node, type);
    }

    const button = new ActionableNode({
        name: 'align' + type,
        label: 'Align ' + type,
        commandId: 'align',
        commandArgs: { type: type } as AlignParams,
        selected: (editor: JWEditor): boolean => {
            const range = editor.selection.range;
            const ancestor = range.start.closest(ContainerNode);
            const startIsAligned = ancestor && isAligned(ancestor, type);
            if (!startIsAligned || range.isCollapsed()) {
                return startIsAligned;
            } else {
                const ancestor = range.end.closest(ContainerNode);
                return ancestor && isAligned(ancestor, type);
            }
        },
    });
    button.modifiers.append(
        new Attributes({
            class: 'fa fa-align-' + type + ' fa-fw',
        }),
    );
    return button;
}
