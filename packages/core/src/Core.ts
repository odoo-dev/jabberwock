import { JWPlugin, JWPluginConfig } from './JWPlugin';
import JWEditor from './JWEditor';
import { CommandParams } from './Dispatcher';
import { VSelectionDescription } from './VSelection';
import { VNode, RelativePosition } from './VNodes/VNode';
import { RuleProperty } from './Mode';

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
        if (range.mode.is(range.startContainer, RuleProperty.BREAKABLE)) {
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
        // Remove the contents of the range if needed.
        if (!params.context.range.isCollapsed()) {
            params.context.range.empty();
        }
        params.context.range.start.before(params.node);
    }
    /**
     * Delete in the backward direction (backspace key expected behavior).
     */
    deleteBackward(params: DeleteForwardParams): void {
        const range = params.context.range;
        if (range.isCollapsed()) {
            // Basic case: remove the node directly preceding the range.
            const previousSibling = range.start.previousSibling();
            if (previousSibling && range.mode.is(previousSibling, RuleProperty.EDITABLE)) {
                previousSibling.removeBackward();
            } else if (
                range.mode.is(range.startContainer, RuleProperty.BREAKABLE) &&
                range.mode.is(range.startContainer, RuleProperty.EDITABLE)
            ) {
                // Otherwise set range start at previous valid leaf.
                let ancestor = range.start.parent;
                while (
                    ancestor &&
                    range.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    range.mode.is(ancestor, RuleProperty.EDITABLE) &&
                    !ancestor.previousSibling()
                ) {
                    ancestor = ancestor.parent;
                }
                if (
                    ancestor &&
                    range.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    range.mode.is(ancestor, RuleProperty.EDITABLE)
                ) {
                    const previous = ancestor.previousSibling();
                    const previousLeaf = previous.lastLeaf();
                    if (previous && !previous.hasChildren()) {
                        // If the previous sibling is empty, remove it.
                        previous.removeBackward();
                    } else if (previousLeaf) {
                        range.setStart(previousLeaf, RelativePosition.AFTER);
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
            if (nextSibling && range.mode.is(nextSibling, RuleProperty.EDITABLE)) {
                nextSibling.removeForward();
            } else if (
                range.mode.is(range.endContainer, RuleProperty.BREAKABLE) &&
                range.mode.is(range.endContainer, RuleProperty.EDITABLE)
            ) {
                // Otherwise set range end at next valid leaf.
                let ancestor = range.end.parent;
                while (
                    ancestor &&
                    range.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    range.mode.is(ancestor, RuleProperty.EDITABLE) &&
                    !ancestor.nextSibling()
                ) {
                    ancestor = ancestor.parent;
                }
                if (
                    ancestor &&
                    range.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    range.mode.is(ancestor, RuleProperty.EDITABLE)
                ) {
                    const next = ancestor.nextSibling().firstLeaf();
                    if (next && !range.endContainer.hasChildren()) {
                        // If the current container is empty, remove it.
                        range.endContainer.removeForward();
                        range.setStart(next, RelativePosition.BEFORE);
                        range.setEnd(next, RelativePosition.BEFORE);
                    } else if (next) {
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
