import { JWPlugin } from '../JWPlugin';
import JWEditor from '../JWEditor';
import { RelativePosition, VRangeDescription, Direction } from '../stores/VRange';
import { InsertIntent, RangeIntent, FormatIntent, FormatParagraphIntent } from '../types/Intents';
import { isLeaf } from './Predicates';

export class CorePlugin extends JWPlugin {
    editor: JWEditor;
    handlers = {
        intents: {
            insert: 'insert',
            deleteBackward: 'deleteBackward',
            deleteForward: 'deleteForward',
            setRange: 'navigate',
            selectAll: 'selectAll',
            applyFormat: 'applyFormat',
            formatParagraph: 'formatParagraph',
        },
    };
    commands = {
        deleteBackward: this.deleteBackward.bind(this),
        deleteForward: this.deleteForward.bind(this),
        insert: this.insert.bind(this),
        navigate: this.navigate.bind(this),
        selectAll: this.selectAll.bind(this),
        applyFormat: this.applyFormat.bind(this),
        formatParagraph: this.formatParagraph.bind(this),
    };
    constructor(editor) {
        super(editor.dispatcher);
        this.editor = editor;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Insert something at range.
     *
     * @param intent
     */
    insert(intent: InsertIntent): void {
        // TODO: check the intent to insert other things than text.
        this.editor.vDocument.insertText(intent.payload.value);
    }
    /**
     * Command to apply the format.
     */
    applyFormat(intent: FormatIntent): void {
        this.editor.vDocument.applyFormat(intent.payload.format);
    }
    /**
     * Delete in the backward direction (backspace key expected behavior).
     */
    deleteBackward(): void {
        const range = this.editor.vDocument.range;
        if (range.isCollapsed()) {
            const previous = range.start.previous();
            if (previous) {
                range.extendTo(previous, Direction.BACKWARD);
            }
        }
        this.editor.vDocument.deleteSelection();
    }
    /**
     * Delete in the forward direction (delete key expected behavior).
     */
    deleteForward(): void {
        const range = this.editor.vDocument.range;
        if (range.isCollapsed()) {
            const next = range.end.next();
            if (next) {
                range.extendTo(next, Direction.FORWARD);
            }
        }
        this.editor.vDocument.deleteSelection();
    }
    /**
     * Navigate to a given Range (in the payload of the Intent).
     *
     * @param intent
     */
    navigate(intent: RangeIntent): void {
        const range: VRangeDescription = intent.payload.vRange;
        this.editor.vDocument.range.set(range);
        // Each time the range changes, we reset its format.
        this.editor.vDocument.formatCache = null;
    }

    /**
     * Update the range such that it selects the entire document.
     *
     * @param intent
     */
    selectAll(intent: RangeIntent): void {
        this.editor.vDocument.range.set({
            start: this.editor.vDocument.root.firstLeaf(),
            startPosition: RelativePosition.BEFORE,
            end: this.editor.vDocument.root.lastLeaf(),
            endPosition: RelativePosition.AFTER,
            direction: intent.payload.vRange.direction,
        });
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
    formatParagraph(intent: FormatParagraphIntent): void {
        const type = intent.payload.value;
        const range = this.editor.vDocument.range;
        if (range.isCollapsed()) {
            range.select();
        }
        // TODO: This is very naive. We might want to have something like:
        // node.closest(predicate) here rather than doing this in order to only
        // select the parents that are compatible with the type change.
        const selectedContainers = new Set(
            range.selectedNodes.filter(isLeaf).map(node => node.parent),
        );
        selectedContainers.forEach(parent => {
            // TODO: this suffices for the moment, but it will not be enough
            // anymore once we introduce the VNode class extensions.
            parent.type = type;
        });
    }
}
