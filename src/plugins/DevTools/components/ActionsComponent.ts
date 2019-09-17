import { ActionPayload } from '../../../core/types/Flux';
import { OwlUIComponent } from '../../../ui/JWOwlUIPlugin';

interface ActionsState {
    selectedIndex: number;
}

export class ActionsComponent extends OwlUIComponent {
    state: ActionsState = {
        selectedIndex: 0, // Index of the selected action in the stack
    };

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
