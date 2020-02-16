import JWEditor from '../../core/src/JWEditor';
import { JWPlugin } from '../../core/src/JWPlugin';
import { RangeParams } from '../../core/src/CorePlugin';
import { VNode, RelativePosition, Point } from '../../core/src/VNodes/VNode';
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
    async indent(params: IndentParams): Promise<void> {
        const range = params.range || this.editor.vDocument.selection.range;
        const segmentBreaks = range.traversedNodes(this._isSegmentBreak);
        // Only indent when there is at leat two lines selected, that is when
        // at least one segment break could be identified in the selection.
        if (range.isCollapsed() || !segmentBreaks.length) {
            const params: InsertTextParams = {
                text: this.tab,
                range: range,
            };
            await this.editor.execCommand('insertText', params);
        } else {
            // The first line of the selection is neither fully selected nor
            // traversed so its segment break was not in `range.traversedNodes`.
            segmentBreaks.unshift(range.start.previous(this._isSegmentBreak));
            for (const segmentBreak of segmentBreaks) {
                // Insert 4 spaces at the start of next segment.
                const [node, position] = this._nextSegmentStart(segmentBreak);
                await withRange(VRange.at(node, position), async range => {
                    const params: InsertTextParams = {
                        text: this.tab,
                        range: range,
                    };
                    await this.editor.execCommand('insertText', params);
                });
            }
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
        const segmentBreaks = range.traversedNodes(this._isSegmentBreak);
        // The first line of the selection is neither fully selected nor
        // traversed so its segment break was not in `range.traversedNodes`.
        segmentBreaks.unshift(range.start.previous(this._isSegmentBreak));
        // Only outdent when there is at leat two lines selected, that is when
        // at least one segment break could be identified in the selection.
        if (segmentBreaks.length) {
            segmentBreaks.forEach(segmentBreak => {
                for (let i = 0; i < this.tab.length; i++) {
                    const space = this._nextIndentationSpace(segmentBreak);
                    if (space) {
                        space.remove();
                    }
                }
            });
        }
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Return true if the given VNode can be considered to be a segment break.
     *
     * @param params
     */
    _isSegmentBreak(node: VNode): boolean {
        return !node.atomic || node.is(LineBreakNode);
    }
    /**
     * Return the next segment start point after the given segment break.
     *
     * @param segmentBreak
     */
    _nextSegmentStart(segmentBreak: VNode): Point {
        let reference = segmentBreak;
        let position = RelativePosition.BEFORE;
        if (segmentBreak.atomic) {
            reference = segmentBreak.nextSibling();
        } else if (segmentBreak.hasChildren()) {
            reference = segmentBreak.firstChild();
        } else {
            position = RelativePosition.INSIDE;
        }
        return [reference, position];
    }
    /**
     * Return true if the given VNode is a CharNode containing a space.
     *
     * @param node
     */
    _isSpace(node: VNode): boolean {
        return node.is(CharNode) && /^\s$/g.test(node.char);
    }
    /**
     * Return true if the given VNode can be considered to be a segment break.
     *
     * @param segmentBreak
     */
    _nextIndentationSpace(segmentBreak: VNode): VNode {
        let space: VNode;
        if (segmentBreak.atomic) {
            space = segmentBreak.nextSibling();
        } else {
            space = segmentBreak.firstChild();
        }
        return space && space.test(this._isSpace) && space;
    }
}
