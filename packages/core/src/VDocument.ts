import { VNode, VNodeType } from './VNodes/VNode';
import { VRange } from './VRange';
import { CharNode } from './VNodes/CharNode';
import { isChar } from '../../utils/src/Predicates';
import { utils } from '../../utils/src/utils';
import { RootNode } from './VNodes/RootNode';
import { SimpleElementNode } from './VNodes/SimpleElementNode';
import { FormatInformation, FormatManager, FormatName } from './Format/FormatManager';

export class VDocument {
    root: VNode;
    range = new VRange();
    formatManager: FormatManager;
    /**
     * When apply format on a collapsed range, cache the calculation of the format the following
     * property.
     * This value is reset each time the range change in a document.
     */
    formatCache: Map<FormatName, FormatInformation> = null;

    constructor(root: RootNode, formatManager = new FormatManager()) {
        this.root = root;
        this.formatManager = formatManager;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(): void {
        // Remove the contents of the selection if needed.
        if (!this.range.isCollapsed()) {
            this.deleteSelection();
        }
        this.range.start.parent.splitAt(this.range.start);
    }
    /**
     * Insert something at range.
     *
     * @param node
     */
    insert(node: VNode): void {
        // Remove the contents of the selection if needed.
        if (!this.range.isCollapsed()) {
            this.deleteSelection();
        }
        this.range.start.before(node);
    }
    /**
     * Insert text at range.
     *
     * If the range is collapsed, add `text` to the vDocument and copy the formating of the
     * previous char or the next char.
     *
     * If the range is not collapsed, replace the text with the formating that was present in the
     * range.
     *
     * @param text
     */
    insertText(text: string): void {
        const format = this._getCurrentFormat();
        if (!this.range.isCollapsed()) {
            // Remove the contents of the selection if needed.
            this.deleteSelection();
        }
        // Split the text into CHAR nodes and insert them at the range.
        const characters = text.split('');
        characters.forEach(char => {
            const vNode = new CharNode(char, new Map(format));
            this.range.start.before(vNode);
        });
        this.formatCache = null;
    }

    /**
     * Get the format for the next insertion.
     */
    _getCurrentFormat(): Map<FormatName, FormatInformation> {
        let format: Map<FormatName, FormatInformation> = new Map();
        if (this.formatCache) {
            return this.formatCache;
        } else if (this.range.isCollapsed()) {
            const charToCopyFormat = (this.range.start.previousSibling(isChar) ||
                this.range.start.nextSibling(isChar)) as CharNode;
            if (charToCopyFormat) {
                format = new Map(charToCopyFormat.format);
            }
        } else {
            const selectedChars = this.range.selectedNodes.filter(isChar) as CharNode[];
            this.formatManager.formatNames.forEach(formatName => {
                selectedChars.forEach(char => {
                    const formatToAdd = char.format.get(formatName);
                    if (formatToAdd) {
                        format.set(formatName, formatToAdd);
                    }
                });
            });
        }
        return format;
    }

    /**
     * Truncate the tree by removing the selected nodes and merging their
     * orphaned children into the parent of the first removed node.
     */
    deleteSelection(): void {
        utils.withRange(() => {
            const nodes = this.range.selectedNodes;
            if (!nodes.length) return;
            this.range.collapse(this.range.start); // Reset the direction of the range.
            let reference = this.range.end;
            nodes.forEach(vNode => {
                // If the node has children, merge it with the container of the
                // range. Children of the merged node that should be truncated
                // as well will be deleted in the following iterations since
                // they appear in `nodes`. The children array must be cloned in
                // order to modify it while iterating.
                // TODO: test whether the node can be merged with the container.
                if (vNode.hasChildren()) {
                    vNode.children.slice().forEach(child => {
                        if (isChar(child) && reference.parent.type === 'root') {
                            // A CharNode cannot be the direct child of the root.
                            const paragraph = new SimpleElementNode(VNodeType.PARAGRAPH);
                            reference.after(paragraph);
                            paragraph.append(child);
                        } else {
                            reference.after(child);
                        }
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
     * Apply the `format` to the range.
     *
     * If the range is collapsed, set the format on the range so we know in the next insert
     * which format should be used.
     */
    applyFormat(formatName: string): void {
        if (this.range.isCollapsed()) {
            if (!this.formatCache) {
                this.formatCache = this._getCurrentFormat();
            }
            if (this.formatCache.get(formatName)) {
                this.formatCache.delete(formatName);
            } else {
                this.formatCache.set(formatName, this.formatManager.create(formatName));
            }
        } else {
            const selectedChars = this.range.selectedNodes.filter(isChar) as CharNode[];

            // If there is no char with the format `formatName` in the range,
            // add the format for all nodes.
            if (!selectedChars.every(char => char.format.has(formatName))) {
                selectedChars.forEach(char => {
                    char.format.set(formatName, this.formatManager.create(formatName));
                });
                // If there is at least one char in with the format `fomatName`
                // in the range, delete the format for all nodes.
            } else {
                selectedChars.forEach(char => {
                    char.format.delete(formatName);
                });
            }
        }
    }
}
