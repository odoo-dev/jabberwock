import JWEditor from './JWEditor';
import { CommandIdentifier, CommandDefinition, CommandHandler } from './Dispatcher';
import { Shortcut } from './JWEditor';
import { RendererConstructor, RenderingEngineConstructor } from './RenderingEngine';
import { ParserConstructor, ParsingEngineConstructor } from './ParsingEngine';

export interface JWPluginConfig {
    name?: string;
}

export class JWPlugin {
    static readonly dependencies: Array<typeof JWPlugin> = [];
    readonly parsingEngines: ParsingEngineConstructor[];
    readonly parsers: ParserConstructor[];
    readonly renderingEngines: RenderingEngineConstructor[] = [];
    readonly renderers: RendererConstructor[];
    name: string;
    editor: JWEditor;
    commands: Record<CommandIdentifier, CommandDefinition> = {};
    commandHooks: Record<CommandIdentifier, CommandHandler> = {};
    shortcuts: Shortcut[];

    constructor(editor: JWEditor, options: JWPluginConfig = {}) {
        this.editor = editor;
        // by default the name is that of its constructor (eg.: 'JWPlugin')
        // todo: namespace
        this.name = options.name || this.constructor.name;
    }

    /**
     * Start the plugin. Called when the editor starts.
     */
    async start(): Promise<void> {
        // This is where plugins can do asynchronous work when the editor is
        // starting (e.g. retrieve data from a server, render stuff, etc).
    }

    /**
     * Stop the plugin. Called when the editor stops.
     */
    async stop(): Promise<void> {
        // This is where plugins can do asynchronous work when the editor is
        // stopping (e.g. save on a server, close connections, etc).
    }
}
