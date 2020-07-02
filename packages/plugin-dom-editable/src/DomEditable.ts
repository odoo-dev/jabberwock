import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Direction } from '../../core/src/VSelection';
import { EventNormalizer, EventBatch, NormalizedAction } from './EventNormalizer';
import { CommandIdentifier } from '../../core/src/Dispatcher';
import { InsertTextParams } from '../../plugin-char/src/Char';
import { VSelectionParams } from '../../core/src/Core';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { JWEditor } from '../../core/src/JWEditor';
import { RelativePosition } from '../../core/src/VNodes/VNode';

export class DomEditable<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [DomLayout, Layout];
    commands = {
        selectAll: {
            handler: this.selectAll,
        },
    };

    eventNormalizer: EventNormalizer;

    constructor(editor: JWEditor, configuration: T) {
        super(editor, configuration);
        this._processKeydown = this._processKeydown.bind(this);
    }

    async start(): Promise<void> {
        const domLayout = this.dependencies.get(DomLayout);
        this.eventNormalizer = new EventNormalizer(
            domLayout.isInEditable.bind(domLayout),
            this._onNormalizedEvent.bind(this),
        );

        window.addEventListener('keydown', this._processKeydown);
    }
    async stop(): Promise<void> {
        this.eventNormalizer.destroy();
        window.removeEventListener('keydown', this._processKeydown);
    }

    /**
     * Update the selection in such a way that it selects the entire document.
     *
     * @param params
     */
    selectAll(): void {
        const domEngine = this.dependencies.get(Layout).engines.dom;
        const editable = domEngine.components.get('editable')[0];
        this.editor.selection.set({
            anchorNode: editable.firstLeaf(),
            anchorPosition: RelativePosition.BEFORE,
            focusNode: editable.lastLeaf(),
            focusPosition: RelativePosition.AFTER,
            direction: Direction.FORWARD,
        });
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Handle the received signal and dispatch the corresponding editor command,
     * based on the user's configuration and context.
     *
     * @param action
     */
    private _matchCommand(action: NormalizedAction): [CommandIdentifier, object] {
        switch (action.type) {
            case 'insertLineBreak':
                return ['insertLineBreak', {}];
            case 'insertText':
            case 'insertHtml': {
                const params: InsertTextParams = { text: action.text };
                return ['insertText', params];
            }
            case 'selectAll':
                return ['selectAll', {}];
            case 'setSelection': {
                const layout = this.dependencies.get(Layout);
                const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
                const vSelectionParams: VSelectionParams = {
                    vSelection: domLayoutEngine.parseSelection(action.domSelection),
                };
                return ['setSelection', vSelectionParams];
            }
            case 'insertParagraphBreak':
                return ['insertParagraphBreak', {}];
            case 'deleteWord':
                // TODO: extract range
                if (action.direction === Direction.FORWARD) {
                    return ['deleteForward', { range: {} }];
                } else {
                    return ['deleteBackward', { range: {} }];
                }
            case 'deleteContent': {
                if (action.direction === Direction.FORWARD) {
                    return ['deleteForward', {}];
                } else {
                    return ['deleteBackward', {}];
                }
            }
            default:
                break;
        }
    }
    /**
     * Handle the received signal and dispatch the corresponding editor command,
     * based on the user's configuration and context.
     *
     * @param batchPromise
     */
    async _onNormalizedEvent(batchPromise: Promise<EventBatch>): Promise<void> {
        return this.editor.nextEventMutex(
            async (): Promise<void> => {
                const batch = await batchPromise;
                const domEngine = this.dependencies.get(Layout).engines.dom as DomLayoutEngine;
                if (batch.mutatedElements) {
                    domEngine.markForRedraw(batch.mutatedElements);
                }
                let processed = false;
                if (batch.inferredKeydownEvent) {
                    const domLayout = this.dependencies.get(DomLayout);
                    processed = !!(await domLayout.processKeydown(
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
    /**
     * In DomLayout, KeyboardEvent listener to be added to the DOM that calls
     * `execCommand` if the keys pressed match one of the shortcut registered
     * in the keymap.
     * In case of the keydow are defaultPrevented it's means we executed a new
     * command. We split the event agragation of normalizer to ensure to have
     * the next execCommand at the right time.
     *
     * @param event
     */
    private _processKeydown(event: KeyboardEvent): void {
        if (event.defaultPrevented) {
            this.eventNormalizer.initNextObservation();
        }
    }
}
