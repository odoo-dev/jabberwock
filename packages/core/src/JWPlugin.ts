import JWEditor from './JWEditor';
import { ParsingFunction } from './Parser';
import { CommandIdentifier, CommandDefinition, CommandHandler } from './Dispatcher';
import { Renderer, RenderingFunction, RendererIdentifier } from './Renderer';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    readonly renderers: Array<Renderer>;
    readonly parsingFunctions: Array<ParsingFunction> = [];
    readonly renderingFunctions: Record<
        RendererIdentifier,
        RenderingFunction | RenderingFunction[]
    > = {};
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
