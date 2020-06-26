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
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';
import { ComponentDefinition } from '../../plugin-layout/src/LayoutEngine';

export interface HeadingParams extends CommandParams {
    level: number;
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
                selected: (editor: JWEditor): boolean => {
                    const nodes = editor.selection.range.targetedNodes();
                    return (
                        nodes.length &&
                        nodes.every(node => {
                            return node.closest(HeadingNode)?.level === level;
                        })
                    );
                },
                modifiers: [new Attributes({ class: 'h' + level })],
            });
            return [button];
        },
    };
}

export class Heading<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    commands = {
        applyHeadingStyle: {
            handler: this.applyHeadingStyle,
        },
        insertParagraphBreak: {
            selector: [HeadingNode],
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
                        selected: (editor: JWEditor): boolean => {
                            const nodes = editor.selection.range.targetedNodes();
                            return nodes.every(node => {
                                return node.closest(ancestor => {
                                    return ancestor.is(editor.configuration.defaults.Container);
                                });
                            });
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
        for (const node of params.context.range.targetedNodes(ContainerNode)) {
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
        const newContainer = new this.editor.configuration.defaults.Container();
        duplicate.replaceWith(newContainer);
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
            return new this.editor.configuration.defaults.Container();
        } else {
            return new HeadingNode({ level: level });
        }
    }
}
