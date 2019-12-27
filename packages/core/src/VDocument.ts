import { VNode } from './VNodes/VNode';
import { VSelection } from './VSelection';
import { CharNode, FormatType, FORMAT_TYPES } from './VNodes/CharNode';
import { isChar } from '../../utils/src/Predicates';
import { Direction } from '../../utils/src/selection';
import { FragmentNode } from './VNodes/FragmentNode';
import { withMarkers } from '../../utils/src/markers';

export class VDocument {
    root: VNode;
    selection = new VSelection();
    /**
     * When apply format on a collapsed selection, cache the calculation of the
     * format the following property. This value is reset each time the
     * selection changes in a document.
     */
    formatCache: FormatType = null;

    constructor(root: FragmentNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(): void {
        // Remove the contents of the selection if needed.
        if (!this.selection.isCollapsed()) {
            this.deleteSelection();
        }
        this.selection.anchor.parent.splitAt(this.selection.anchor);
    }
    /**
     * Insert a VNode at the current position of the selection.
     *
     * @param node
     */
    insert(node: VNode): void {
        // Remove the contents of the selection if needed.
        if (!this.selection.isCollapsed()) {
            this.deleteSelection();
        }
        this.selection.anchor.before(node);
    }
    /**
     * Insert text at the current position of the selection.
     *
     * If the selection is collapsed, add `text` to the vDocument and copy the
     * formating of the previous char or the next char.
     *
     * If the selection is not collapsed, replace the text with the formating
     * that was present in the selection.
     *
     * @param text
     */
    insertText(text: string): void {
        const format = this._getCurrentFormat();
        if (!this.selection.isCollapsed()) {
            // Remove the contents of the selection if needed.
            this.deleteSelection();
        }
        // Split the text into CHAR nodes and insert them in the selection.
        const characters = text.split('');
        characters.forEach(char => {
            const vNode = new CharNode(char, format);
            this.selection.anchor.before(vNode);
        });
        this.formatCache = null;
    }

    /**
     * Get the format for the next insertion.
     */
    _getCurrentFormat(): FormatType {
        let format: FormatType = {};
        if (this.formatCache) {
            return this.formatCache;
        } else if (this.selection.isCollapsed()) {
            const charToCopyFormat = (this.selection.anchor.previousSibling(isChar) ||
                this.selection.anchor.nextSibling(isChar) || {
                    format: {},
                }) as CharNode;
            format = { ...charToCopyFormat.format };
        } else {
            const selectedChars = this.selection.selectedNodes.filter(isChar) as CharNode[];
            FORMAT_TYPES.forEach(formatName => {
                format[formatName] = selectedChars.some(char => char.format[formatName]);
            });
        }
        return format;
    }

    /**
     * Truncate the tree by removing the selected nodes and merging their
     * orphaned children into the parent of the first removed node.
     */
    deleteSelection(): void {
        withMarkers(() => {
            const nodes = this.selection.selectedNodes;
            if (!nodes.length) return;

            // Collapse the selection at its starting point from a depth-first
            // pre-order traversal point of view.
            if (this.selection.direction === Direction.FORWARD) {
                this.selection.collapse(this.selection.anchor);
            } else {
                this.selection.collapse(this.selection.focus);
            }

            let reference = this.selection.focus;
            nodes.forEach(vNode => {
                // If the node has children, merge it with the container of the
                // selection. Children of the merged node that ought to be
                // truncated as well will be deleted in the following iterations
                // since they appear in `nodes`. The children array must be
                // cloned in order to modify it while iterating.
                // TODO: test whether the node can be merged with the container.
                if (vNode.hasChildren()) {
                    vNode.children.slice().forEach(child => {
                        reference.after(child);
                        reference = child;
                    });
                }
            });
            // Then remove.
            nodes.forEach(vNode => vNode.remove());
        });
    }

    //--------------------------------------------------------------------------
    // Context
    //--------------------------------------------------------------------------

    /**
     * Apply the `format` to the selection.
     *
     * If the selection is collapsed, set the format on the selection to be
     * used to set the format in the next insert.
     */
    applyFormat(formatName: string): void {
        if (this.selection.isCollapsed()) {
            if (!this.formatCache) {
                this.formatCache = this._getCurrentFormat();
            }
            this.formatCache[formatName] = !this.formatCache[formatName];
        } else {
            const selectedChars = this.selection.selectedNodes.filter(isChar) as CharNode[];

            // If there is no char with the format `formatName` in the
            // selection, set the format to true for all nodes.
            if (!selectedChars.every(char => char.format[formatName])) {
                selectedChars.forEach(char => {
                    char[formatName] = true;
                });
                // If there is at least one char in with the format `fomatName`
                // in the selection, set the format to false for all nodes.
            } else {
                selectedChars.forEach(char => {
                    char[formatName] = false;
                });
            }
        }
    }
}
