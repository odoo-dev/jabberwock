import JWEditor, { Loadables } from '../../core/src/JWEditor';
import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { CommandParams } from '../../core/src/Dispatcher';
import { VNode, RelativePosition, Point } from '../../core/src/VNodes/VNode';
import { Char } from '../../plugin-char/src/Char';
import { CharNode } from '../../plugin-char/src/CharNode';
import { LineBreak } from '../../plugin-linebreak/src/LineBreak';
import { LineBreakNode } from '../../plugin-linebreak/src/LineBreakNode';
import { withRange, VRange } from '../../core/src/VRange';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { ContainerNode } from '../../core/src/VNodes/ContainerNode';
import { AtomicNode } from '../../core/src/VNodes/AtomicNode';
import { Layout } from '../../plugin-layout/src/Layout';
import { ActionableNode } from '../../plugin-layout/src/ActionableNode';
import { Attributes } from '../../plugin-xml/src/Attributes';

export type IndentParams = CommandParams;
export type OutdentParams = CommandParams;

export class Indent<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [Char, LineBreak];
    editor: JWEditor;
    commands = {
        indent: {
            title: 'Indent chars',
            handler: this.indent,
        },
        outdent: {
            title: 'Outdent chars',
            handler: this.outdent,
        },
    };
    loadables: Loadables<Keymap & Layout> = {
        shortcuts: [
            {
                pattern: 'TAB',
                commandId: 'indent',
            },
            {
                pattern: 'SHIFT+TAB',
                commandId: 'outdent',
            },
        ],
        components: [
            {
                id: 'IndentButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'indent',
                        label: 'Indent',
                        commandId: 'indent',
                        modifiers: [new Attributes({ class: 'fa fa-indent fa-fw' })],
                    });
                    return [button];
                },
            },
            {
                id: 'OutdentButton',
                async render(): Promise<ActionableNode[]> {
                    const button = new ActionableNode({
                        name: 'outdent',
                        label: 'Outdent',
                        commandId: 'outdent',
                        modifiers: [new Attributes({ class: 'fa fa-outdent fa-fw' })],
                    });
                    return [button];
                },
            },
        ],
        componentZones: [
            ['IndentButton', 'actionables'],
            ['OutdentButton', 'actionables'],
        ],
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
        const range = params.context.range;
        const segmentBreaks = range.traversedNodes(this._isSegmentBreak);
        // Only indent when there is at leat two lines selected, that is when
        // at least one segment break could be identified in the selection.
        if (range.isCollapsed() || !segmentBreaks.length) {
            await this.editor.execCommand<Char>('insertText', {
                text: this.tab,
                context: {
                    range: range,
                },
            });
        } else {
            // The first line of the selection is neither fully selected nor
            // traversed so its segment break was not in `range.traversedNodes`.
            const nextSegmentBreak = range.start.previous(this._isSegmentBreak);
            if (nextSegmentBreak) {
                segmentBreaks.unshift(nextSegmentBreak);
            }
            for (const segmentBreak of segmentBreaks) {
                // Insert 4 spaces at the start of next segment.
                const [node, position] = this._nextSegmentStart(segmentBreak);
                await withRange(VRange.at(node, position), async range => {
                    await this.editor.execCommand<Char>('insertText', {
                        text: this.tab,
                        context: {
                            range: range,
                        },
                    });
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
        const range = params.context.range;
        const segmentBreaks = range.traversedNodes(this._isSegmentBreak);
        // The first line of the selection is neither fully selected nor
        // traversed so its segment break was not in `range.traversedNodes`.
        const previousSegmentBreak = range.start.previous(this._isSegmentBreak);
        if (previousSegmentBreak) {
            segmentBreaks.unshift(previousSegmentBreak);
        }
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
        return node.is(ContainerNode) || node.is(LineBreakNode);
    }
    /**
     * Return the next segment start point after the given segment break.
     *
     * @param segmentBreak
     */
    _nextSegmentStart(segmentBreak: VNode): Point {
        let reference = segmentBreak;
        let position = RelativePosition.BEFORE;
        if (segmentBreak.is(AtomicNode)) {
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
        if (segmentBreak.is(AtomicNode)) {
            space = segmentBreak.nextSibling();
        } else {
            space = segmentBreak.firstChild();
        }
        return space && space.test(this._isSpace) && space;
    }
}
