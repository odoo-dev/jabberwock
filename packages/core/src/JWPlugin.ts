import JWEditor from './JWEditor';
import { CommandIdentifier, CommandImplementation, CommandHook } from './Dispatcher';
import { Shortcut } from './JWEditor';
import { RendererConstructor, RenderingEngineConstructor } from './RenderingEngine';
import { ParserConstructor, ParsingEngineConstructor } from './ParsingEngine';

export type JWPluginConfig = {};

export class JWPlugin<T extends JWPluginConfig = {}> {
    static readonly dependencies: Array<typeof JWPlugin> = [];
    readonly parsingEngines: ParsingEngineConstructor[];
    readonly parsers: ParserConstructor[];
    readonly renderingEngines: RenderingEngineConstructor[] = [];
    readonly renderers: RendererConstructor[];
    name: string;
    commands: Record<CommandIdentifier, CommandImplementation> = {};
    commandHooks: Record<CommandIdentifier, CommandHook> = {};
    shortcuts: Shortcut[];

    constructor(public editor: JWEditor, public configuration: T) {}

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
