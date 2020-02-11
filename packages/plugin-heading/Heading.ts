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
    shortcuts = [0, 1, 2, 3, 4, 5, 6].map(level => {
        return {
            pattern: 'CTRL+SHIFT+<Digit' + level + '>',
            commandId: 'applyHeadingStyle',
            commandArgs: { level: level },
        };
    });

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
            const heading = this._createHeadingContainer(params.level);
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
    _createHeadingContainer(level: number): VNode {
        if (level === 0) {
            return this.editor.createBaseContainer();
        } else {
            return new HeadingNode(level);
        }
    }
}
