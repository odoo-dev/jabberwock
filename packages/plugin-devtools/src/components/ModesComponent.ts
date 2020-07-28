import { OwlComponent } from '../../../plugin-owl/src/OwlComponent';
import { Predicate } from '../../../core/src/VNodes/VNode';

export class ModesComponent extends OwlComponent<{}> {
    modes = this.env.editor.modes;
    localStorage = ['currentTab'];
    state = {
        selectedMode: null,
        currentMode: this.env.editor.mode,
    };

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Select the mode at given index.
     *
     * @param index
     */
    selectModeByIndex(index: number): void {
        this.state.selectedMode = this.modes[Object.keys(this.modes)[index]];
    }
    /**
     * Select the mode with given identifier.
     *
     * @param modeIdentifier
     */
    selectMode(modeIdentifier: string): void {
        this.state.selectedMode = this.modes[modeIdentifier];
    }
    /**
     * Handle keydown event to navigate in the modes list.
     */
    onKeydown(event: KeyboardEvent): void {
        const modeIdentifiers = Object.keys(this.modes);
        const currentModeIndex = modeIdentifiers.findIndex(
            key => key === this.state.selectedMode.id,
        );
        if (event.code === 'ArrowDown') {
            this.selectModeByIndex(Math.min(currentModeIndex + 1, modeIdentifiers.length - 1));
        } else if (event.code === 'ArrowUp') {
            this.selectModeByIndex(Math.max(currentModeIndex - 1, 0));
        } else {
            return;
        }
        event.preventDefault();
        event.stopImmediatePropagation();
    }
    setMode(modeIdentifier: string): void {
        this.env.editor.setMode(modeIdentifier);
        this.state.currentMode = this.env.editor.mode;
    }
    /**
     * Log a selector to the console.
     *
     * @param selector
     */
    logSelector(selector: Predicate[]): void {
        console.log(selector);
    }
}
