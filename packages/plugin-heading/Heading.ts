import { JWPlugin } from '../core/src/JWPlugin';
import { HeadingDomParser } from './HeadingDomParser';
import { HeadingNode } from './HeadingNode';
import { RangeParams } from '../core/src/CorePlugin';
import { distinct } from '../utils/src/utils';
import { VNode, isLeaf } from '../core/src/VNodes/VNode';

export interface HeadingParams extends RangeParams {
    level: number;
}

export class Heading extends JWPlugin {
    readonly parsers = [HeadingDomParser];
    commands = {
        applyHeadingStyle: {
            handler: this.applyHeadingStyle.bind(this),
        },
    };
    shortcuts = [
        {
            pattern: 'CTRL+SHIFT+<Digit0>',
            commandId: 'applyHeadingStyle',
            commandArgs: { level: 0 },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit1>',
            commandId: 'applyHeadingStyle',
            commandArgs: { level: 1 },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit2>',
            commandId: 'applyHeadingStyle',
            commandArgs: { level: 2 },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit3>',
            commandId: 'applyHeadingStyle',
            commandArgs: { level: 3 },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit4>',
            commandId: 'applyHeadingStyle',
            commandArgs: { level: 4 },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit5>',
            commandId: 'applyHeadingStyle',
            commandArgs: { level: 5 },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit6>',
            commandId: 'applyHeadingStyle',
            commandArgs: { level: 6 },
        },
    ];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Change the formatting of the nodes in given range to Heading.
     *
     * @param params
     */
    applyHeadingStyle(params: HeadingParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        let nodesToConvert: VNode[];
        if (range.isCollapsed()) {
            nodesToConvert = [range.start.parent];
        } else {
            const selectedLeaves = range.selectedNodes(isLeaf);
            nodesToConvert = distinct(
                selectedLeaves.map(leaf => (leaf.atomic ? leaf.parent : leaf)),
            );
        }
        for (const node of nodesToConvert) {
            const heading = this._getFromLevel(params.level);
            node.before(heading);
            node.mergeWith(heading);
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return a heading node or a base container based on the given level.
     *
     * @param level
     */
    _getFromLevel(level: number): VNode {
        if (level === 0) {
            return this.editor.createBaseContainer();
        } else {
            return new HeadingNode(level);
        }
    }
}
