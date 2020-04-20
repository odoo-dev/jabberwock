import { JWPlugin, JWPluginConfig } from './JWPlugin';
import JWEditor from './JWEditor';
import { CommandParams } from './Dispatcher';
import { VSelectionDescription, Direction } from './VSelection';
import { VNode, RelativePosition } from './VNodes/VNode';

export type InsertParagraphBreakParams = CommandParams;
export type DeleteBackwardParams = CommandParams;
export type DeleteForwardParams = CommandParams;

export interface InsertParams extends CommandParams {
    node: VNode;
}

export interface VSelectionParams {
    vSelection: VSelectionDescription;
}

export class Core<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    editor: JWEditor;
    commands = {
        insert: {
            handler: this.insert,
        },
        insertParagraphBreak: {
            handler: this.insertParagraphBreak,
        },
        setSelection: {
            handler: this.setSelection,
        },
        deleteBackward: {
            handler: this.deleteBackward,
        },
        deleteForward: {
            handler: this.deleteForward,
        },
        selectAll: {
            handler: this.selectAll,
        },
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert a paragraph break.
     */
    insertParagraphBreak(params: InsertParagraphBreakParams): void {
        const range = params.context.range;
        // Remove the contents of the range if needed.
        if (!range.isCollapsed()) {
            range.empty();
        }
        if (range.startContainer.breakable) {
            range.startContainer.splitAt(range.start);
        } else {
            // Use a separator to break paragraphs in an unbreakable.
            const Separator = this.editor.configuration.defaults.Separator;
            range.start.before(new Separator());
        }
    }
    /**
     * Insert a VNode at the current position of the selection.
     *
     * @param params
     */
    insert(params: InsertParams): void {
        this.editor.vDocument.insert(params.node, params.context.range);
    }
    /**
     * Delete in the backward direction (backspace key expected behavior).
     */
    deleteBackward(params: DeleteForwardParams): void {
        const range = params.context.range;
        if (range.isCollapsed()) {
            // Basic case: remove the node directly preceding the range.
            const previousSibling = range.start.previousSibling();
            if (
                previousSibling &&
                range.startContainer.breakable &&
                range.startContainer.editable
            ) {
                previousSibling.removeBackward();
            } else if (range.startContainer.breakable && range.startContainer.editable) {
                // Otherwise set range start at previous valid leaf.
                let ancestor = range.start.parent;
                while (ancestor?.breakable && ancestor.editable && !ancestor.previousSibling()) {
                    ancestor = ancestor.parent;
                }
                if (ancestor?.breakable && ancestor.editable) {
                    const previous = ancestor.previousSibling().lastLeaf();
                    if (previous) {
                        range.setStart(previous, RelativePosition.AFTER);
                        range.empty();
                    }
                }
            }
        } else {
            range.empty();
        }
    }
    /**
     * Delete in the forward direction (delete key expected behavior).
     */
    deleteForward(params: DeleteForwardParams): void {
        const range = params.context.range;
        if (range.isCollapsed()) {
            // Basic case: remove the node directly following the range.
            const nextSibling = range.end.nextSibling();
            if (nextSibling && range.endContainer.breakable && range.endContainer.editable) {
                nextSibling.removeForward();
            } else if (range.endContainer.breakable && range.endContainer.editable) {
                // Otherwise set range end at next valid leaf.
                let ancestor = range.end.parent;
                while (ancestor?.breakable && ancestor.editable && !ancestor.nextSibling()) {
                    ancestor = ancestor.parent;
                }
                if (ancestor?.breakable && ancestor.editable) {
                    const next = ancestor.nextSibling().firstLeaf();
                    if (next) {
                        range.setEnd(next, RelativePosition.BEFORE);
                        range.empty();
                    }
                }
            }
        } else {
            range.empty();
        }
    }
    /**
     * Navigate to a given range.
     *
     * @param params
     */
    setSelection(params: VSelectionParams): void {
        this.editor.selection.set(params.vSelection);
    }
    /**
     * Update the selection in such a way that it selects the entire document.
     *
     * @param params
     */
    selectAll(): void {
        this.editor.selection.set({
            anchorNode: this.editor.vDocument.root.firstLeaf(),
            anchorPosition: RelativePosition.BEFORE,
            focusNode: this.editor.vDocument.root.lastLeaf(),
            focusPosition: RelativePosition.AFTER,
            direction: Direction.FORWARD,
        });
    }
}
