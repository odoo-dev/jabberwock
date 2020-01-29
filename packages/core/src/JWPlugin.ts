import JWEditor from './JWEditor';
import { ParsingFunction } from './Parser';
import { CommandIdentifier, CommandDefinition, CommandHandler } from './Dispatcher';
import { RenderingFunction } from './RenderManager';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    static readonly parsingFunctions: Array<ParsingFunction> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static readonly renderingFunctions: Record<string, RenderingFunction> = {};
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
