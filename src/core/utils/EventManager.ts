import { EventNormalizer, DomRangeDescription } from './EventNormalizer';
import { VRangeDescription, RelativePosition } from '../stores/VRange';
import { VDocumentMap } from './VDocumentMap';
import { VNode, VNodeType } from '../stores/VNode';
import JWEditor from '../JWEditor';

interface SetRangeParams {
    domRange: DomRangeDescription;
}

export class EventManager {
    editor: JWEditor;
    eventNormalizer: EventNormalizer;

    constructor(editor: JWEditor) {
        this.editor = editor;
        this.eventNormalizer = new EventNormalizer(
            editor.editable,
            this._onNormalizedEvent.bind(this),
        );
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Convert the DOM values for a range to set to VRange locations in the
     * CustomEvent's payload.
     *
     * @param range
     */
    _convertRange(range: DomRangeDescription): VRangeDescription {
        const start = this._locate(range.startContainer, range.startOffset);
        const end = this._locate(range.endContainer, range.endOffset);
        const [startVNode, startPosition] = start;
        const [endVNode, endPosition] = end;
        return {
            start: startVNode,
            startPosition: startPosition,
            end: endVNode,
            endPosition: endPosition,
            direction: range.direction,
        };
    }
    /**
     * Return a position in the `VDocument` as a tuple containing a reference
     * node and a relative position with respect to this node ('BEFORE' or
     * 'AFTER'). The position is always given on the leaf.
     *
     * @param container
     * @param offset
     */
    _locate(container: Node, offset: number): [VNode, RelativePosition] {
        // Position `BEFORE` is preferred over `AFTER`, unless the offset
        // overflows the children list, in which case `AFTER` is needed.
        let position = RelativePosition.BEFORE;
        const isTextNode = container.nodeType === Node.TEXT_NODE;
        const content = isTextNode ? container.nodeValue : container.childNodes;
        if (offset >= content.length) {
            position = RelativePosition.AFTER;
            offset = content.length - 1;
        }
        // Move to deepest child of container.
        while (container.hasChildNodes()) {
            container = container.childNodes[offset];
            offset = 0;
        }
        // Get the VNodes matching the container.
        const containers = VDocumentMap.fromDom(container);
        // The reference is the offset-th match (eg.: text split into chars).
        return [containers[offset], position];
    }
    /**
     * Callback given to the normalizer.
     */
    _onNormalizedEvent(customEvent: CustomEvent): void {
        const payload = customEvent.detail;
        switch (customEvent.type) {
            case 'enter':
                if (customEvent.detail.shiftKey) {
                    return this.editor.execCommand('insert', {
                        value: new VNode(VNodeType.LINE_BREAK, 'BR'),
                    });
                } else {
                    return this.editor.execCommand('insertParagraphBreak');
                }
            case 'selectAll':
            case 'setRange': {
                const rangeParams = payload as SetRangeParams;
                return this.editor.execCommand(customEvent.type, {
                    vRange: this._convertRange(rangeParams.domRange),
                });
            }
            case 'keydown': {
                // TODO: keydown should be matched with existing shortcuts. If
                // it matches an command shortcut, trigger the corresponding
                // command, otherwise do not trigger any command.
                if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'b'
                ) {
                    return this.editor.execCommand('applyFormat', { format: 'bold' });
                } else if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'i'
                ) {
                    return this.editor.execCommand('applyFormat', { format: 'italic' });
                } else if (
                    payload.ctrlKey &&
                    !payload.altKey &&
                    !payload.shiftKey &&
                    !payload.metaKey &&
                    payload.key === 'u'
                ) {
                    return this.editor.execCommand('applyFormat', { format: 'underline' });
                }
                // TODO: keydown should be matched with existing shortcuts.
                return;
            }
            default:
                this.editor.execCommand(customEvent.type, payload);
        }
    }
}
