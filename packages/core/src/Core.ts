import { JWPlugin, JWPluginConfig } from './JWPlugin';
import JWEditor from './JWEditor';
import { CommandParams } from './Dispatcher';
import { VSelectionDescription } from './VSelection';
import { VNode, RelativePosition } from './VNodes/VNode';
import { removeBackwardNodeTemp } from './VNodes/AbstractNode';
import {
    previousSiblingNodeTemp,
    nextSiblingNodeTemp,
    beforeNodeTemp,
} from './VNodes/AbstractNode';

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
            beforeNodeTemp(range.start, new Separator());
        }
    }
    /**
     * Insert a VNode at the current position of the selection.
     *
     * @param params
     */
    insert(params: InsertParams): void {
        // Remove the contents of the range if needed.
        if (!params.context.range.isCollapsed()) {
            params.context.range.empty();
        }
        beforeNodeTemp(params.context.range.start, params.node);
    }
    /**
     * Delete in the backward direction (backspace key expected behavior).
     */
    deleteBackward(params: DeleteForwardParams): void {
        const range = params.context.range;
        if (range.isCollapsed()) {
            // Basic case: remove the node directly preceding the range.
            const previousSibling = previousSiblingNodeTemp(range.start);
            if (
                previousSibling &&
                range.startContainer.breakable &&
                range.startContainer.editable
            ) {
                removeBackwardNodeTemp(previousSibling);
            } else if (range.startContainer.breakable && range.startContainer.editable) {
                // Otherwise set range start at previous valid leaf.
                let ancestor: VNode = range.start.parent;
                while (
                    ancestor?.breakable &&
                    ancestor.editable &&
                    !previousSiblingNodeTemp(ancestor)
                ) {
                    ancestor = ancestor.parent;
                }
                if (ancestor?.breakable && ancestor.editable) {
                    const previous = previousSiblingNodeTemp(ancestor).lastLeaf();
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
            const nextSibling = nextSiblingNodeTemp(range.end);
            if (nextSibling && range.endContainer.breakable && range.endContainer.editable) {
                nextSiblingNodeTemp(range.end);
            } else if (range.endContainer.breakable && range.endContainer.editable) {
                // Otherwise set range end at next valid leaf.
                let ancestor: VNode = range.end.parent;
                while (ancestor?.breakable && ancestor.editable && !nextSiblingNodeTemp(ancestor)) {
                    ancestor = ancestor.parent;
                }
                if (ancestor?.breakable && ancestor.editable) {
                    const next = nextSiblingNodeTemp(ancestor).firstLeaf();
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
}
