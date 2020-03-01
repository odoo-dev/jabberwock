import JWEditor, { Loader, PluginMap, Loadable } from './JWEditor';
import { CommandIdentifier, CommandImplementation, CommandHook } from './Dispatcher';
import { Shortcut } from './JWEditor';
import { RendererConstructor, RenderingEngineConstructor } from './RenderingEngine';

export type JWPluginConfig = {};

export class JWPlugin<T extends JWPluginConfig = {}> {
    static readonly dependencies: Array<typeof JWPlugin> = [];
    readonly dependencies: PluginMap = new Map();
    readonly renderingEngines: RenderingEngineConstructor[] = [];
    readonly renderers: RendererConstructor[];
    readonly loaders: Record<string, Loader> = {};
    readonly loadables: Record<string, Loadable> = {};
    name: string;
    commands: Record<CommandIdentifier, CommandImplementation> = {};
    commandHooks: Record<CommandIdentifier, CommandHook> = {};
    shortcuts: Shortcut[];

    constructor(public editor: JWEditor, public configuration: T) {
        // Populate instantiated dependencies.
        for (const Dependency of this.constructor.dependencies) {
            this.dependencies.set(Dependency, editor.plugins.get(Dependency));
        }
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
export interface JWPlugin {
    constructor: {
        new (...args: ConstructorParameters<typeof JWPlugin>): JWPlugin;
        dependencies: Array<typeof JWPlugin>;
    };
}
