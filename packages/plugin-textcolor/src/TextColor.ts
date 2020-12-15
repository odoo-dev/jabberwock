import { Color, ColorConfig, ColorParams } from '../../plugin-color/src/Color';
import { Loadables } from '../../core/src/JWEditor';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { CommandParams } from '../../core/src/Dispatcher';
import { Modifiers } from '../../core/src/Modifiers';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { InlineNode } from '../../plugin-inline/src/InlineNode';
import { Format } from '../../core/src/Format';
import { CssStyle } from '../../plugin-xml/src/CssStyle';
import { ZoneNode } from '../../plugin-layout/src/ZoneNode';
import { VNode } from '../../core/src/VNodes/VNode';

export class TextColor<T extends ColorConfig = ColorConfig> extends Color<T> {
    styleName = 'color';
    configuration = { defaultColor: 'black', ...this.configuration };
    commands = {
        colorText: {
            handler: this.color,
        },
        uncolorText: {
            handler: this.uncolor,
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
            let selectedNodes = range.selectedNodes(node => !(node instanceof ZoneNode));
            selectedNodes = selectedNodes.filter(node => !selectedNodes.includes(node.parent));
            // Color the highest ancestor.
            for (const node of selectedNodes) {
                // Color the highest fully selected format if any.
                const fullySelectedFormats = this._newFormats(node).filter(format => {
                    // This format is started by this node. Now find out if we
                    // end it within the selection.
                    return selectedNodes.includes(this._lastNodeWithFormat(node, format));
                });
                if (fullySelectedFormats.length) {
                    const highestFullFormat = fullySelectedFormats.pop();
                    const pairs: [VNode | Format, Format][] = selectedNodes.map(selectedNode => {
                        const format = this._findFormat(selectedNode, highestFullFormat);
                        if (format) {
                            return [this._inheritsColorFrom(selectedNode, color), format];
                        }
                    });
                    for (const pair of pairs) {
                        if (pair?.[1]) {
                            // Color the formats.
                            if (pair[0]) {
                                // If the node inherited the color, remove the
                                // inherited color.
                                this._removeColor(pair[0]);
                            }
                            this._applyColor(pair[1], color);
                        }
                    }
                } else if (!this._inheritsColorFrom(node, color)) {
                    // Skip if the node already has the right color, through an
                    // ancestor or a format.
                    this._applyColor(node, color);
                }
            }
        }
    }
    private _removeColor(node: VNode | Format): void {
        node.modifiers.get(Attributes).style.remove(this.styleName);
    }
    /**
     * Return the first format that matches the given format, on the given node.
     *
     * @param node
     * @param format
     */
    private _findFormat(node: VNode, format: Format): Format {
        return node.modifiers.filter(Format).find(nodeFormat => nodeFormat.isSameAs(format));
    }
    /**
     * Return the last consecutive node to have the given format (assumed to be
     * held by the given node too).
     *
     * @param node
     * @param format
     */
    private _lastNodeWithFormat(node: VNode, format: Format): VNode {
        let current = node;
        let next = node.nextSibling();
        while (this._findFormat(next, format)) {
            current = next;
            next = current.nextSibling();
        }
        return current;
    }
    /**
     * Return all formats that are started by the given node.
     *
     * @param node
     */
    private _newFormats(node: VNode): Format[] {
        const formats = node.modifiers.filter(Format);
        const previous = node.previousSibling();
        // A new format is starting if the previous sibling doesn't have it.
        if (!previous) return formats;
        return formats.filter(format => !this._findFormat(previous, format));
    }
    /**
     * If the given node inherits the given color through an ancestor of a
     * format, or if it simply has it itself, return the node or format it
     * inherits it from.
     *
     * @param node
     * @param color
     */
    private _inheritsColorFrom(node: VNode, color: string): VNode | Format | undefined {
        if (this.hasColor(color, node)) {
            return node;
        }
        const colorAncestor = node.ancestor(this.hasColor.bind(this));
        if (colorAncestor && this.hasColor(color, colorAncestor)) {
            return colorAncestor;
        }
        for (const format of node.modifiers.filter(Format)) {
            if (this.hasColor(color, format)) {
                return format;
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
                    if (child instanceof InlineNode) {
                        for (const format of child.modifiers.filter(Format)) {
                            format.modifiers.find(Attributes)?.style.remove(this.styleName);
                        }
                    }
                }
            }
        }
    }
}
