import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { HeadingXmlDomParser } from './HeadingXmlDomParser';
import { HeadingNode } from './HeadingNode';
import { CommandParams } from '../../core/src/Dispatcher';
import { VNode } from '../../core/src/VNodes/VNode';
import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { CheckingContext } from '../../core/src/ContextManager';
import { InsertParagraphBreakParams } from '../../core/src/Core';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { ComponentDefinition } from '../../plugin-layout/src/LayoutEngine';
import { RuleProperty } from '../../core/src/Mode';
import { isInTextualContext } from '../../utils/src/utils';
import { ParagraphNode } from '../../plugin-paragraph/src/ParagraphNode';
import { Paragraph } from '../../plugin-paragraph/src/Paragraph';
import { Pre } from '../../plugin-pre/src/Pre';
import { PreNode } from '../../plugin-pre/src/PreNode';
import { BlockquoteNode } from '../../plugin-blockquote/src/BlockquoteNode';
import { VRange } from '../../core/src/VRange';

export interface HeadingParams extends CommandParams {
    level: number;
}

export function isInHeading(range: VRange, level: number): boolean {
    const startIsHeading = range.start.closest(HeadingNode)?.level === level;
    if (!startIsHeading || range.isCollapsed()) {
        return startIsHeading;
    } else {
        return range.end.closest(HeadingNode)?.level === level;
    }
}
function headingButton(level: number): ComponentDefinition {
    return {
        id: 'Heading' + level + 'Button',
        async render(): Promise<ActionableNode[]> {
            const button = new ActionableNode({
                name: 'heading' + level,
                label: 'Heading' + level,
                commandId: 'applyHeadingStyle',
                commandArgs: { level: level } as HeadingParams,
                visible: isInTextualContext,
                selected: (editor: JWEditor): boolean => {
                    return isInHeading(editor.selection.range, level);
                },
                modifiers: [new Attributes({ class: 'h' + level })],
            });
            return [button];
        },
    };
}

export class Heading<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Paragraph, Pre];
    commands = {
        applyHeadingStyle: {
            handler: this.applyHeadingStyle,
        },
        insertParagraphBreak: {
            selector: [
                (node): boolean =>
                    node instanceof HeadingNode &&
                    this.editor.mode.is(node, RuleProperty.BREAKABLE),
            ],
            check: (context: CheckingContext): boolean => {
                const range = context.range;
                return range.isCollapsed() && !range.start.nextSibling();
            },
            handler: this.insertParagraphBreak,
        },
    };
    readonly loadables: Loadables<Parser & Keymap & Layout> = {
        parsers: [HeadingXmlDomParser],
        shortcuts: [0, 1, 2, 3, 4, 5, 6].map(level => {
            return {
                pattern: 'CTRL+SHIFT+<Digit' + level + '>',
                commandId: 'applyHeadingStyle',
                commandArgs: { level: level },
            };
        }),
        components: [
            {
                id: 'ParagraphButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'paragraph',
                        label: 'Paragraph',
                        commandId: 'applyHeadingStyle',
                        commandArgs: { level: 0 } as HeadingParams,
                        visible: isInTextualContext,
                        selected: (editor: JWEditor): boolean => {
                            const range = editor.selection.range;
                            if (range.start.parent) {
                                const startIsDefault = !!range.start.closest(
                                    ancestor =>
                                        ancestor instanceof editor.configuration.defaults.Container,
                                );
                                if (!startIsDefault || range.isCollapsed()) {
                                    return startIsDefault;
                                } else {
                                    return !!range.end.closest(
                                        ancestor =>
                                            ancestor instanceof
                                            editor.configuration.defaults.Container,
                                    );
                                }
                            } else {
                                return true;
                            }
                        },
                        modifiers: [new Attributes({ class: 'p' })],
                    });
                    return [button];
                },
            },
            ...[1, 2, 3, 4, 5, 6].map(headingButton),
        ],
        componentZones: [
            ['ParagraphButton', ['actionables']],
            ['Heading1Button', ['actionables']],
            ['Heading2Button', ['actionables']],
            ['Heading3Button', ['actionables']],
            ['Heading4Button', ['actionables']],
            ['Heading5Button', ['actionables']],
            ['Heading6Button', ['actionables']],
        ],
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Change the formatting of the nodes in given range to Heading.
     *
     * @param params
     */
    applyHeadingStyle(params: HeadingParams): void {
        for (const node of params.context.range.targetedNodes(
            node =>
                node instanceof HeadingNode ||
                node instanceof ParagraphNode ||
                node instanceof PreNode ||
                node instanceof BlockquoteNode,
        )) {
            const heading = this._createHeadingContainer(params.level);
            heading.modifiers = node.modifiers.clone();
            node.replaceWith(heading);
        }
    }

    /**
     * Inserting a paragraph break at the end of a heading exits the heading.
     *
     * @param params
     */
    insertParagraphBreak(params: InsertParagraphBreakParams): void {
        const range = params.context.range;
        const heading = range.targetedNodes(HeadingNode)[0];
        const duplicate = heading.splitAt(range.start);
        const newContainer = new ParagraphNode();
        duplicate.replaceWith(newContainer);
        range.modifiers = undefined;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return a heading node or a base container based on the given level.
     *
     * @param level
     */
    _createHeadingContainer(level: number): VNode {
        if (level === 0) {
            return new ParagraphNode();
        } else {
            return new HeadingNode({ level: level });
        }
    }
}
