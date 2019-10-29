import { LineBreakNode } from './../../plugin-linebreak/LineBreakNode';
import { EventNormalizer, EventBatch, NormalizedAction } from './EventNormalizer';
import JWEditor from './JWEditor';
import { CommandIdentifier } from './Dispatcher';
import { VSelectionParams } from './CorePlugin';
import { Dom } from '../../plugin-dom/src/Dom';

export class EventManager {
    editor: JWEditor;
    domPlugin: Dom;
    eventNormalizer: EventNormalizer;

    constructor(editor: JWEditor, domPlugin: Dom) {
        this.editor = editor;
        this.domPlugin = domPlugin;
        this.eventNormalizer = new EventNormalizer(
            domPlugin.editable,
            this._onNormalizedEvent.bind(this),
        );
    }
    stop(): void {
        this.eventNormalizer.destroy();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _matchCommand(action: NormalizedAction): [CommandIdentifier, object] {
        switch (action.type) {
            case 'insertText':
                return ['insertText', { text: action.text }];
            case 'insertLineBreak':
                return ['insert', { value: new LineBreakNode() }];
            case 'insertParagraph':
                return ['insertParagraphBreak', {}];
            case 'selectAll':
            case 'setSelection': {
                const vSelectionParams: VSelectionParams = {
                    vSelection: this.domPlugin.parseSelection(action.domSelection),
                };
                return ['setSelection', vSelectionParams];
            }
            case 'deleteContent':
                return [action.direction === 'forward' ? 'deleteForward' : 'deleteBackward', {}];
            case 'applyFormat':
                return ['applyFormat', { format: action.format }];
            default:
                break;
        }
    }
    /**
     * Handle the received signal and dispatch the corresponding editor command,
     * based on the user's configuration and context.
     *
     * @param action
     */
    _onNormalizedEvent(batch: EventBatch): void {
        for (const ev of batch.events) {
            for (const action of ev.actions) {
                const commandSpec = this._matchCommand(action);
                if (commandSpec) {
                    this.editor.execCommand(...commandSpec);
                }
            }
        }
    }
}
