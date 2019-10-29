import JWEditor, { CommandExec } from './JWEditor';

export type CommandIdentifier = string;
export interface CommandDefinition {
    title?: string;
    description?: string;
    handler: CommandHandler;
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
    commands: Record<CommandIdentifier, CommandDefinition> = {};
    handlers: Record<CommandIdentifier, CommandHandler[]> = {};
    dispatchHooks: CommandExec[] = [];

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
    dispatch(commandId: CommandIdentifier, args: CommandArgs = {}): void {
        const handlers = this.handlers[commandId];
        if (handlers) {
            handlers.forEach((handlerCallback: CommandHandler) => {
                handlerCallback(args);
            });
        }
        this.dispatchHooks.forEach((hookCallback: CommandExec) => {
            hookCallback(commandId, args);
        });
    }

    /**
     * Register all handlers declared in a plugin, and match them with their
     * corresponding command.
     *
     */
    registerCommand(id: CommandIdentifier, def: CommandDefinition): void {
        if (this.commands[id]) {
            throw new Error(`Command ${id} already exists. Hook it instead.`);
        }
        this.commands[id] = def;
        // Commands always have at least one handler for their identifier which
        // is their own internal implementation. Additional handlers registered
        // by calling `registerHook` will be pushed after it, thus constructing
        // a queue of callbacks to call in order to execute a given command.
        this.handlers[id] = [def.handler];
    }

    /**
     * Register `CommandHook` for a `Command`.
     */
    registerHook(id: CommandIdentifier, handler: CommandHandler): void {
        if (!this.commands[id]) {
            throw new Error(`Failed to hook command ${id}. Command not found.`);
        } else {
            this.handlers[id].push(handler);
        }
    }

    /**
     * Register a callback that will be executed each time `dispatch` is called.
     *
     * @param hook The function that will be executed.
     */
    registerDispatchHook(hook: CommandExec): void {
        this.dispatchHooks.push(hook);
    }
}
