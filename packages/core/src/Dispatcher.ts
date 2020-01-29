import JWEditor from './JWEditor';

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
export type DispatchHook = (command: string, args: CommandArgs) => void;

export class Dispatcher {
    __dispatching = false;
    editor: JWEditor;
    el: Element;
    commands: Record<CommandIdentifier, CommandDefinition> = {
        commit: { handler: (): void => {} },
    };
    handlers: Record<CommandIdentifier, CommandHandler[]> = {
        commit: [],
    };
    dispatchHooks: DispatchHook[] = [];

    constructor(editor: JWEditor) {
        this.editor = editor;
        this.el = editor.el;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Dispatch the commit signal for all plugins
     *
     */
    commit(): void {
        this.__dispatching = true;
        this.dispatch('commit');
        this.__dispatching = false;
    }

    /**
     * Call all hooks registred for the command `id`.
     *
     * @param commandId The name of the command.
     * @param args The arguments of the command.
     */
    dispatch(commandId: CommandIdentifier, args: CommandArgs = {}): void {
        const dispatching = this.__dispatching;
        this.__dispatching = true;

        const handlers = this.handlers[commandId];
        if (handlers) {
            handlers.forEach((handlerCallback: CommandHandler) => {
                handlerCallback(args);
            });
        }
        this.dispatchHooks.forEach((hookCallback: DispatchHook) => {
            hookCallback(commandId, args);
        });

        if (!dispatching) {
            // Commit is triggered after the process pipe

            // TODO: freeze memory => don't update the vDocument in render
            this.commit();
        }
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
    registerDispatchHook(hook: DispatchHook): void {
        this.dispatchHooks.push(hook);
    }
}
