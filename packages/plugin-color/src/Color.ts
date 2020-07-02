import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { Inline } from '../../plugin-inline/src/Inline';
import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { Format } from '../../core/src/Format';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { CssStyle } from '../../plugin-xml/src/CssStyle';

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
        const nodeBackgroundColor = node.modifiers.find(Attributes)?.style.get(this.styleName);
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
            inline.cache.style = new CssStyle({ ...currentCache, [this.styleName]: color });
        } else {
            const selectedNodes = params.context.range.selectedNodes((node: VNode): boolean => {
                // Skip if the node already has the right color, through an
                // ancestor or a format.
                if (this.hasColor(color, node)) return false;
                const colorAncestor = node.ancestor(this.hasColor.bind(this));
                return node.editable && (!colorAncestor || !this.hasColor(color, colorAncestor));
            });
            for (const node of selectedNodes.filter(node => !selectedNodes.includes(node.parent))) {
                // Apply the style to the node or its first format.
                this._nodeOrFirstFormat(node)
                    .modifiers.get(Attributes)
                    .style.set(this.styleName, color);
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
                if (!inline.cache.style) {
                    inline.cache.style = new CssStyle();
                }
                inline.cache.style.set(this.styleName, defaultColor);
            } else if (inline.cache.style) {
                // Unset the color style cache.
                inline.cache.style.remove(this.styleName);
            }
        } else {
            for (const node of params.context.range.selectedNodes()) {
                const target = this._nodeOrFirstFormat(node);
                const currentColor = target.modifiers.find(Attributes)?.style.get(this.styleName);

                if (!currentColor || currentColor === defaultColor || node.ancestor(hasColor)) {
                    // Set the color to the default color.
                    target.modifiers.get(Attributes).style.set(this.styleName, defaultColor);
                } else {
                    // Remove the color.
                    target.modifiers.find(Attributes)?.style.remove(this.styleName);
                }

                // Uncolor the children and their formats as well.
                for (const child of node.children()) {
                    child.modifiers.find(Attributes)?.style.remove(this.styleName);
                    if (child.is(InlineNode)) {
                        for (const format of child.modifiers.filter(Format)) {
                            format.modifiers.find(Attributes)?.style.remove(this.styleName);
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
     * Return the node's first format if any, itself otherwise.
     *
     * @param node
     */
    _nodeOrFirstFormat(node: VNode): VNode | Format {
        return node.modifiers.filter(Format)[0] || node;
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
