import { CommandDefinition } from './Dispatcher';
import JWEditor from './JWEditor';
import { VNode, Predicate } from './VNodes/VNode';

export type CommandIdentifier = string;
export interface CommandDefinition {
    title?: string;
    description?: string;
    handler: CommandHandler;
    predicates?: Predicate<VNode>[];
}
export type CommandHandler = (args: CommandArgs) => void;
export interface CommandArgs {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export class Dispatcher {
    __nextHandlerTokenID = 0;
    editor: JWEditor;
    el: Element;
    commands: Record<CommandIdentifier, CommandDefinition[]> = {};

    constructor(editor: JWEditor) {
        this.editor = editor;
        this.el = editor.el;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Call all hooks registred for the command `id`.
     *
     * @param commandId The name of the command.
     * @param args The arguments of the command.
     */
    async dispatch(commandId: CommandIdentifier, args: CommandArgs = {}): Promise<void> {
        const commands = this.commands[commandId];
        if (!commands) {
            return;
        }
        const command = this.editor.contextManager.match(commands);
        if (command) {
            command.handler(args);
        }
    }

    /**
     * Register all handlers declared in a plugin, and match them with their
     * corresponding command.
     *
     */
    registerCommand(id: CommandIdentifier, def: CommandDefinition): void {
        if (!this.commands[id]) {
            this.commands[id] = [def];
        } else {
            this.commands[id].push(def);
        }
    }
}
