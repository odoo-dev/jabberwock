import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import { CommandIdentifier, CommandParams } from '../../../core/src/Dispatcher';
import { Toolbar, ToolbarLayout, Button, ToolbarItem } from '../Toolbar';

export class ToolbarComponent extends OwlUIComponent<{}> {
    static components = {};
    static template = 'toolbar';
    config: ToolbarLayout = this.env.editor.plugins.get(Toolbar).configuration.layout || [];

    async willStart(): Promise<void> {
        this.env.editor.dispatcher.registerCommandHook('*', this.refresh.bind(this));
        return super.willStart();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    execCommand(commandId: CommandIdentifier, commandArgs?: CommandParams): void {
        this.env.editor.execCommand(commandId, commandArgs);
    }
    async isEnabled(item: Button): Promise<boolean> {
        return !item.enabled || item.enabled(this.env.editor);
    }
    isSelected(item: Button): boolean {
        return item.selected && item.selected(this.env.editor);
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
        this.render();
    }
}
