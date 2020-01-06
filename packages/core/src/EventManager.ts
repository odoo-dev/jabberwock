import { EventNormalizer, EventBatch, NormalizedAction } from './EventNormalizer';
import { Parser } from './Parser';
import { VNode, VNodeType } from './VNode';
import JWEditor from './JWEditor';
import { CommandIdentifier } from './Dispatcher';
import { CommandArgs } from './Dispatcher';
import { Direction } from './VRange';

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
     * Callback given to the normalizer.
     */
    _matchCommand(action: NormalizedAction): [CommandIdentifier, CommandArgs] {
        switch (action.type) {
            case 'insertText':
                return ['insertText', { value: action.text }];
            case 'insertParagraph':
                return ['insertParagraphBreak', {}];
            case 'selectAll':
            case 'setRange':
                // This is wrong in case the normalizer provide a range in the DOM that is not
                // present in the VDocument. 
                return ['setRange', { vRange: Parser.parseRange(action.domRange) }];
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
        this.editor.execBatch(execCommand => {
            batch.events.forEach(ev => {
                ev.actions.forEach(action => {
                    const commandSpec = this._matchCommand(action);
                    if (commandSpec) {
                        execCommand(...commandSpec);
                    }
                });
            });
        });
    }
}
