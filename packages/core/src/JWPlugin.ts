import JWEditor from './JWEditor';
import { ParsingFunction } from './Parser';
import { CommandIdentifier, CommandDefinition, CommandHandler } from './Dispatcher';
import { Renderer, RenderingFunction } from './Renderer';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static readonly renderers: Array<Renderer<any, any>>;
    static readonly parsingFunctions: Array<ParsingFunction> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static readonly renderingFunctions: Record<string, RenderingFunction<any, any>> = {};
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
