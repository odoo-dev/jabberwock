import { Dispatcher } from './Dispatcher';
import { JWPlugin, JWPluginConfig } from './JWPlugin';
import { Core } from './Core';
import { ContextManager } from './ContextManager';
import { VSelection } from './VSelection';
import { isConstructor } from '../../utils/src/utils';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { ModeError } from '../../utils/src/errors';
import { ContainerNode } from './VNodes/ContainerNode';
import { AtomicNode } from './VNodes/AtomicNode';
import { SeparatorNode } from './VNodes/SeparatorNode';
import { Memory } from './Memory/Memory';
import { makeVersionable } from './Memory/Versionable';
import { VersionableArray } from './Memory/VersionableArray';

export enum Mode {
    CONFIGURATION = 'configuration',
    EDITION = 'edition',
}

export type Loadable = {};
export type Loader<L extends Loadable = Loadable> = (
    loadables: L[],
    source?: JWPlugin | {},
) => void;
export type Loadables<T extends JWPlugin = JWPlugin> = {
    [key in keyof T['loaders']]?: Parameters<T['loaders'][key]>[0];
};

type Commands<T extends JWPlugin> = Extract<keyof T['commands'], string>;
type CommandParams<T extends JWPlugin, K extends string> = K extends Commands<T>
    ? Parameters<T['commands'][K]['handler']>[0]
    : never;

export interface JWEditorConfig {
    defaults?: {
        Container?: new () => ContainerNode;
        Atomic?: new () => AtomicNode;
        Separator?: new () => SeparatorNode;
    };
    plugins?: [typeof JWPlugin, JWPluginConfig?][];
    loadables?: Loadables;
}

export interface PluginMap extends Map<typeof JWPlugin, JWPlugin> {
    get<T extends typeof JWPlugin>(constructor: T): InstanceType<T>;
}

export class JWEditor {
    private _mode: Mode = Mode.CONFIGURATION;
    dispatcher: Dispatcher;
    contextManager: ContextManager;
    plugins: PluginMap = new Map();
    configuration: JWEditorConfig = {
        defaults: {
            Container: ContainerNode,
            Atomic: AtomicNode,
            Separator: SeparatorNode,
        },
        plugins: [],
        loadables: {},
    };
    memory: Memory;
    memoryID = 0;
    private memoryInfo: { commandNames: string[] };
    selection = new VSelection();
    loaders: Record<string, Loader> = {};
    private mutex = Promise.resolve();

    constructor() {
        this.dispatcher = new Dispatcher(this);
        this.plugins = new Map();
        this.contextManager = new ContextManager(this);

        this.nextEventMutex = this.nextEventMutex.bind(this);

        // Core is a special mandatory plugin that handles the matching between
        // the commands supported in the core of the editor and the VDocument.
        this.load(Core);
        this.load(Keymap);
    }

