import { Action, ActionPayload } from '../../../core/actions/Action';
import { Env, Component } from 'owl-framework/src/component/component';

interface ActionsState {
    actions: Action[];
    selectedIndex: number;
}

export class ActionsComponent extends Component<Env, {}, ActionsState> {
    state = {
        actions: [], // Stack of all actions performed since init
        selectedIndex: 0, // Index of the selected action in the stack
    };

    constructor(env: Env) {
        super(env);
        this.env.editor.el.addEventListener('jw-action', (event: CustomEvent) => {
            const action: Action = event.detail;
            this.addAction(action);
        });
    }

    /**
     * Add an action to the stack
     *
     * @param {Action} action
     */
    addAction(action: Action): void {
        this.state.actions.unshift(action);
    }
    /**
     * Handle keydown event to navigate in the action stack
     */
    onKeydown(event: KeyboardEvent): void {
        if (event.code === 'ArrowDown') {
            this.state.selectedIndex += 1;
        } else if (event.code === 'ArrowUp') {
            this.state.selectedIndex -= 1;
        } else {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
    }
    /**
     * Select the action at given index
     *
     * @param {number} index
     */
    selectAction(index: number): void {
        this.state.selectedIndex = index;
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
