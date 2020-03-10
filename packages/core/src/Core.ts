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
        this.editor.vDocument.insertParagraphBreak(params.context.range);
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
            if (previousSibling) {
                previousSibling.removeBackward();
            } else {
                // Otherwise delete nodes between range and previous leaf.
                const previousLeaf = range.start.previousLeaf(node => {
                    return node !== range.start.parent;
                });
                if (previousLeaf) {
                    range.setStart(previousLeaf, RelativePosition.AFTER);
                    range.empty();
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
            if (nextSibling) {
                nextSibling.removeForward();
            } else {
                // Otherwise delete nodes between range and next leaf.
                const nextLeaf = range.end.nextLeaf();
                if (nextLeaf) {
                    range.setEnd(nextLeaf, RelativePosition.BEFORE);
                    range.empty();
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
