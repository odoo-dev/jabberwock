import { VNode } from './VNodes/VNode';
import { VRange } from './VRange';
import { FormatName, Format } from './Format';
import { withMarkers } from '../../utils/src/markers';
import { FragmentNode } from './VNodes/FragmentNode';
import { VSelection } from './VSelection';

export class VDocument {
    root: VNode;
    selection = new VSelection();
    /**
     * When apply format on a collapsed range, cache the calculation of the format the following
     * property.
     * This value is reset each time the range change in a document.
     */
    formatCache: Record<FormatName, Format> = null;

    constructor(root: FragmentNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(range = this.selection.range): void {
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            this.deleteSelection(range);
        }
        range.startContainer.splitAt(range.start);
    }
    /**
     * Insert something at range.
     *
     * @param node
     */
    insert(node: VNode, range = this.selection.range): void {
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            this.deleteSelection(range);
        }
        range.start.before(node);
    }
    /**
     * Truncate the tree by removing the selected nodes and merging their
     * orphaned children into the parent of the first removed node.
     */
    deleteSelection(range: VRange): void {
        withMarkers(() => {
            const selectedNodes = range.selectedNodes();
            if (!selectedNodes.length) return;
            // If the node has children, merge it with the container of the
            // range. Children of the merged node that should be truncated
            // as well will be deleted in the following iterations since
            // they appear in `nodes`. The children array must be cloned in
            // order to modify it while iterating.
            const newContainer = range.start.parent;
            selectedNodes.forEach(vNode => {
                if (vNode.hasChildren()) {
                    vNode.mergeWith(newContainer);
                } else {
                    vNode.remove();
                }
            });
        });
    }
    /**
     * Apply the `format` to the selection.
     *
     * If the selection is collapsed, set the format on the selection so we know
     * in the next insert which format should be used.
     */
    applyFormat(format: Format, range = this.selection.range): void {
        if (range.isCollapsed()) {
            if (!this.formatCache) {
                this.formatCache = this.getCurrentFormat();
            }
            if (this.formatCache[format.name]) {
                delete this.formatCache[format.name];
            } else {
                this.formatCache[format.name] = format;
            }
        } else {
            const selectedChars = range.selectedNodes(node => !node.hasChildren());

            // If every char in the range has the format `formatName`, remove
            // the format for all of them.
            if (selectedChars.every(char => char.format[format.name])) {
                selectedChars.forEach(char => {
                    const formatAttributes = char.format[format.name].attributes;
                    if (formatAttributes && formatAttributes.size) {
                        formatAttributes.forEach((value: string, key: string) => {
                            if (!char.attributes) {
                                char.attributes = new Map<string, string>();
                            }
                            char.attributes.set(key, value);
                        });
                    }
                    delete char.format[format.name];
                });
                // If there is at least one char in the range without the format
                // `formatName`, set the format for all nodes.
            } else {
                selectedChars.forEach(char => {
                    char.format[format.name] = format;
                });
            }
        }
    }
    /**
     * Get the format for the next insertion.
     */
    getCurrentFormat(range = this.selection.range): Record<FormatName, Format> {
        let format: Record<FormatName, Format> = {};
        if (this.formatCache) {
            return this.formatCache;
        } else if (range.isCollapsed()) {
            const charToCopyFormat = range.start.previousSibling() ||
                range.start.nextSibling() || {
                    format: {},
                };
            format = { ...charToCopyFormat.format };
        } else {
            const selectedChars = range.selectedNodes(node => !node.hasChildren());
            selectedChars.forEach(char => {
                Object.values(char.format).forEach(value => {
                    format[value.name] = value;
                });
            });
        }
        return format;
    }
}
