import { JWPlugin, JWPluginConfig } from '../../core/src/JWPlugin';
import { DomLayout } from '../../plugin-dom-layout/src/DomLayout';
import { Direction } from '../../core/src/VSelection';
import { EventNormalizer, EventBatch, NormalizedAction } from './EventNormalizer';
import { CommandIdentifier, PartialCommandParams } from '../../core/src/Dispatcher';
import { InsertTextParams } from '../../plugin-char/src/Char';
import { VSelectionParams } from '../../core/src/Core';
import { Layout } from '../../plugin-layout/src/Layout';
import { DomLayoutEngine } from '../../plugin-dom-layout/src/DomLayoutEngine';
import { JWEditor } from '../../core/src/JWEditor';
import { RelativePosition, VNode } from '../../core/src/VNodes/VNode';
import { VRange } from '../../core/src/VRange';
import { RuleProperty } from '../../core/src/Mode';

export class DomEditable<T extends JWPluginConfig = JWPluginConfig> extends JWPlugin<T> {
    static dependencies = [DomLayout, Layout];
    commands = {
        selectAll: {
            handler: this.selectAll,
        },
    };
    commandHooks = {
        '@commandMatch': this._initNextObservation,
    };

    eventNormalizer: EventNormalizer;

    constructor(editor: JWEditor, configuration: T) {
        super(editor, configuration);
        this._initNextObservation = this._initNextObservation.bind(this);
    }

    async start(): Promise<void> {
        const domLayout = this.dependencies.get(DomLayout);
        this.eventNormalizer = new EventNormalizer(
            domLayout.isInEditable.bind(domLayout),
            this._onNormalizedEvent.bind(this),
            {
                keydown: domLayout.processKeydown,
            },
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
    private _matchCommand(action: NormalizedAction): [CommandIdentifier, PartialCommandParams] {
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
                if (action.direction === Direction.FORWARD) {
                    const text = Array.from(action.text);
                    if (text[text.length - 1] === ' ') {
                        // Make sure to handle a space _before_ the word.
                        text.unshift(text.pop());
                    }
                    let end: VNode = this.editor.selection.range.end;
                    while (end && text.length) {
                        const next = end.nextSibling();
                        if (next?.textContent === text.shift()) {
                            end = next;
                        }
                    }
                    return [
                        'deleteForward',
                        {
                            context: {
                                range: new VRange(
                                    this.editor,
                                    VRange.selecting(this.editor.selection.range.start, end),
                                ),
                            },
                        },
                    ];
                } else {
                    let start: VNode = this.editor.selection.range.start;
                    const text = Array.from(action.text);
                    if (text[0] === ' ') {
                        // Make sure to treat a space _before_ the word.
                        text.push(text.shift());
                    }
                    while (start && text.length) {
                        const previous = start.previousSibling();
                        if (previous?.textContent === text.pop()) {
                            start = previous;
                        }
                    }
                    return [
                        'deleteBackward',
                        {
                            context: {
                                range: new VRange(
                                    this.editor,
                                    VRange.selecting(start, this.editor.selection.range.end),
                                ),
                            },
                        },
                    ];
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
                    const commandSpec = this._matchCommand(action);
                    if (commandSpec) {
                        const [commandName, commandParams] = commandSpec;
                        if (commandName) {
                            await execCommand(commandName, commandParams);
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
    private _initNextObservation(): void {
        this.eventNormalizer.initNextObservation();
    }
}
