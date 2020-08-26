import JWEditor from './JWEditor';
import { Context, Contextual } from './ContextManager';

export type CommandIdentifier = string;
export interface CommandImplementation extends Contextual {
    title?: string;
    description?: string;
    handler: CommandHandler;
}
export interface CommandParams {
    context?: Context;
}
export type CommandHandler = (args) => void;
export type CommandHook = (params: CommandParams, commandId: string) => void;

export class Dispatcher {
    __nextHandlerTokenID = 0;
    editor: JWEditor;
    commands: Record<CommandIdentifier, CommandImplementation[]> = {};
    commandHooks: Record<CommandIdentifier, CommandHook[]> = {};

    constructor(editor: JWEditor) {
        this.editor = editor;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Call all hooks registred for the command `id`.
     *
     * @param commandId The identifier of the command.
     * @param params The parameters of the command.
     */
    async dispatch(commandId: CommandIdentifier, params: CommandParams = {}): Promise<void> {
        const commands = this.commands[commandId];
        if (!commands) {
            if (commandId[0] !== '@') {
                console.warn(`Command '${commandId}' not found.`);
            }
            return;
        }

        const [command, context] = this.editor.contextManager.match(commands, params.context);
        if (command) {
            // Update command arguments with the computed execution context.
            const args = { ...params, context };

            // Call command handler.
            const result = await command.handler(args);

            await this.dispatchHooks(commandId, args);

            return result;
        }
    }

    /**
     * Register all handlers declared in a plugin, and match them with their
     * corresponding command.
     *
     */
    registerCommand(id: CommandIdentifier, impl: CommandImplementation): void {
        if (!this.commands[id]) {
            this.commands[id] = [impl];
        } else {
            this.commands[id].push(impl);
        }
    }

    /**
     * Register a callback that will be executed for each `execCommand` call.
     *
     * @param id The identifier of the command to hook.
     * @param hook The callback that will be executed.
     */
    registerCommandHook(id: CommandIdentifier, hook: CommandHook): void {
        if (!this.commandHooks[id]) {
            this.commandHooks[id] = [];
        }
        this.commandHooks[id].push(hook);
    }

    /**
     * Remove a callback that will be executed for each `execCommand` call.
     *
     * @param id The identifier of the command to hook.
     * @param hook The callback that will be removed.
     */
    removeCommandHook(id: CommandIdentifier, hook: CommandHook): void {
        if (this.commandHooks[id]) {
            const index = this.commandHooks[id].indexOf(hook);
            if (index !== -1) {
                this.commandHooks[id].splice(index, 1);
            }
        }
    }

    /**
     * Dispatch to all registred `commandHooks`.
     */
    async dispatchHooks(signal: string, args?): Promise<void> {
        const hooks = this.commandHooks[signal] || [];
        const globalHooks = this.commandHooks['*'] || [];
        for (const hookCallback of [...hooks, ...globalHooks]) {
            await hookCallback(args, signal);
        }
    }
}
