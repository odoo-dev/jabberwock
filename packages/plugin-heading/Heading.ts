import { JWPlugin } from '../core/src/JWPlugin';
import { HeadingDomParser } from './HeadingDomParser';
import { HeadingNode } from './HeadingNode';
import { ParagraphParams } from '../core/src/CorePlugin';
import { distinct } from '../utils/src/utils';
import { VNode, isLeaf } from '../core/src/VNodes/VNode';

export class Heading extends JWPlugin {
    readonly parsers = [HeadingDomParser];
    commandHooks = {
        applyParagraph: this.applyParagraph.bind(this),
    };
    shortcuts = [
        {
            pattern: 'CTRL+SHIFT+<Digit1>',
            commandId: 'applyParagraph',
            commandArgs: { nodeCreator: (): HeadingNode => new HeadingNode(1) },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit2>',
            commandId: 'applyParagraph',
            commandArgs: { nodeCreator: (): HeadingNode => new HeadingNode(2) },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit3>',
            commandId: 'applyParagraph',
            commandArgs: { nodeCreator: (): HeadingNode => new HeadingNode(3) },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit4>',
            commandId: 'applyParagraph',
            commandArgs: { nodeCreator: (): HeadingNode => new HeadingNode(4) },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit5>',
            commandId: 'applyParagraph',
            commandArgs: { nodeCreator: (): HeadingNode => new HeadingNode(5) },
        },
        {
            pattern: 'CTRL+SHIFT+<Digit6>',
            commandId: 'applyParagraph',
            commandArgs: { nodeCreator: (): HeadingNode => new HeadingNode(6) },
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
    applyParagraph(params: ParagraphParams): void {
        let heading = params.nodeCreator(); // todo: make sure to keep attributes
        if (heading.is(HeadingNode)) {
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
                node.before(heading);
                node.mergeWith(heading);
                heading = params.nodeCreator();
            }
        }
    }
}
