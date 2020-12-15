import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { VNode } from '../../core/src/VNodes/VNode';
import { AbstractNode } from '../../core/src/VNodes/AbstractNode';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { Format } from '../../core/src/Format';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { CssStyle } from '../../plugin-xml/src/CssStyle';
import { Modifiers } from '../../core/src/Modifiers';
import { CharNode } from '../../plugin-char/src/CharNode';

export interface ColorParams extends CommandParams {
    color?: string; // css-valid color name
}
export interface ColorConfig extends JWPluginConfig {
    defaultColor?: string; // css-valid color name
}

export class Color<T extends ColorConfig = ColorConfig> extends JWPlugin<T> {
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
    hasColor(color: string, node: VNode | Format): boolean;
    hasColor(color: string | VNode, node?: VNode | Format): boolean {
        if (color instanceof AbstractNode) {
            node = color;
        }
        const nodeColor = node.modifiers.find(Attributes)?.style.get(this.styleName);
        if (color instanceof AbstractNode) {
            return !!nodeColor;
        } else {
            return nodeColor === color;
        }
    }
    /**
     * Apply the given color to the range.
     *
     * @param params
     */
    color(params: ColorParams): void {
        const color = params.color;
        const range = params.context.range;
        if (range.isCollapsed()) {
            // Set the style cache.
            if (!range.modifiers) {
                range.modifiers = new Modifiers();
            }
            const currentCache = range.modifiers.find(Attributes)?.style;
            // Convert CssStyle class into a true object for spread operator.
            const currentCacheObject = currentCache?.toJSON() || {};
            range.modifiers.get(Attributes).style = new CssStyle({
                ...currentCacheObject,
                [this.styleName]: color,
            });
        } else {
            const selectedNodes = range.traversedNodes(CharNode);
            for (const node of selectedNodes) {
                this._applyColor(node, color);
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
            if (range.start.ancestor(hasColor)) {
                // Set the color style cache to the default color.
                if (!range.modifiers) {
                    range.modifiers = new Modifiers();
                }
                range.modifiers.get(Attributes).style.set(this.styleName, defaultColor);
            } else if (range.modifiers?.find(Attributes)?.style.length) {
                // Unset the color style cache.
                range.modifiers?.find(Attributes).style.remove(this.styleName);
            }
        } else {
            for (const node of params.context.range.traversedNodes(CharNode)) {
                const target = this._nodeOrFirstFormat(node);
                // Remove the color.
                target.modifiers.find(Attributes)?.style.remove(this.styleName);
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
    protected _applyColor(node: VNode | Format, color: string): void {
        node.modifiers.get(Attributes).style.set(this.styleName, color);
    }
}
