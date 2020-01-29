import JWEditor from './JWEditor';
import { ParsingFunction } from './Parser';
import { CommandIdentifier, CommandDefinition, CommandHandler } from './Dispatcher';
import { Renderer, RenderingFunction, RendererIdentifier } from './Renderer';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    static readonly renderers: Array<Renderer>;
    static readonly parsingFunctions: Array<ParsingFunction> = [];
    static readonly renderingFunctions: Record<RendererIdentifier, RenderingFunction> = {};
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
