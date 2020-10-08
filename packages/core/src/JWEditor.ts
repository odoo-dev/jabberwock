import { Dispatcher, CommandParams } from './Dispatcher';
import { JWPlugin, JWPluginConfig } from './JWPlugin';
import { Core } from './Core';
import { ContextManager, Context } from './ContextManager';
import { VSelection } from './VSelection';
import { VRange } from './VRange';
import { isConstructor, isContentEditable } from '../../utils/src/utils';
import { Keymap } from '../../plugin-keymap/src/Keymap';
import { StageError } from '../../utils/src/errors';
import { ContainerNode } from './VNodes/ContainerNode';
import { AtomicNode } from './VNodes/AtomicNode';
import { SeparatorNode } from './VNodes/SeparatorNode';
import { ModeIdentifier, ModeDefinition, Mode, RuleProperty } from './Mode';
import { Memory, ChangesLocations } from './Memory/Memory';
import { makeVersionable } from './Memory/Versionable';
import { VersionableArray } from './Memory/VersionableArray';
import { Point, VNode } from './VNodes/VNode';

export enum EditorStage {
    CONFIGURATION = 'configuration',
    STARTING = 'starting',
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

export type Commands<T extends JWPlugin> = Extract<keyof T['commands'], string>;
export type CommandParamsType<T extends JWPlugin, K extends string> = K extends Commands<T>
    ? Parameters<T['commands'][K]['handler']>[0]
    : never;
export interface CommitParams extends CommandParams {
    changesLocations: ChangesLocations;
    commandNames: string[];
}
export interface ErrorParams extends CommandParams {
    message: string;
    stack: string;
}

export type ExecCommandFunction = <P extends JWPlugin, C extends Commands<P> = Commands<P>>(
    commandName: C | ((context: Context) => void | Promise<void>),
    params?: CommandParamsType<P, C>,
) => Promise<ExecCommandResult>;

export type ExecCommandResult = void | {
    error: {
        name: string;
        message: string;
    };
};

export interface ExecutionContext {
    execCommand: ExecCommandFunction;
}

export interface JWEditorConfig {
    /**
     * The modes that the editor will support.
     * @see class `Mode`
     */
    modes?: ModeDefinition[];
    /**
     * The mode with which the editor gets started.
     * @see class `Mode`
     */
    mode?: ModeIdentifier;
    defaults?: {
        Container?: new () => ContainerNode;
        Atomic?: new () => AtomicNode;
        Separator?: new () => SeparatorNode;
    };
    plugins?: [typeof JWPlugin, JWPluginConfig?][];
    loadables?: Loadables;
    deadlockTimeout?: number;
}

export interface PluginMap extends Map<typeof JWPlugin, JWPlugin> {
    get<T extends typeof JWPlugin>(constructor: T): InstanceType<T>;
}

export class JWEditor {
    private _stage: EditorStage = EditorStage.CONFIGURATION;
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
        deadlockTimeout: 10000,
    };
    memory: Memory;
    memoryInfo: { commandNames: string[]; uiCommand: boolean };
    private _memoryID = 0;
    selection: VSelection;
    loaders: Record<string, Loader> = {};
    private _mutex = Promise.resolve();
    modes: Record<ModeIdentifier, Mode> = {
        default: new Mode({
            id: 'default',
            rules: [],
        }),
    };
    mode: Mode = this.modes.default;

    constructor() {
        this.dispatcher = new Dispatcher(this);
        this.plugins = new Map();
        this.selection = new VSelection(this);
        this.contextManager = new ContextManager(this, this._execSubCommand.bind(this));

        // Core is a special mandatory plugin that handles the matching between
        // the commands supported in the core of the editor and the VDocument.
        this.load(Core);
        this.load(Keymap);
    }

    /**
     * Set the current mode of the editor.
     */
    setMode(modeIdentifier: ModeIdentifier): void {
        this.mode = this.modes[modeIdentifier];
    }

