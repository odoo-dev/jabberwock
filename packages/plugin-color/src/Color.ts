import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { Inline } from '../../plugin-inline/src/Inline';
import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { getStyle, setStyle, removeStyle } from '../../utils/src/utils';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { VRange } from '../../core/src/VRange';
import { Format } from '../../plugin-inline/src/Format';

export interface ColorParams extends CommandParams {
    color?: string; // css-valid color name
}
export interface ColorConfig extends JWPluginConfig {
    defaultColor?: string; // css-valid color name
}

export class Color<T extends ColorConfig = ColorConfig> extends JWPlugin<T> {
    static dependencies = [Inline];
    styleName: string; // css-valid style property name (eg: 'background-color')

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the given node has the given color.
     * If no color is passed, return true if the given node has any color.
     * Return false otherwise.
     */
    hasColor(node: VNode): boolean;
    hasColor(color: string, node: VNode): boolean;
    hasColor(color: string | VNode, node?: VNode): boolean {
        if (color instanceof AbstractNode) {
            node = color;
        }
        const nodeBackgroundColor = getStyle(node, this.styleName);
        if (color instanceof AbstractNode) {
            return !!nodeBackgroundColor;
        } else {
            return nodeBackgroundColor === color;
        }
    }
    /**
     * Apply the given color to the range.
     *
     * @param params
     */
    color(params: ColorParams): void {
        const color = params.color;
        if (params.context.range.isCollapsed()) {
            // Set the style cache.
            const inline = this.dependencies.get(Inline);
            const currentCache = inline.cache.style || {};
            inline.cache.style = { ...currentCache, [this.styleName]: color };
        } else {
            // TODO: apply on all `selectedNodes` when we have modifiers.
            for (const node of this._highestSelectedNodes(params.context.range)) {
                // Skip if the node already has the right color, through an
                // ancestor or a format.
                if (node.is(InlineNode)) {
                    const colorFormat = node.modifiers
                        .filter(Format)
                        .find(format => getStyle(format, this.styleName));
                    if (colorFormat && getStyle(colorFormat, this.styleName) === color) continue;
                }
                const colorAncestor = node.ancestor(this.hasColor.bind(this));
                if (colorAncestor && this.hasColor(color, colorAncestor)) continue;

                // Apply the style to the node or its first format.
                setStyle(this._nodeOrFirstFormat(node), this.styleName, color);

                // If there are ancestors of this node whose children all have
                // this style, style these ancestors instead of their
                // descendants.
                let parent = node.parent;
                // todo: ask age why do we need this feature and therefore how do we handle the parent.editable with depeding on the mode
                while (parent && parent.attributeEditable && this._isAllColored(parent, color)) {
                    setStyle(parent, this.styleName, color);
                    // TODO: not remove the children's styles when we have modifiers.
                    for (const child of parent.children()) {
                        removeStyle(child, this.styleName);
                    }
                    parent = parent.parent;
                }
            }
        }
    }
    /**
     * Remove the current color from the range. If the color was applied to
     * an ancestor, apply the default color to its relevant inline descendants.
     *
     * @param params
     */
    uncolor(params: CommandParams): void {
        const range = params.context.range;
        const defaultColor = this.configuration.defaultColor;
        const hasColor = this.hasColor.bind(this);

        if (range.isCollapsed()) {
            const inline = this.dependencies.get(Inline);

            if (range.start.ancestor(hasColor)) {
                // Set the color style cache to the default color.
                const currentCache = inline.cache.style || {};
                inline.cache.style = { ...currentCache, [this.styleName]: defaultColor };
            } else if (inline.cache.style) {
                // Unset the color style cache.
                delete inline.cache.style[this.styleName];
            }
        } else {
            // TODO: apply on all `selectedNodes` when we have modifiers.
            for (const node of this._highestSelectedNodes(params.context.range)) {
                const target = this._nodeOrFirstFormat(node);
                const currentColor = getStyle(target, this.styleName);

                if (!currentColor || currentColor === defaultColor || node.ancestor(hasColor)) {
                    // Set the color to the default color.
                    setStyle(target, this.styleName, defaultColor);
                } else {
                    // Remove the color.
                    removeStyle(target, this.styleName);
                }

                // Uncolor the children and their formats as well.
                for (const child of node.children()) {
                    removeStyle(child, this.styleName);
                    if (child.is(InlineNode)) {
                        for (const format of child.modifiers.filter(Format)) {
                            removeStyle(format, this.styleName);
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
        return node.is(InlineNode) ? node.modifiers?.find(Format) || node : node;
    }
    /**
     * Return true if all the children of the given node have the given color.
     *
     * @param node
     * @param color
     */
    _isAllColored(node: VNode, color: string): boolean {
        return node.children().every(child => this.hasColor(color, child));
    }
}
