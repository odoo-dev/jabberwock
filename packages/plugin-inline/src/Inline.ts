import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { Format } from '../../core/src/Format';
import { Modifier } from '../../core/src/Modifier';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { InlineNode } from './InlineNode';
import { Constructor, isInTextualContext } from '../../utils/src/utils';
import { VNode } from '../../core/src/VNodes/VNode';
import { Modifiers } from '../../core/src/Modifiers';
import { CssStyle } from '../../plugin-xml/src/CssStyle';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';
import { Loadables } from '../../core/src/JWEditor';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { makeVersionable } from '../../core/src/Memory/Versionable';
import { VRange } from '../../core/src/VRange';

export interface FormatParams extends CommandParams {
    FormatClass: Constructor<Format>;
}
export type RemoveFormatParams = CommandParams;

interface InlineCache {
    modifiers: Modifiers | null;
    style: CssStyle | null;
}

export class Inline<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    commands = {
        toggleFormat: {
            handler: this.toggleFormat,
        },
        removeFormat: {
            handler: this.removeFormat,
        },
    };
    commandHooks = {
        setSelection: this.resetCache,
    };
    loadables: Loadables<Renderer & Layout> = {
        components: [
            {
                id: 'RemoveFormatButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'removeFormat',
                        label: 'Remove format',
                        commandId: 'removeFormat',
                        commandArgs: {} as RemoveFormatParams,
                        visible: isInTextualContext,
                        selected: (): boolean => false,
                        modifiers: [new Attributes({ class: 'fa fa-eraser fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [['RemoveFormatButton', ['actionables']]],
    };
    /**
     * When applying a modifier on a collapsed range, cache the calculation of
     * the modifier in the following property. This value is reset each time the
     * range changes in a document.
     */
    cache: InlineCache = makeVersionable({
        modifiers: undefined,
        style: undefined,
    });

    start(): Promise<void> {
        this.editor.memory.attach(this.cache);
        this.getCurrentModifiers();
        this.getCurrentStyle();
        return super.start();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Apply the `format` to the range.
     *
     * @param params
     */
    toggleFormat(params: FormatParams): void {
        const range = params.context.range;
        const FormatClass = params.FormatClass;

        if (range.isCollapsed()) {
            if (!this.cache.modifiers) {
                this.cache.modifiers = this.getCurrentModifiers(range);
            }
            const format = this.cache.modifiers?.find(FormatClass);
            if (format) {
                this.cache.modifiers.remove(format);
            } else {
                if (!this.cache.modifiers) {
                    this.cache.modifiers = new Modifiers();
                }
                this.cache.modifiers.append(new FormatClass());
            }
        } else {
            const selectedInlines = range.selectedNodes(InlineNode);

            // If every char in the range has the format `FormatClass`, remove
            // the format for all of them.
            const allHaveFormat = selectedInlines.every(inline => {
                return !!inline.modifiers.find(FormatClass);
            });
            if (allHaveFormat) {
                for (const inline of selectedInlines) {
                    const format = inline.modifiers.find(FormatClass);
                    // Apply the attributes of the format we're about to remove
                    // to the inline itself.
                    const attributes = inline.modifiers.get(Attributes);
                    const matchingFormatAttributes = format.modifiers.find(Attributes);
                    if (matchingFormatAttributes) {
                        for (const key of matchingFormatAttributes.keys()) {
                            attributes.set(key, matchingFormatAttributes.get(key));
                        }
                    }
                    // Remove the format.
                    inline.modifiers.remove(format);
                }
            } else {
                // If there is at least one char in the range without the format
                // `FormatClass`, set the format for all nodes.
                for (const inline of selectedInlines) {
                    if (!inline.modifiers.find(FormatClass)) {
                        new FormatClass().applyTo(inline);
                    }
                }
            }
        }
    }
    isAllFormat(FormatClass: Constructor<Modifier>, range = this.editor.selection.range): boolean {
        if (range.isCollapsed()) {
            if (!this.cache.modifiers) {
                return !!this.getCurrentModifiers(range)?.find(FormatClass);
            }
            return !!this.cache.modifiers.find(FormatClass);
        } else {
            const selectedInlines = range.selectedNodes(InlineNode);
            for (const char of selectedInlines) {
                if (!char.modifiers.find(FormatClass)) {
                    return false;
                }
            }
            return !!selectedInlines.length;
        }
    }
    /**
     * Get the modifiers for the next insertion.
     */
    getCurrentModifiers(range?: VRange): Modifiers | null {
        const storeInCache = !range;
        range = range || this.editor.selection.range;
        if (this.cache.modifiers === undefined || range !== this.editor.selection.range) {
            let inlineToCopyModifiers: VNode;
            if (range.isCollapsed()) {
                // TODO: LineBreakNode should have the formats as well.
                inlineToCopyModifiers =
                    range.start.previousSibling(node => !(node instanceof LineBreakNode)) ||
                    range.start.nextSibling();
            } else {
                inlineToCopyModifiers = range.start.nextSibling();
            }
            let modifiers: Modifiers = null;
            if (inlineToCopyModifiers && inlineToCopyModifiers instanceof InlineNode) {
                modifiers = inlineToCopyModifiers.modifiers.clone();
            }
            if (storeInCache) {
                this.cache.modifiers = modifiers;
            }
            return modifiers;
        } else {
            return this.cache.modifiers;
        }
    }
    /**
     * Get the styles for the next insertion.
     */
    getCurrentStyle(range?: VRange): CssStyle | null {
        const storeInCache = !range;
        range = range || this.editor.selection.range;
        if (this.cache.style === undefined || range !== this.editor.selection.range) {
            let inlineToCopyStyle: VNode;
            if (range.isCollapsed()) {
                inlineToCopyStyle = range.start.previousSibling() || range.start.nextSibling();
            } else {
                inlineToCopyStyle = range.start.nextSibling();
            }
            let style: CssStyle = null;
            if (inlineToCopyStyle && inlineToCopyStyle instanceof InlineNode) {
                style = inlineToCopyStyle.modifiers.find(Attributes)?.style.clone() || null;
            }
            if (storeInCache) {
                this.cache.style = style;
            }
            return style;
        }
        return this.cache.style;
    }
    /**
     * Each time the selection changes, we reset its format and style.
     */
    resetCache(): void {
        this.cache.modifiers = undefined;
        this.cache.style = undefined;
    }
    /**
     * Remove the formatting of the nodes in the range.
     *
     * @param params
     */
    removeFormat(params: RemoveFormatParams): void {
        const nodes = params.context.range.selectedNodes();
        for (const node of nodes) {
            // TODO: some formats might be on the parent...
            node.modifiers.empty();
        }
    }
}
