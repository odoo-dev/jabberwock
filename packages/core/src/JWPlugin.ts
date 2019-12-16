import JWEditor from './JWEditor';
import { CommandIdentifier, CommandDefinition, CommandHandler } from './Dispatcher';
import { VNode } from './VNodes/VNode';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    static readonly nodes: Array<typeof VNode> = [];
    name: string;
    editor: JWEditor;
    commands: Record<CommandIdentifier, CommandDefinition> = {};
    commandHooks: Record<CommandIdentifier, CommandHandler> = {};

    constructor(editor: JWEditor, options: JWPluginConfig = {}) {
        this.editor = editor;
        // by default the name is that of its constructor (eg.: 'JWPlugin')
        // todo: namespace
        this.name = options.name || this.constructor.name;
    }
}
