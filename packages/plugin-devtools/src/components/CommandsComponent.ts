import { OwlUIComponent } from '../../../owl-ui/src/OwlUIComponent';
import {
    CommandIdentifier,
    CommandHandler,
    CommandArgs,
    CommandDefinition,
} from '../../../core/src/Dispatcher';

interface CommandsState {
    currentTab: string;
    registry: Record<CommandIdentifier, CommandDefinition>;
    handlers: Record<CommandIdentifier, CommandHandler[]>;
    selectedCommandIndex: number;
    selectedCommandIdentifier: string;
    selectedHandlerIndex: number;
}
interface CommandsProps {
    // Stack of all commands executed since init.
    commands: Array<[CommandIdentifier, CommandArgs]>;
}

export class CommandsComponent extends OwlUIComponent<CommandsProps> {
    state: CommandsState = {
        currentTab: 'selected',
        registry: this.env.editor.dispatcher.commands,
        handlers: this.env.editor.dispatcher.handlers,
        selectedCommandIndex: null, // Index of the selected command in the stack
        selectedCommandIdentifier: null, // Token of the selected handler
        selectedHandlerIndex: null, // Index of the selected handler
    };
    localStorage = ['currentTab'];

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Take a payload value and format it for display (mostly to ensure that
     * we can display it properly as a string).
     *
     * @param value
     */
    formatPayloadValue(value: Node | string | boolean | number | object): string {
        if (value && value instanceof Node && value.nodeName) {
            return '<' + value.nodeName.toLowerCase() + '>';
        }
        return '' + value;
    }
    /**
     * Return the command handler corresponding to the given token.
     *
     * @param commandIdentifier
     */
    getHandlers(commandIdentifier: CommandIdentifier): CommandHandler[] {
        return this.env.editor.dispatcher[commandIdentifier];
    }
    /**
     * Handle keydown event to navigate in the command stack.
     */
    onKeydown(event: KeyboardEvent): void {
        if (this.state.currentTab === 'queue') {
            if (event.code === 'ArrowDown') {
                this.state.selectedCommandIndex = Math.max(this.state.selectedCommandIndex - 1, 0);
            } else if (event.code === 'ArrowUp') {
                this.state.selectedCommandIndex = Math.min(
                    this.state.selectedCommandIndex + 1,
                    this.props.commands.length - 1,
                );
            } else {
                return;
            }
        } else if (this.state.currentTab === 'registry') {
            const identifiers = Object.keys(this.state.registry);
            const currentIndex = identifiers.indexOf(this.state.selectedCommandIdentifier);
            if (event.code === 'ArrowDown') {
                this.state.selectedCommandIdentifier =
                    identifiers[Math.min(currentIndex + 1, identifiers.length - 1)];
            } else if (event.code === 'ArrowUp') {
                this.state.selectedCommandIdentifier = identifiers[Math.max(currentIndex - 1, 0)];
            } else {
                return;
            }
        }
        event.preventDefault();
        event.stopImmediatePropagation();
    }
    /**
     * Open the tab with the given tabName.
     *
     * @param tabName
     */
    openTab(tabName: string): void {
        this.state.currentTab = tabName;
    }
    /**
     * Select the command at given index.
     *
     * @param index
     */
    selectCommandByIndex(index: number): void {
        this.state.selectedCommandIndex = index;
        this.state.selectedCommandIdentifier = this.props.commands[index][0];
    }
    /**
     * Select the command with given identifier.
     *
     * @param commandIdentifier
     */
    selectCommand(commandIdentifier: string): void {
        this.state.selectedCommandIdentifier = commandIdentifier;
    }
}
