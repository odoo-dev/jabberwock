import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { HeadingDomParser } from './HeadingDomParser';
import { HeadingNode } from './HeadingNode';
import { CommandParams } from '../../core/src/Dispatcher';
import { VNode } from '../../core/src/VNodes/VNode';
import { Loadables } from '../../core/src/JWEditor';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { CheckingContext } from '../../core/src/ContextManager';
import { InsertParagraphBreakParams } from '../../core/src/Core';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';

export interface HeadingParams extends CommandParams {
    level: number;
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
    readonly loadables: Loadables<Parser & Keymap> = {
        parsers: [HeadingDomParser],
        shortcuts: [0, 1, 2, 3, 4, 5, 6].map(level => {
            return {
                pattern: 'CTRL+SHIFT+<Digit' + level + '>',
                commandId: 'applyHeadingStyle',
                commandArgs: { level: level },
            };
        }),
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
            heading.attributes = { ...node.attributes };
            node.before(heading);
            node.mergeWith(heading);
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
        duplicate.before(newContainer);
        duplicate.mergeWith(newContainer);
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
            return new HeadingNode(level);
        }
    }
}