    async nextEventMutex(next: (...args) => void): Promise<void> {
        return (this.mutex = this.mutex.then(next));
    }
    /**
     * Start the editor on the editable DOM node set on this editor instance.
     */
    async start(): Promise<void> {
        this._mode = Mode.EDITION;
        this._loadPlugins();

        // Load editor-level loadables.
        if (this.configuration.loadables) {
            for (const loadableId of Object.keys(this.loaders)) {
                const loadable = this.configuration.loadables[loadableId];
                if (loadable) {
                    this.loaders[loadableId](loadable, this.configuration);
                }
            }
        }

        // create memory
        this.memoryInfo = makeVersionable({ commandNames: [] });
        this.memory = new Memory();
        this.memory.linkToMemory(this.memoryInfo);

        for (const plugin of this.plugins.values()) {
            await plugin.start();
        }

        // create the next memory slice (and freeze the current memory)
        this.memoryID++;
        this.memory.create(this.memoryID.toString());
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Load the given plugin with given configuration.
     *
     * @param Plugin
     * @param config
     */
    load(loadables: Loadables): void;
    load<P extends typeof JWPlugin>(Plugin: P, config?: ConstructorParameters<P>[1]): void;
    load<P extends typeof JWPlugin>(
        PluginOrLoadables: P | Loadables,
        config?: ConstructorParameters<P>[1],
    ): void {
        // Actual loading is deferred to `start`.
        if (this._mode !== Mode.CONFIGURATION) {
            throw new ModeError(Mode.CONFIGURATION);
        } else if (isConstructor(PluginOrLoadables, JWPlugin)) {
            // Add the plugin to the configuration.
            const Plugin = PluginOrLoadables;
            const plugins = this.configuration.plugins;
            const index = plugins.findIndex(([p]) => p === Plugin);
            if (index !== -1) {
                // Remove this module from the config to avoid loading it twice.
                plugins.splice(index, 1);
            }
            plugins.push([Plugin, config || {}]);
        } else {
            // Add the loadables to the configuration.
            const configuredLoadables = this.configuration.loadables;
            for (const loadableIdentifier of Object.keys(PluginOrLoadables)) {
                const loadables = PluginOrLoadables[loadableIdentifier];
                if (configuredLoadables[loadableIdentifier]) {
                    configuredLoadables[loadableIdentifier].push(...loadables);
                } else {
                    configuredLoadables[loadableIdentifier] = [...loadables];
                }
            }
        }
    }

    /**
     * Load the plugins specified in the editor configuration.
     *
     */
    private _loadPlugins(): void {
        // Resolve dependencies.
        const Plugins = [...this.configuration.plugins];
        for (let offset = 1; offset <= Plugins.length; offset++) {
            const index = Plugins.length - offset;
            const [Plugin] = Plugins[index];
            for (const Dependency of [...Plugin.dependencies].reverse()) {
                const depIndex = Plugins.findIndex(([P]) => P === Dependency);
                if (depIndex === -1) {
                    // Load the missing dependency with no config parameters.
                    Plugins.splice(index, 0, [Dependency, {}]);
                } else if (depIndex > index) {
                    // Load the dependency before the plugin depending on it.
                    const [[Dep, config]] = Plugins.splice(depIndex, 1);
                    Plugins.splice(index, 0, [Dep, config]);
                    offset--;
                }
            }
        }

        // Load plugins.
        for (const [PluginClass, configuration] of Plugins) {
            const plugin = new PluginClass(this, configuration);

            this.plugins.set(PluginClass, plugin);

            // Register the commands of this plugin.
            Object.keys(plugin.commands).forEach(key => {
                const implementation = { ...plugin.commands[key] };
                // Bind handlers to the plugin itself. This preserves the
                // typing of the handler parameters which would be lost if
                // the binding was done in the plugin definition.
                implementation.handler = implementation.handler.bind(plugin);
                this.dispatcher.registerCommand(key, implementation);
            });
            // Register the hooks of this plugin.
            for (const [id, hook] of Object.entries(plugin.commandHooks)) {
                this.dispatcher.registerCommandHook(id, hook.bind(plugin));
            }

            // Load loaders.
            for (const loadableId of Object.keys(plugin.loaders)) {
                if (this.loaders[loadableId]) {
                    throw new Error(`Multiple loaders for '${loadableId}'.`);
                } else {
                    // Bind loaders to the plugin itself. This preserves the
                    // typing of the loader parameters which would be lost if
                    // the binding was done in the plugin definition.
                    const loader = plugin.loaders[loadableId];
                    this.loaders[loadableId] = loader.bind(plugin);
                }
            }
        }

        // Load loadables.
        for (const loadableIdentifier of Object.keys(this.loaders)) {
            for (const plugin of this.plugins.values()) {
                const loadableArray = plugin.loadables[loadableIdentifier];
                if (loadableArray) {
                    this.loaders[loadableIdentifier](loadableArray, plugin);
                }
            }
        }
    }

    /**
     * Configure this editor instance with the given `config` object, or
     * configure the given plugin with the given configuration object.
     *
     * @param editorConfig | Plugin
     * @param [PluginConfig]
     */
    configure(editorConfig: JWEditorConfig): void;
    configure<T extends typeof JWPlugin>(
        Plugin: T,
        pluginConfig: ConstructorParameters<T>[1],
    ): void;
    configure<T extends typeof JWPlugin>(
        PluginOrEditorConfig: JWEditorConfig | T,
        pluginConfig?: ConstructorParameters<T>[1],
    ): void {
        if (this._mode !== Mode.CONFIGURATION) {
            throw new ModeError(Mode.CONFIGURATION);
        } else if (isConstructor(PluginOrEditorConfig, JWPlugin)) {
            // Configure the plugin.
            const Plugin = PluginOrEditorConfig;
            const conf = this.configuration.plugins.find(([P]) => P === Plugin);
            if (conf) {
                // Update the previous config if the plugin was already added.
                conf[1] = { ...conf[1], ...pluginConfig };
            } else {
                // Add the new plugin constructor and his configuration.
                this.configuration.plugins.push([Plugin, pluginConfig]);
            }
        } else {
            // Configure the editor.
            const preconf = this.configuration;
            const conf = PluginOrEditorConfig;
            this.configuration = { ...preconf, ...conf };
            // Merge special `defaults` configuration key.
            if (conf.defaults) {
                this.configuration.defaults = {
                    ...preconf.defaults,
                    ...conf.defaults,
                };
            }
            // Handle special `plugins` configuration key through `load`.
            if (conf.plugins) {
                this.configuration.plugins = [...preconf.plugins];
                for (const [Plugin, pluginConfiguration] of conf.plugins) {
                    this.load(Plugin, pluginConfiguration || {});
                }
            }
            // Handle special `loadables` configuration key through `load`.
            if (conf.loadables) {
                this.configuration.loadables = { ...preconf.loadables };
                this.load(conf.loadables);
            }
        }
    }

    /**
     * Execute the given command.
     *
     * @param id name identifier of the command to execute
     * @param params arguments object of the command to execute
     */
    async execCommand<P extends JWPlugin, C extends Commands<P> = Commands<P>>(
        commandName: C,
        params?: CommandParams<P, C>,
    ): Promise<void> {
        const isFrozen = !this.memoryID || this.memory.isFrozen();
        if (isFrozen) {
            // switch to the next memory slice (unfreeze the memory)
            this.memory.switchTo(this.memoryID.toString());
            this.memoryInfo.commandNames = new VersionableArray<string>();
        }
        this.memoryInfo.commandNames.push(commandName);

        // TODO:
        // create memory for each plugin who use the command then
        // use squashInto(winnerSliceKey, winnerSliceKey, newMasterSliceKey)
        await this.dispatcher.dispatch(commandName, params);

        if (isFrozen) {
            // create the next memory slice (and freeze the current memory)
            this.memoryID++;
            this.memory.create(this.memoryID.toString());
        }
    }

    /**
     * Stop this editor instance.
     */
    async stop(): Promise<void> {
        for (const plugin of this.plugins.values()) {
            await plugin.stop();
        }
        // Clear loaders.
        this.loaders = {};
        this._mode = Mode.CONFIGURATION;
    }
}

export default JWEditor;
