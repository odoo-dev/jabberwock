import JWEditor from './JWEditor';
import { VNode, Predicate } from './VNodes/VNode';
import { Context } from './ContextManager';

export type CommandIdentifier = string;
export interface CommandDefinition {
    title?: string;
    description?: string;
    selector?: Predicate<VNode | boolean>[];
    context?: Context;
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
    el: Element;
    commands: Record<CommandIdentifier, CommandDefinition[]> = {};
    commandHooks: Record<CommandIdentifier, CommandHook[]> = {};

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
     * @param params The parameters of the command.
     */
    async dispatch(commandId: CommandIdentifier, params: CommandParams = {}): Promise<void> {
        const commands = this.commands[commandId];
        if (!commands) {
            console.warn(`Command '${commandId}' not found.`);
            return;
        }

        const [command, context] = this.editor.contextManager.match(commands, params.context);
        if (command) {
            // Update command arguments with the computed execution context.
            const args = { ...params, context };

            // Call command handler.
            await command.handler(args);

            // Call command hooks.
            const hooks = this.commandHooks[commandId] || [];
            const globalHooks = this.commandHooks['*'] || [];
            for (const hookCallback of [...hooks, ...globalHooks]) {
                await hookCallback(args, commandId);
            }
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

    /**
     * Register a callback that will be executed for each `execCommand` call.
     *
     * @param id The identifier of the command to hook.
     * @param hook The callback that will be executed.
     */
    registerCommandHook(id: CommandIdentifier, hook?: CommandHook): void {
        if (!this.commandHooks[id]) {
            this.commandHooks[id] = [];
        }
        this.commandHooks[id].push(hook);
    }
}
