import { JWPlugin, JWPluginConfig } from './JWPlugin';
import JWEditor from './JWEditor';
import { CommandParams } from './Dispatcher';
import { VSelectionDescription, Direction } from './VSelection';
import { VNode, RelativePosition } from './VNodes/VNode';
import { RuleProperty } from './Mode';
import { AtomicNode } from './VNodes/AtomicNode';
import { VRange } from './VRange';

export type InsertParagraphBreakParams = CommandParams;
export type DeleteBackwardParams = CommandParams;
export type DeleteForwardParams = CommandParams;

export interface InsertParams extends CommandParams {
    node: VNode;
}

export interface DeleteWordParams extends CommandParams {
    text: string;
    direction: Direction;
}

export interface VSelectionParams extends CommandParams {
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
        deleteWord: {
            handler: this.deleteWord,
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
                if (previousSibling instanceof AtomicNode) {
                    previousSibling.removeBackward();
                } else {
                    const startContainer = range.startContainer;
                    const index = startContainer.childVNodes.indexOf(range.start);
                    let node: VNode = startContainer.childVNodes[index];
                    while (node && node instanceof AtomicNode) {
                        previousSibling.append(node);
                        // The index does not need to be incremented because the
                        // line above just removed one node from the container.
                        node = startContainer.childVNodes[index];
                    }
                }
            } else if (
                range.mode.is(range.startContainer, RuleProperty.BREAKABLE) &&
                range.mode.is(range.startContainer, RuleProperty.EDITABLE)
            ) {
                // Otherwise set range start at previous valid leaf.
                let ancestor: VNode = range.start.parentVNode;
                while (
                    ancestor &&
                    range.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    range.mode.is(ancestor, RuleProperty.EDITABLE) &&
                    !ancestor.previousSibling()
                ) {
                    ancestor = ancestor.parentVNode;
                }
                if (
                    ancestor &&
                    range.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    range.mode.is(ancestor, RuleProperty.EDITABLE)
                ) {
                    const previousSibling = ancestor.previousSibling();
                    if (previousSibling instanceof AtomicNode) {
                        ancestor.mergeWith(previousSibling.parentVNode);
                    } else {
                        const previousLeaf = previousSibling.lastLeaf();
                        if (previousSibling && !previousSibling.hasChildren()) {
                            // If the previous sibling is empty, remove it.
                            previousSibling.removeBackward();
                        } else if (previousLeaf) {
                            range.setStart(previousLeaf, RelativePosition.AFTER);
                            range.empty();
                        }
                    }
                }
            }
        } else {
            const shouldDeleteLine =
                !range.start.previousSibling() &&
                !range.end.previousSibling() &&
                range.startContainer !== range.endContainer;
            const oldEndContainer = range.endContainer;

            range.empty();

            // This handles the special case of a triple click followed by a
            // backspace: the line should be deleted with its container (no
            // merging).
            if (shouldDeleteLine) {
                range.startContainer.replaceWith(oldEndContainer);
            }
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
                let ancestor: VNode = range.end.parentVNode;
                while (
                    ancestor &&
                    range.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    range.mode.is(ancestor, RuleProperty.EDITABLE) &&
                    !ancestor.nextSibling()
                ) {
                    ancestor = ancestor.parentVNode;
                }
                if (
                    ancestor &&
                    range.mode.is(ancestor, RuleProperty.BREAKABLE) &&
                    range.mode.is(ancestor, RuleProperty.EDITABLE)
                ) {
                    const nextSibling = ancestor.nextSibling();
                    if (nextSibling instanceof AtomicNode) {
                        let next: VNode = nextSibling;
                        while (next && next instanceof AtomicNode) {
                            ancestor.append(next);
                            next = ancestor.nextSibling();
                        }
                    } else {
                        const next = nextSibling.firstLeaf();
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
            }
        } else {
            const shouldDeleteLine =
                !range.start.previousSibling() &&
                !range.end.previousSibling() &&
                range.startContainer !== range.endContainer;
            const oldEndContainer = range.endContainer;

            range.empty();

            // This handles the special case of a triple click followed by a
            // delete: the line should be deleted with its container (no
            // merging).
            if (shouldDeleteLine) {
                range.startContainer.replaceWith(oldEndContainer);
            }
        }
    }
    async deleteWord(params: DeleteWordParams): Promise<void> {
        const range = params.context.range;
        if (params.direction === Direction.FORWARD) {
            const text = Array.from(params.text);
            if (text[text.length - 1] === ' ') {
                // TODO: The normalizer should be able to detect where to put
                // the space according to the range and the removal direction.
                // Make sure to handle a space _before_ the word.
                text.unshift(text.pop());
            }
            let end: VNode = range.end;
            while (end && text.length) {
                const next = end.nextSibling();
                if (next?.textContent === text.shift()) {
                    end = next;
                }
            }
            const context = {
                range: new VRange(this.editor, VRange.selecting(range.start, end), {
                    temporary: true,
                }),
            };
            await params.context.execCommand<Core>('deleteForward', { context });
        } else {
            let start: VNode = range.start;
            const text = Array.from(params.text);
            if (text[0] === ' ') {
                // TODO: The normalizer should be able to detect where to put
                // the space according to the range and the removal direction.
                // Make sure to treat a space _before_ the word.
                text.push(text.shift());
            }
            while (start && text.length) {
                const previous = start.previousSibling();
                if (previous?.textContent === text.pop()) {
                    start = previous;
                }
            }
            const context = {
                range: new VRange(this.editor, VRange.selecting(start, range.end), {
                    temporary: true,
                }),
            };
            await params.context.execCommand<Core>('deleteBackward', { context });
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
