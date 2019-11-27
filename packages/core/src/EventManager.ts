import { EventNormalizer, EventBatch, NormalizedAction } from './EventNormalizer';
import JWEditor from './JWEditor';
import { CommandIdentifier } from './Dispatcher';
import { VSelectionParams } from './CorePlugin';
import { Dom } from '../../plugin-dom/Dom';
import { Direction } from './VSelection';

export class EventManager {
    editor: JWEditor;
    domPlugin: Dom;
    eventNormalizer: EventNormalizer;

    constructor(editor: JWEditor, domPlugin: Dom) {
        this.editor = editor;
        this.domPlugin = domPlugin;
        this.eventNormalizer = new EventNormalizer(
            editor.editable,
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
                if (action.text === '\n') {
                    return ['insertLineBreak', {}];
                } else {
                    return ['insertText', { text: action.text }];
                }
            case 'selectAll':
            case 'setSelection': {
                // Todo: This is wrong in case the normalizer provide a range in the DOM that is not
                //       present in the VDocument.
                const vSelectionParams: VSelectionParams = {
                    vSelection: this.domPlugin.parseSelection(action.domSelection),
                };
                return ['setSelection', vSelectionParams];
            }
            case 'insertParagraph':
                return ['insertParagraphBreak', {}];
            case 'deleteWord':
            case 'deleteContent':
                return [
                    action.direction === Direction.FORWARD ? 'deleteForward' : 'deleteBackward',
                    {},
                ];
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
        for (const action of batch.actions) {
            const commandSpec = this._matchCommand(action);
            if (commandSpec) {
                this.editor.execCommand(...commandSpec);
            }
        }
    }
}
