import { VNode, VNodeType, FormatType, FORMAT_TYPES } from './VNode';
import { VRange } from './VRange';

export let withRange = false;

function isChar(node): boolean {
    return node.type === VNodeType.CHAR;
}

export class VDocument {
    root: VNode;
    range = new VRange();
    /**
     * When apply format on a collapsed range, cache the calculation of the format the following
     * property.
     * This value is reset each time the range change in a document.
     */
    formatCache: FormatType = null;

    constructor(root: VNode) {
        this.root = root;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Handle the general expected behavior (a block split) of the enter key.
     */
    enter(): void {
        // Remove the contents of the selection if needed.
        if (!this.range.isCollapsed()) {
            this.deleteSelection();
        }
        // Collect all the siblings after the first range node.
        const nextSiblings: VNode[] = [this.range.start];
        VDocument.withRange(() => {
            if (this.range.start.nextSibling()) {
                this.range.start.next(next => {
                    nextSiblings.push(next);
                    return !next.nextSibling();
                });
            }
        });
        // Duplicate the parent and put the siblings in it.
        const duplicatedParent = this.range.start.parent.duplicate();
        this.range.start.parent.after(duplicatedParent);
        nextSiblings.forEach(sibling => duplicatedParent.append(sibling));
    }
    /**
     * Change the selection's paragraph formatting. If there is no selection,
     * first select the parent of the range nodes.
     *
     * Examples:
     *
     * - `<paragraph>te◆xt</paragraph>` =>
     *   `changeType(VNodeType.HEADING1)` =>
     *   `<heading1>▶text◀</heading1>`
     *
     * - `<heading1>te▶xt</heading1><heading2>te◀xt</heading2>`=>
     *   `changeType(VNodeType.PARAGRAPH)` =>
     *   `<paragraph>te▶xt</paragraph><paragraph>te◀xt</paragraph>`
     *
     * @param type
     */
    formatParagraph(type: VNodeType): void {
        if (this.range.isCollapsed()) {
            this.range.select(this.range.start.parent, this.range.end.parent);
        }
        new Set(this.range.selectedLeaves.map(node => node.parent)).forEach(parent => {
            // TODO: this suffices for the moment, but it will not be enough
            // anymore once we introduce the VNode class extensions.
            parent.type = type;
        });
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
        const characters = text.split('').reverse();
        characters.forEach(char => {
            const vNode = new VNode(VNodeType.CHAR, '#text', char, format);
            this.range.start.before(vNode);
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
        } else if (this.range.isCollapsed()) {
            const charToCopyFormat = this.range.start.previousSibling(isChar) ||
                this.range.start.nextSibling(isChar) || {
                    format: {},
                };
            format = { ...charToCopyFormat.format };
        } else {
            const selectedChars = this.range.selectedNodes.filter(isChar);
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
        VDocument.withRange(() => {
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
     * Call a callback on this VNode without ignoring the range nodes.
     *
     * @param callback
     */
    static withRange<T>(callback: () => T): T {
        // Record the previous value to allow for nested calls to `withRange`.
        const previousValue = withRange;
        withRange = true;
        const result = callback();
        withRange = previousValue;
        return result;
    }

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
            this.formatCache[formatName] = !this.formatCache[formatName];
        } else {
            const selectedChars = this.range.selectedNodes.filter(isChar);

            // If there is no char with the format `formatName` in the range, set the format to true
            // for all nodes.
            if (!selectedChars.every(char => char.format[formatName])) {
                selectedChars.forEach(char => {
                    char.format[formatName] = true;
                });
                // If there is at least one char in with the format `fomatName` in the range, set the
                // format to false for all nodes.
            } else {
                selectedChars.forEach(char => {
                    char.format[formatName] = false;
                });
            }
        }
    }
}
