import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { VNode } from '../../core/src/VNodes/VNode';
import { Loadables } from '../../core/src/JWEditor';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { Inline } from '../../plugin-inline/src/Inline';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { setStyle, getStyle, removeStyle } from '../../utils/src/utils';
import { VRange } from '../../core/src/VRange';
import { Format } from '../../plugin-inline/src/Format';
import { FragmentNode } from '../../core/src/VNodes/FragmentNode';

export interface ColorParams extends CommandParams {
    color?: string; // css-valid color name
}

interface TextColorConfig extends JWPluginConfig {
    defaultTextColor?: string;
}

const defaultConfiguration = {
    defaultTextColor: 'black',
};

export class TextColor<T extends TextColorConfig = TextColorConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    configuration = { ...defaultConfiguration, ...this.configuration };
    commands = {
        colorText: {
            handler: this.colorText,
        },
        uncolorText: {
            handler: this.uncolorText,
        },
    };
    readonly loadables: Loadables<Keymap> = {
        shortcuts: [
            {
                pattern: 'CTRL+G',
                commandId: 'colorText',
                // TODO: use dialog to get params
                commandArgs: {
                    color: 'red',
                },
            },
            {
                pattern: 'CTRL+SHIFT+G',
                commandId: 'uncolorText',
            },
        ],
    };

    static hasColor(node: VNode): boolean;
    static hasColor(color: string, node: VNode): boolean;
    static hasColor(color: string | VNode, node?: VNode): boolean {
        if (color instanceof VNode) {
            node = color;
        }
        const nodeTextColor = getStyle(node, 'color');
        if (color instanceof VNode) {
            return !!nodeTextColor;
        } else {
            return nodeTextColor === color;
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Apply the given text color to the range.
     *
     * @param params
     */
    colorText(params: ColorParams): void {
        const color = params.color;
        const styleName = 'color';

        if (params.context.range.isCollapsed()) {
            // Set the style cache.
            const inline = this.dependencies.get(Inline);
            const currentCache = inline.cache.style || {};
            inline.cache.style = { ...currentCache, [styleName]: color };
        } else {
            for (const node of this._highestSelectedNodes(params.context.range)) {
                // Skip if the node already has the right color, through an
                // ancestor or a format.
                if (node.is(InlineNode)) {
                    const colorFormat = node.formats.find(format => getStyle(format, styleName));
                    if (colorFormat && getStyle(colorFormat, styleName) === color) continue;
                }
                const colorAncestor = node.ancestor(TextColor.hasColor);
                if (colorAncestor && TextColor.hasColor(color, colorAncestor)) continue;

                // Apply the style to the node or its first format.
                setStyle(this._nodeOrFirstFormat(node), styleName, color);

                // If there are ancestors of this node whose children all have
                // this style, style these ancestors instead of their
                // descendants.
                let parent = node.parent;
                while (parent && !parent.test(FragmentNode) && this._isAllColored(parent, color)) {
                    setStyle(parent, styleName, color);
                    for (const child of parent.children()) {
                        removeStyle(child, styleName);
                    }
                    parent = parent.parent;
                }
            }
        }
    }
    /**
     * Remove the current text color from the range. If the color was applied to
     * an ancestor, apply the default color to its relevant inline descendants.
     *
     * @param params
     */
    uncolorText(params: CommandParams): void {
        const range = params.context.range;
        const defaultColor = this.configuration.defaultTextColor;
        const hasColor = TextColor.hasColor;
        const styleName = 'color';

        if (range.isCollapsed()) {
            const inline = this.dependencies.get(Inline);

            if (range.start.ancestor(hasColor)) {
                // Set the text color style cache to the default color.
                const currentCache = inline.cache.style || {};
                inline.cache.style = { ...currentCache, [styleName]: defaultColor };
            } else if (inline.cache.style) {
                // Unset the text color style cache.
                delete inline.cache.style[styleName];
            }
        } else {
            for (const node of this._highestSelectedNodes(params.context.range)) {
                const target = this._nodeOrFirstFormat(node);
                const currentColor = getStyle(target, styleName);

                if (!currentColor || currentColor === defaultColor || node.ancestor(hasColor)) {
                    // Set the text color to the default color.
                    setStyle(target, styleName, defaultColor);
                } else {
                    // Remove the text color.
                    removeStyle(target, styleName);
                }

                // Uncolor the children and their formats as well.
                for (const child of node.children()) {
                    removeStyle(child, styleName);
                    if (child.is(InlineNode)) {
                        for (const format of child.formats) {
                            removeStyle(format, styleName);
                        }
                    }
                }
            }
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return the range's selected nodes, filtering out a selected node's
     * children if they are listed.
     *
     * @param range
     */
    _highestSelectedNodes(range: VRange): VNode[] {
        const selectedNodes = range.selectedNodes();
        return selectedNodes.filter(node => {
            return !node.ancestor(ancestor => selectedNodes.includes(ancestor));
        });
    }
    /**
     * Return the node's first format if any, itself otherwise.
     *
     * @param node
     */
    _nodeOrFirstFormat(node: VNode): VNode | Format {
        return node.is(InlineNode) ? node.formats[0] || node : node;
    }
    /**
     * Return true if all the children of the given node have the given color.
     *
     * @param node
     * @param color
     */
    _isAllColored(node: VNode, color: string): boolean {
        return node.children().every(child => TextColor.hasColor(color, child));
    }
}
