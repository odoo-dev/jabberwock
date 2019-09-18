import { OwlUIComponent } from '../../../ui/OwlUIComponent';
import { HandlerToken, DispatcherRegistry } from '../../../core/dispatcher/Dispatcher';

interface ActionsState {
    actions: Action[]; // Stack of all actions performed since init
    currentTab: string;
    registry: DispatcherRegistry;
    selectedActionIndex: number | null;
    selectedHandlerToken: HandlerToken | null;
    selectedActionIdentifier: ActionIdentifier | null;
}

export class ActionsComponent extends OwlUIComponent<{}, ActionsState> {
    state: ActionsState = {
        actions: [], // Stack of all actions performed since init
        currentTab: 'selected',
        registry: this.env.editor.dispatcher.registry,
        selectedActionIndex: null, // Index of the selected action in the stack
        selectedHandlerToken: null, // Token of the selected handler
        selectedActionIdentifier: null, // ID of the selected registry record
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
     * Take a payload value and format it for display (mostly to ensure that
     * we can display it properly as a string).
     *
     * @param {object|string|boolean|number} value
     * @returns {string}
     */
    formatPayloadValue(value: object | string | boolean | number): string {
        if (value && value['nodeName']) {
            return '<' + value['nodeName'].toLowerCase() + '>';
        }
        switch (value) {
            case true:
                return 'true';
            case false:
                return 'false';
            case null:
                return 'null';
            case 0:
                return '0';
            case undefined:
                return 'undefined';
            default:
                return '' + value;
        }
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
        this.state.selectedActionIdentifier = id;
        // Automatically select the first handler of the record, if any.
        const ids: ActionIdentifier[] = Object.keys(this.state.registry[id] || {});
        this.selectHandler(ids[0] || null);
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
