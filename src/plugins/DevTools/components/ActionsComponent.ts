import { ActionPayload, ActionHandler, Action } from '../../../core/types/Flux';
import { OwlUIComponent } from '../../../ui/JWOwlUIPlugin';
import { HandlerToken, DispatcherRegistryRecord } from '../../../core/dispatcher/Dispatcher';
import { VNode } from '../../../core/stores/VNode';

interface ActionsState {
    actions: Action[]; // Stack of all actions performed since init
    openTab: 'selected' | 'registry';
    registry: DispatcherRegistryRecord[];
    selectedActionIndex: number;
    selectedHandlerToken: HandlerToken | null;
    selectedRegistryRecordIndex: number;
}

export class ActionsComponent extends OwlUIComponent {
    state: ActionsState = {
        actions: [], // Stack of all actions performed since init
        openTab: 'selected',
        registry: this.env.editor.dispatcher.registry,
        selectedActionIndex: null, // Index of the selected action in the stack
        selectedHandlerToken: null,
        selectedRegistryRecordIndex: null, // Index of the selected registry record
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add an action to the stack
     *
     * @param {Action} action
     */
    addAction(action: Action): void {
        this.state.actions.unshift(action);
        this.selectAction(0);
    }
    /**
     * Return the action handler corresponding to the given token.
     *
     * @param {HandlerToken} handlerToken
     * @returns {ActionHandler|null}
     */
    getHandler(handlerToken: HandlerToken): ActionHandler | null {
        const record = this.state.registry.find((record: DispatcherRegistryRecord): boolean => {
            return !!record.handlers[handlerToken];
        });
        return (record && record.handlers[handlerToken]) || null;
    }
    /**
     * Log an `ActionHandler` to the console.
     *
     * @param {ActionHandler} handler
     */
    logHandler(handler: ActionHandler): void {
        console.log(handler);
    }
    /**
     * Handle keydown event to navigate in the action stack
     */
    onKeydown(event: KeyboardEvent): void {
        if (event.code === 'ArrowDown') {
            this.state.selectedActionIndex += 1;
        } else if (event.code === 'ArrowUp') {
            this.state.selectedActionIndex -= 1;
        } else {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
    }
    /**
     * Open the tab with the given `tabName`
     *
     * @param {'selected' | 'registry'} tabName
     */
    openTab(tabName: 'selected' | 'registry'): void {
        this.state.openTab = tabName;
    }
    /**
     * Select the action at given index
     *
     * @param {number} index
     */
    selectAction(index: number): void {
        this.state.selectedActionIndex = index;
        const action: Action = this.state.actions[index];
        const correspondingRecordID: number | null = action
            ? this._getRegistryRecordIndex(action)
            : null;
        this.selectRegistryRecord(correspondingRecordID);
    }
    /**
     * Select the action handler corresponding to the given token.
     *
     * @param {HandlerToken|null} handlerToken
     */
    selectHandler(handlerToken: HandlerToken | null): void {
        this.state.selectedHandlerToken = handlerToken;
    }
    /**
     * Select the registry record at given index
     *
     * @param {number|null} index
     */
    selectRegistryRecord(index: number | null): void {
        this.state.selectedRegistryRecordIndex = index;
        if (this.state.registry[index] && Object.keys(this.state.registry[index].handlers).length) {
            this.selectHandler(Object.keys(this.state.registry[index].handlers)[0]);
        } else {
            this.selectHandler(null);
        }
    }
    /**
     * Stringify an `ActionPayload`
     *
     * @param value ActionPayload
     */
    valueToString(value: ActionPayload): string {
        return value ? JSON.stringify(value) : '';
    }
    /**
     * Open the Inspector tab and select the given VNode to view it.
     *
     * @param {VNode} vNode
     */
    viewNode(vNode: VNode): void {
        this.trigger('open-tab', {
            tabName: 'inspector',
        });
        this.trigger('node-selected', {
            vNode: vNode,
        });
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Find an action in the dispatcher registry and return its index in the
     * stack (`state.registry`) or `null` if it couldn't be found.
     *
     * @param {Action} action
     * @returns {number|null}
     */
    _getRegistryRecordIndex(action: Action): number | null {
        // TODO: manage the 3 types of action (intent/primitive/composite instead of intent/action)
        const type =
            action.type === 'primitive' || action.type === 'composite' ? 'action' : 'intent';
        const id = this.state.registry.findIndex((record: DispatcherRegistryRecord): boolean => {
            return record.type === type && record.name === action.name;
        });
        return id === -1 ? null : id;
    }
}
