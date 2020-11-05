import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Direction } from '../../core/src/VSelection';
import { EventNormalizer, EventBatch, NormalizedAction } from './EventNormalizer';
import { CommandIdentifier, CommandParams } from '../../core/src/Dispatcher';
import { InsertTextParams } from '../../plugin-char/src/Char';
import { VSelectionParams, DeleteWordParams } from '../../core/src/Core';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { RelativePosition } from '../../core/src/VNodes/VNode';
import { JWEditor } from '../../core/src/JWEditor';
import { RuleProperty } from '../../core/src/Mode';

export class DomEditable<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [DomLayout, Layout];
    commands = {
        selectAll: {
            handler: this.selectAll,
        },
    };
    commandHooks = {
        '@preKeydownCommand': this._onPreKeydownCommand,
    };

    eventNormalizer: EventNormalizer;

    constructor(editor: JWEditor, configuration: T) {
        super(editor, configuration);
        this._onPreKeydownCommand = this._onPreKeydownCommand.bind(this);
    }

    async start(): Promise<void> {
        const domLayout = this.dependencies.get(DomLayout);
        this.eventNormalizer = new EventNormalizer(
            domLayout.isInEditable.bind(domLayout),
            domLayout.isInEditor.bind(domLayout),
            this._onNormalizedEvent.bind(this),
        );
    }
    async stop(): Promise<void> {
        this.eventNormalizer.destroy();
        return super.stop();
    }

    /**
     * Update the selection in such a way that it selects the entire document.
     *
     * @param params
     */
    selectAll(): void {
        const unbreakableAncestor = this.editor.selection.range.start.ancestor(
            node => !this.editor.mode.is(node, RuleProperty.BREAKABLE),
        );
        const domEngine = this.dependencies.get(Layout).engines.dom;
        const editable = domEngine.components.editable[0];
        this.editor.selection.set({
            anchorNode: unbreakableAncestor?.firstLeaf() || editable.firstLeaf(),
            anchorPosition: RelativePosition.BEFORE,
            focusNode: unbreakableAncestor?.lastLeaf() || editable.lastLeaf(),
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
    private _matchCommand(action: NormalizedAction): [CommandIdentifier, CommandParams] {
        switch (action.type) {
            case 'insertLineBreak':
                return ['insertLineBreak', {}];
            case 'insertText':
            case 'insertHtml': {
                const params: InsertTextParams = { text: action.text };
                return ['insertText', params];
            }
            case 'selectAll': {
                const domLayout = this.dependencies.get(DomLayout);
                return domLayout.focusedNode ? ['selectAll', {}] : null;
            }
            case 'setSelection': {
                const layout = this.dependencies.get(Layout);
                const domLayoutEngine = layout.engines.dom as DomLayoutEngine;
                const vSelection = domLayoutEngine.parseSelection(action.domSelection);
                if (vSelection) {
                    const vSelectionParams: VSelectionParams = { vSelection };
                    return ['setSelection', vSelectionParams];
                } else {
                    return;
                }
            }
            case 'insertParagraphBreak':
                return ['insertParagraphBreak', {}];
            case 'deleteHardLine': // deleteHardline can be simply handled by deleteWord.
            case 'deleteWord': {
                const params: DeleteWordParams = {
                    direction: action.direction,
                    text: action.text,
                };
                return ['deleteWord', params];
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
        await this.editor.nextEventMutex(async execCommand => {
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
                    { execCommand },
                ));
            }
            if (!processed) {
                for (const action of batch.actions) {
                    if (action.type === '@redraw') {
                        domEngine.markForRedraw(action.domNodes);
                        await domEngine.redraw();
                    } else {
                        const commandSpec = this._matchCommand(action);
                        if (commandSpec) {
                            const [commandName, commandParams] = commandSpec;
                            if (commandName) {
                                await execCommand(commandName, commandParams);
                            }
                        }
                    }
                }
            }
        });
    }
    /**
     * When a new event is triggered by a keypress, we need to init a new
     * observation to make chain of event properly.
     */
    private _onPreKeydownCommand(): void {
        this.eventNormalizer.processEventTimeouts();
    }
}
