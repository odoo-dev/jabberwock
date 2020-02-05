import { JWPlugin } from '../core/src/JWPlugin';
import { ParagraphDomParser } from './ParagraphDomParser';
import { ParagraphNode } from './ParagraphNode';
import { ParagraphParams } from '../core/src/CorePlugin';
import { distinct } from '../utils/src/utils';
import { VNode } from '../core/src/VNodes/VNode';

export class Paragraph extends JWPlugin {
    readonly parsers = [ParagraphDomParser];
    commandHooks = {
        applyParagraph: this.applyParagraph.bind(this),
    };
    shortcuts = [
        {
            pattern: 'CTRL+SHIFT+<Digit0>',
            commandId: 'applyParagraph',
            commandArgs: { nodeCreator: (): ParagraphNode => new ParagraphNode() },
        },
    ];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Change the formatting of the nodes in given range to Paragraph.
     *
     * @param params
     */
    applyParagraph(params: ParagraphParams): void {
        let paragraph = params.nodeCreator(); // todo: make sure to keep attributes
        if (paragraph.is(ParagraphNode)) {
            const range = params.range || this.editor.vDocument.selection.range;
            let nodesToConvert: VNode[];
            if (range.isCollapsed()) {
                nodesToConvert = [range.start.parent];
            } else {
                const selectedLeaves = range.selectedNodes(node => !node.children.length);
                nodesToConvert = distinct(
                    selectedLeaves.map(leaf => (leaf.atomic ? leaf.parent : leaf)),
                );
            }
            for (const node of nodesToConvert) {
                node.before(paragraph);
                node.mergeWith(paragraph);
                paragraph = params.nodeCreator();
            }
        }
    }
}
