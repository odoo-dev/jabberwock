import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { CommandIdentifier, CommandArgs } from '../../../core/src/Dispatcher';
import { ToolbarConfig, Button, ToolbarItem } from '../../../core/src/JWEditor';

export class ToolbarComponent extends OwlUIComponent<{}> {
    static components = {};
    static template = 'toolbar';
    config: ToolbarConfig = this.env.editor.toolbarConfig;
    buttons = this._listButtons();
    selected = new Map(this.buttons.map(button => [button, false]));

    async willStart(): Promise<void> {
        this.env.editor.registerCommandHook('*', this.refresh.bind(this));
        return super.willStart();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    execCommand(commandId: CommandIdentifier, commandArgs?: CommandArgs): void {
        this.env.editor.execCommand(commandId, commandArgs);
    }
    async isEnabled(item: Button): Promise<boolean> {
        return !item.enabled || item.enabled(this.env.editor);
    }
    isSelected(item: Button): boolean {
        return this.selected.get(item);
    }
    isArray(item: ToolbarItem): boolean {
        return Array.isArray(item);
    }
    isString(item: ToolbarItem): boolean {
        return typeof item === 'string';
    }
    onDropdownChange(dropdown: Button, event: Event): void {
        const selectedIndex = (event.target as HTMLSelectElement).selectedIndex;
        // -1 to account for the mandatory empty option on top:
        const dropdownItem = dropdown[selectedIndex - 1];
        if (dropdownItem) {
            this.execCommand(dropdownItem.commandId, dropdownItem.commandArgs);
        }
    }
    async refresh(): Promise<void> {
        await this._updateSelectedMap();
        this.render();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    // Both of these private methods will go when each button is a component.
    // TODO: don't run through every `selected` method on every render...
    async _updateSelectedMap(): Promise<void> {
        for (const button of this.buttons) {
            this.selected.set(
                button,
                !!button.selected && (await button.selected(this.env.editor)),
            );
        }
    }
    _listButtons(): Button[] {
        const result = [];
        for (const group of this.config) {
            if (Array.isArray(group)) {
                for (const item of group) {
                    if (Array.isArray(item)) {
                        for (const dropdownItem of item) {
                            if (typeof dropdownItem !== 'string') {
                                result.push(dropdownItem);
                            }
                        }
                    } else if (typeof item !== 'string') {
                        result.push(item);
                    }
                }
            }
        }
        return result;
    }
}
