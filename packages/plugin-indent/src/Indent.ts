import JWEditor from '../../core/src/JWEditor';
import { JWPlugin } from '../../core/src/JWPlugin';
import { RangeParams } from '../../core/src/CorePlugin';
import { VNode } from '../../core/src/VNodes/VNode';
import { Char, InsertTextParams } from '../../plugin-char/Char';
import { CharNode } from '../../plugin-char/CharNode';
import { LineBreak } from '../../plugin-linebreak/LineBreak';
import { LineBreakNode } from '../../plugin-linebreak/LineBreakNode';
import { withRange, VRange } from '../../core/src/VRange';

export type IndentParams = RangeParams;
export type OutdentParams = RangeParams;

export class Indent extends JWPlugin {
    static dependencies = [Char, LineBreak];
    editor: JWEditor;
    commands = {
        indent: {
            handler: this.indent.bind(this),
        },
        outdent: {
            handler: this.outdent.bind(this),
        },
    };
    tab = '    ';

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Indent text or lines.
     *
     * - If there is more than one line selected in range, indent each lines.
     * - Otherwise, insert 4 spaces.
     */
    indent(params: IndentParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const selectedSegmentBreaks = range.selectedNodes(this._isSegmentBreak);
        // Only indent when there is at leat two lines selected, that is when
        // at least one segment break could be identified in the selection.
        if (selectedSegmentBreaks.length) {
            const segmentBreaks = new Set(selectedSegmentBreaks);
            // The first and last lines are only partially selected, which means
            // their segment break would not be found in `range.selectedNodes`.
            segmentBreaks.add(range.start.ancestor(this._isSegmentBreak));
            segmentBreaks.add(range.end.ancestor(this._isSegmentBreak));
            segmentBreaks.forEach(segmentBreak => {
                // Insert 4 spaces before each character following a line break.
                const firstChar = segmentBreak.next(CharNode);
                withRange(VRange.at(firstChar), startOfLineRange => {
                    const params: InsertTextParams = {
                        text: this.tab,
                        range: startOfLineRange,
                    };
                    this.editor.execCommand('insertText', params);
                });
            });
        } else {
            const params: InsertTextParams = {
                text: this.tab,
                range: range,
            };
            this.editor.execCommand('insertText', params);
        }
    }

    /**
     * Outdent lines.
     *
     * If there is more than one line selected, for each of the lines, remove up
     * to 4 spaces in the beggining of the line.
     */
    outdent(params: OutdentParams): void {
        const range = params.range || this.editor.vDocument.selection.range;
        const selectedSegmentBreaks = range.selectedNodes(this._isSegmentBreak);
        // Only outdent when there is at leat two lines selected, that is when
        // at least one segment break could be identified in the selection.
        if (selectedSegmentBreaks.length) {
            const segmentBreaks = new Set(selectedSegmentBreaks);
            // The first and last lines are only partially selected, which means
            // their segment break would not be found in `range.selectedNodes`.
            segmentBreaks.add(range.start.ancestor(this._isSegmentBreak));
            segmentBreaks.add(range.end.ancestor(this._isSegmentBreak));
            const isSpace = (node: VNode): boolean => {
                return node.is(CharNode) && /^\s$/g.test(node.char);
            };
            segmentBreaks.forEach(segmentBreak => {
                for (let i = 0; i < this.tab.length; i++) {
                    const indentationSpace = segmentBreak.next(isSpace);
                    if (indentationSpace) {
                        indentationSpace.remove();
                    }
                }
            });
        }
    }

    /**
     * Return true if the given VNode can be considered to be a segment break.
     *
     * @param params
     */
    _isSegmentBreak(node: VNode): boolean {
        if (node.hasChildren()) {
            const firstChild = node.firstChild();
            return firstChild && firstChild.is(CharNode);
        } else {
            return node.is(LineBreakNode);
        }
    }
}
