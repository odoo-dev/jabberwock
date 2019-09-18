import { OwlUIComponent } from '../../../ui/OwlUIComponent';
import { HandlerToken, DispatcherRegistry } from '../../../core/dispatcher/Dispatcher';

interface ActionsState {
    actions: Action[]; // Stack of all actions performed since init
    currentTab: string;
    registry: DispatcherRegistry;
    selectedActionIndex: number;
    selectedHandlerToken: HandlerToken | null;
    selectedRegistryRecordID: ActionIdentifier;
}

export class ActionsComponent extends OwlUIComponent<{}, ActionsState> {
    state: ActionsState = {
        actions: [], // Stack of all actions performed since init
        currentTab: 'selected',
        registry: this.env.editor.dispatcher.registry,
        selectedActionIndex: null, // Index of the selected action in the stack
        selectedHandlerToken: null,
        selectedRegistryRecordID: null, // Index of the selected registry record
    };
    localStorage = ['currentTab'];

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
        return this.env.editor.dispatcher._getHandler(handlerToken);
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
     * @param {string} tabName
     */
    openTab(tabName: string): void {
        this.state.currentTab = tabName;
    }
    /**
     * Select the action at given index
     *
     * @param {number} index
     */
    selectAction(index: number): void {
        this.state.selectedActionIndex = index;
        const action: Action = this.state.actions[index];
        this.selectRegistryRecord((action && action.id) || null);
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
    selectRegistryRecord(id: ActionIdentifier | null): void {
        this.state.selectedRegistryRecordID = id;
        // Automatically select the first handler of the record, if any.
        if (this.state.registry[id] && Object.keys(this.state.registry[id]).length) {
            this.selectHandler(Object.keys(this.state.registry[id])[0]);
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
}
