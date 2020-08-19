import { OwlComponent } from '../../../plugin-owl/src/OwlComponent';
import { CommandIdentifier } from '../../../core/src/Dispatcher';
import { CommandParams } from '../../../core/src/Dispatcher';
import { CommandImplementation } from '../../../core/src/Dispatcher';
import { nodeName, flat } from '../../../utils/src/utils';
import { Keymap, Mapping } from '../../../plugin-keymap/src/Keymap';
import { argsRepr } from '../utils';

interface CommandsState {
    currentTab: string;
    registry: Record<CommandIdentifier, CommandImplementation[]>;
    selectedCommandIndex: number;
    selectedCommandIdentifier: string;
    selectedCommandImplementationIndex: number;
}
interface CommandsProps {
    // Stack of all commands executed since init.
    commands: Array<[CommandIdentifier, CommandParams]>;
}

export class CommandsComponent extends OwlComponent<CommandsProps> {
    state: CommandsState = {
        currentTab: 'queue',
        registry: this.env.editor.dispatcher.commands,
        selectedCommandIndex: null, // Index of the selected command in the stack
        selectedCommandIdentifier: null, // Identifier of the selected command
        selectedCommandImplementationIndex: null, // Index of the selected command definition
    };
    localStorage = ['currentTab'];
    argsRepr = argsRepr;
    stringifyPattern = this.env.editor.plugins.get(Keymap).stringifyPattern;

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
        if (value && value instanceof Node && nodeName(value)) {
            return '<' + nodeName(value).toLowerCase() + '>';
        }
        if (value instanceof Array) {
            return '' + value.join(', ');
        }
        return '' + value;
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
            const identifiers = Object.keys(this.state.registry).sort();
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
    /**
     * Return the key mappings matching the given command identifier.
     *
     * @param commandIdentifier
     */
    matchingMappings(commandIdentifier: string): Mapping[] {
        return flat(this.env.editor.plugins.get(Keymap).mappings).filter(
            mapping => mapping.configuredCommand.commandId === commandIdentifier,
        );
    }
}