    /**
     * Start the editor on the editable DOM node set on this editor instance.
     */
    async start(): Promise<void> {
        this._stage = EditorStage.STARTING;
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

        for (const mode of this.configuration.modes || []) {
            this.modes[mode.id] = new Mode(mode);
        }
        if (this.configuration.mode) {
            this.setMode(this.configuration.mode);
        }

        // create memory
        this.memory = new Memory();
        this.memory.attach(this.selection.range.start);
        this.memory.attach(this.selection.range.end);
        this.memoryInfo = makeVersionable({ commandNames: [], uiCommand: false });
        this.memory.attach(this.memoryInfo);
        this.memory.create(this._memoryID.toString());

        // Start all plugins in the first memory slice.
        const startPlugins = async (): Promise<void> => {
            for (const plugin of this.plugins.values()) {
                await plugin.start();
            }
        };
        await this.execCommand(startPlugins);
        this._stage = EditorStage.EDITION;
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Return true if the target node is within an editable context.
     *
     * @param target
     */
    isInEditable(node: VNode): boolean {
        return isContentEditable(node) || this.mode.is(node, RuleProperty.EDITABLE);
    }
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
        if (this._stage !== EditorStage.CONFIGURATION) {
            throw new StageError(EditorStage.CONFIGURATION);
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
        if (this._stage !== EditorStage.CONFIGURATION) {
            throw new StageError(EditorStage.CONFIGURATION);
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

    async nextEventMutex(
        next: (execCommand: ExecCommandFunction) => void,
    ): Promise<ExecCommandResult> {
        return (this._mutex = this._mutex.then(
            next.bind(undefined, this._withOpenMemory.bind(this)),
        ));
    }

    /**
     * Execute arbitrary code in `callback`, then dispatch the commit event.
     * The callback receives an `execCommand` parameter which it can use to
     * make further calls to `execCommand` from *inside* its current command.
     *
     * @param callback
     */
    async execCommand(
        callback: (context: Context) => Promise<void> | void,
    ): Promise<ExecCommandResult>;
    /**
     * Execute the given command.
     *
     * @param id name identifier of the command to execute
     * @param params arguments object of the command to execute
     */
    async execCommand<P extends JWPlugin, C extends Commands<P> = Commands<P>>(
        commandName: C,
        params?: CommandParamsType<P, C>,
    ): Promise<ExecCommandResult>;
    /**
     * Execute the command or arbitrary code in `callback` in memory.
     * The call to execCommand are executed into a mutex. Every plugin can
     * launch subcommands with the 'JWPlugin.execCommand' method instead.
     *
     * TODO: create memory for each plugin who use the command then use
     * squashInto(winnerSliceKey, winnerSliceKey, newMasterSliceKey)
     *
     * @param commandName name identifier of the command to execute or callback
     * @param params arguments object of the command to execute
     */
    async execCommand<P extends JWPlugin, C extends Commands<P> = Commands<P>>(
        commandName: C | ((context: Context) => Promise<void> | void),
        params?: CommandParamsType<P, C>,
    ): Promise<ExecCommandResult> {
        return this.nextEventMutex(async () => {
            return this._withOpenMemory(commandName, params);
        });
    }

    /**
     * Execute a command on a temporary range corresponding to the given
     * boundary points. The range is automatically destroyed afterwards.
     *
     * @param bounds The points corresponding to the range boundaries.
     * @param commandName name identifier of the command to execute or callback
     * @param params arguments object of the command to execute
     * @param mode
     */
    async execWithRange<P extends JWPlugin, C extends Commands<P> = Commands<P>>(
        bounds: [Point, Point],
        commandName: C | ((context: Context) => Promise<void> | void),
        params?: CommandParamsType<P, C>,
        mode?: Mode,
    ): Promise<ExecCommandResult>;
    /**
     * Execute a command on a temporary range corresponding to the given
     * boundary points. The range is automatically destroyed afterwards.
     *
     * @param bounds The points corresponding to the range boundaries.
     * @param callback The callback to call with the newly created range.
     * @param mode
     */
    async execWithRange<P extends JWPlugin, C extends Commands<P> = Commands<P>>(
        bounds: [Point, Point],
        callback: (context: Context) => Promise<void> | void,
        mode?: Mode,
    ): Promise<ExecCommandResult>;
    async execWithRange<P extends JWPlugin, C extends Commands<P> = Commands<P>>(
        bounds: [Point, Point],
        commandName: C | ((context: Context) => Promise<void> | void),
        params?: CommandParamsType<P, C> | Mode,
        mode?: Mode,
    ): Promise<void> {
        const callback = async (): Promise<void> => {
            this.memoryInfo.commandNames.push('@withRange');
            let range: VRange;
            if (typeof commandName === 'function') {
                range = new VRange(this, bounds, { mode: params });
                this.memoryInfo.commandNames.push(
                    '@custom' + (commandName.name ? ':' + commandName.name : ''),
                );
                await commandName({ ...this.contextManager.defaultContext, range });
            } else {
                range = new VRange(this, bounds, { mode });
                this.memoryInfo.commandNames.push(commandName);
                const newParam = Object.assign({ context: {} }, params as CommandParamsType<P, C>);
                newParam.context.range = range;
                await this.dispatcher.dispatch(commandName, newParam);
            }
            range.remove();
        };

        if (this.memory.isFrozen()) {
            await this.execCommand(callback);
        } else {
            await callback();
        }
    }

    /**
     * Stop this editor instance.
     */
    async stop(): Promise<void> {
        if (this.memory) {
            this.memory.create('stop');
            this.memory.switchTo('stop'); // Unfreeze the memory.
        }
        for (const plugin of this.plugins.values()) {
            await plugin.stop();
        }
        if (this.memory) {
            this.memory.create('stopped'); // Freeze the memory.
            this.memory = null;
        }
        this.plugins.clear();
        this.dispatcher = new Dispatcher(this);
        this.selection = new VSelection(this);
        this.contextManager = new ContextManager(this, this._execSubCommand);
        // Clear loaders.
        this.loaders = {};
        this._stage = EditorStage.CONFIGURATION;
    }

    private async _withOpenMemory<P extends JWPlugin, C extends Commands<P> = Commands<P>>(
        commandName: C | ((context: Context) => Promise<void> | void),
        params?: CommandParamsType<P, C>,
    ): Promise<ExecCommandResult> {
        if (!this.memory.isFrozen()) {
            console.error(
                'You are trying to call the external editor' +
                    ' execCommand method from within an execCommand. ' +
                    'Use the `execCommand` method of your plugin instead.',
            );
            return;
        }
        let execCommandTimeout: number;
        // Switch to the next memory slice (unfreeze the memory).
        const origin = this.memory.sliceKey;
        const memorySlice = this._memoryID.toString();
        this.memory.switchTo(memorySlice);
        this.memoryInfo.commandNames = new VersionableArray();
        this.memoryInfo.uiCommand = false;
        let commandNames = this.memoryInfo.commandNames;

        try {
            const exec = async (): Promise<void> => {
                // Execute command.
                if (typeof commandName === 'function') {
                    const name = '@custom' + (commandName.name ? ':' + commandName.name : '');
                    this.memoryInfo.commandNames.push(name);
                    await commandName(this.contextManager.defaultContext);
                    if (this.memory.sliceKey !== memorySlice) {
                        // Override by the current commandName if the slice changed.
                        commandNames = [name];
                    }
                } else {
                    this.memoryInfo.commandNames.push(commandName);
                    await this.dispatcher.dispatch(commandName, params);
                    if (this.memory.sliceKey !== memorySlice) {
                        // Override by the current commandName if the slice changed.
                        commandNames = [commandName];
                    }
                }
            };

            await new Promise((resolve, reject) => {
                execCommandTimeout = window.setTimeout(() => {
                    reject({
                        name: 'deadlock',
                        message:
                            'An execCommand call is taking more than 10 seconds to finish. It might be caused by a deadlock.\n' +
                            'Verify that you do not call editor.execCommand inside another editor.execCommand, ' +
                            'or that a command does not resolve the returned promise.',
                    });
                }, this.configuration.deadlockTimeout);
                exec().then(resolve, reject);
            });

            // Prepare nex slice and freeze the memory.
            this._memoryID++;
            const nextMemorySlice = this._memoryID.toString();
            this.memory.create(nextMemorySlice);

            // Send the commit message with a frozen memory.
            const changesLocations = this.memory.getChangesLocations(
                memorySlice,
                this.memory.sliceKey,
            );
            await this.dispatcher.dispatch<CommitParams>('@commit', {
                changesLocations: changesLocations,
                commandNames: [...commandNames],
            });
            clearTimeout(execCommandTimeout);
        } catch (error) {
            clearTimeout(execCommandTimeout);
            if (this._stage !== EditorStage.EDITION) {
                throw error;
            }
            console.error(error);

            await this.dispatcher.dispatch<ErrorParams>('@error', {
                message: error.message,
                stack: error.stack,
            });

            const failedSlice = this.memory.sliceKey;

            // When an error occurs, we go back to part of the functional memory.
            this.memory.switchTo(origin);

            try {
                // Send the commit message with a frozen memory.
                const changesLocations = this.memory.getChangesLocations(failedSlice, origin);
                await this.dispatcher.dispatch<CommitParams>('@commit', {
                    changesLocations: changesLocations,
                    commandNames: commandNames,
                });
            } catch (revertError) {
                if (this._stage !== EditorStage.EDITION) {
                    throw revertError;
                }

                await this.dispatcher.dispatch<ErrorParams>('@error', {
                    message: error.message,
                    stack: error.stack,
                });

                console.error(revertError);
            }

            return {
                error: {
                    name: error.name,
                    message: error.message,
                },
            };
        }
    }
    /**
     * Execute the command or arbitrary code in `callback` in memory.
     *
     * @param commandName name identifier of the command to execute or callback
     * @param params arguments object of the command to execute
     */
    async _execSubCommand<P extends JWPlugin, C extends Commands<P> = Commands<P>>(
        commandName: C | ((context: Context) => Promise<void> | void),
        params?: CommandParamsType<P, C>,
    ): Promise<void> {
        if (typeof commandName === 'function') {
            this.memoryInfo.commandNames.push(
                '@custom' + (commandName.name ? ':' + commandName.name : ''),
            );
            await commandName(this.contextManager.defaultContext);
        } else {
            this.memoryInfo.commandNames.push(commandName);
            await this.dispatcher.dispatch(commandName, params);
        }
    }
}

export default JWEditor;
