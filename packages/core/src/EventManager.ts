import { EventNormalizer, EventBatch, NormalizedAction } from './EventNormalizer';
import JWEditor from './JWEditor';
import { CommandIdentifier } from './Dispatcher';
import { VSelectionParams } from './CorePlugin';
import { Dom } from '../../plugin-dom/src/Dom';
import { Direction } from './VSelection';

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
            case 'insertHtml':
                if (action.text === '\n') {
                    return ['insertLineBreak', {}];
                } else {
                    return ['insertText', { text: action.text }];
                }
            case 'selectAll':
                return ['selectAll', {}];
            case 'setSelection': {
                const vSelectionParams: VSelectionParams = {
                    vSelection: this.domPlugin.parseSelection(action.domSelection),
                };
                return ['setSelection', vSelectionParams];
            }
            case 'insertParagraphBreak':
                return ['insertParagraphBreak', {}];
            case 'deleteWord':
            case 'deleteContent': {
                if (action.direction === Direction.FORWARD) {
                    return ['deleteForward', {}];
                } else {
                    return ['deleteBackward', {}];
                }
            }
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
    async _onNormalizedEvent(batchPromise: Promise<EventBatch>): Promise<void> {
        return this.editor.nextEventMutex(
            async (): Promise<void> => {
                const batch = await batchPromise;
                let processed = false;
                if (batch.inferredKeydownEvent) {
                    processed = !!(await this.editor.processKeydown(
                        new KeyboardEvent('keydown', {
                            ...batch.inferredKeydownEvent,
                            key: batch.inferredKeydownEvent.key,
                            code: batch.inferredKeydownEvent.code,
                        }),
                    ));
                }
                if (!processed) {
                    for (const action of batch.actions) {
                        const commandSpec = this._matchCommand(action);
                        if (commandSpec) {
                            await this.editor.execCommand(...commandSpec);
                        }
                    }
                }
            },
        );
    }
}
