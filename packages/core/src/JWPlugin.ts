import JWEditor, { Loader, PluginMap, Loadables } from './JWEditor';
import { CommandIdentifier, CommandImplementation, CommandHook } from './Dispatcher';

export type JWPluginConfig = {};

export class JWPlugin<T extends JWPluginConfig = {}> {
    static readonly dependencies: Array<typeof JWPlugin> = [];
    readonly dependencies: PluginMap = new Map();
    readonly loaders: Record<string, Loader> = {};
    readonly loadables: Loadables = {};
    name: string;
    commands: Record<CommandIdentifier, CommandImplementation> = {};
    commandHooks: Record<CommandIdentifier, CommandHook> = {};

    constructor(public editor: JWEditor, public configuration: Partial<T> = {}) {
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
