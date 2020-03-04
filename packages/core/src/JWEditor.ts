import { Dispatcher, CommandIdentifier } from './Dispatcher';
import { EventManager } from './EventManager';
import { JWPlugin, JWPluginConfig } from './JWPlugin';
import { VDocument } from './VDocument';
import { CorePlugin } from './CorePlugin';
import { VNode } from './VNodes/VNode';
import { VElement } from './VNodes/VElement';
import { Dom } from '../../plugin-dom/Dom';
import { FragmentNode } from './VNodes/FragmentNode';
import { ContextManager } from './ContextManager';
import { VSelection } from './VSelection';
import { isConstructor } from '../../utils/src/utils';
import { Parser } from '../../plugin-parser/src/Parser';
import { Keymap } from '../../plugin-keymap/src/Keymap';

enum Mode {
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

export interface JWEditorConfig {
    plugins?: [typeof JWPlugin, JWPluginConfig?][];
    createBaseContainer?: () => VNode;
    loadables?: Loadables;
}

export interface PluginMap extends Map<typeof JWPlugin, JWPlugin> {
    get<T extends typeof JWPlugin>(constructor: T): InstanceType<T>;
}

export class JWEditor {
    private _mode: Mode = Mode.CONFIGURATION;
    el: HTMLElement;
    _originalEditable: HTMLElement;
    editable: HTMLElement;
    dispatcher: Dispatcher;
    eventManager: EventManager;
    contextManager: ContextManager;
    plugins: PluginMap = new Map();
    configuration: JWEditorConfig = {
        plugins: [],
        createBaseContainer: () => new VElement('P'),
        loadables: {},
    };
    vDocument: VDocument;
    selection = new VSelection();
    loaders: Record<string, Loader> = {};

    constructor(editable?: HTMLElement) {
        this.el = document.createElement('jw-editor');
        // Semantic elements are inline by default.
        // We need to guarantee it's a block so it can contain other blocks.
        this.el.style.display = 'block';
        this.dispatcher = new Dispatcher(this);
        this.plugins = new Map();

        this.contextManager = new ContextManager(this);

        if (!editable) {
            editable = document.createElement('jw-editable');
            // Semantic elements are inline by default.
            // We need to guarantee it's a block so it can contain other blocks.
            editable.style.display = 'block';
        }
        this._originalEditable = editable;

        // The editable property of the editor is the original editable element
        // before start is called, and becomes the clone after start is called.
        this.editable = editable;

        // CorePlugin is a special mandatory plugin that handles the matching
        // between the core commands and the VDocument.
        this.load(CorePlugin);
        this.load(Parser);
        this.load(Keymap);
    }

    /**
     * Create the most basic VNode container for the current configuration.
     */
    get createBaseContainer(): () => VNode {
        return this.configuration.createBaseContainer;
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

        const root = new FragmentNode();
        if (this._originalEditable.innerHTML !== '') {
            const parser = this.plugins.get(Parser);
            const domParser = parser && parser.engines.dom;
            if (!domParser) {
                // TODO: remove this when the editor can be instantiated on
                // something else than DOM.
                throw new Error(`No DOM parser installed.`);
            }
            const parsedEditable = await domParser.parse(this._originalEditable);
            for (const parsedNode of parsedEditable) {
                for (const child of parsedNode.children.slice()) {
                    root.append(child);
                }
            }
        }
        this.vDocument = new VDocument(root);

        // Deep clone the given editable node in order to break free of any
        // handler that might have been previously registered.
        this.editable = this._originalEditable.cloneNode(true) as HTMLElement;

        // The original editable node is hidden until the editor stops.
        this._originalEditable.style.display = 'none';
        // Cloning the editable node might lead to duplicated id.
        this.editable.id = this._originalEditable.id;
        this._originalEditable.removeAttribute('id');

        // The cloned editable element is then added to the main editor element
        // which is itself added to the DOM.
        this.editable.classList.add('jw-editable');
        this.editable.setAttribute('contenteditable', 'true');
        this.el.appendChild(this.editable);
        document.body.appendChild(this.el);

        // Attach the keymap listener to the editable.
        const keymap = this.plugins.get(Keymap);
        this.editable.addEventListener('keydown', keymap.listener.bind(keymap));

        for (const plugin of this.plugins.values()) {
            await plugin.start();
        }

        // Init the event manager now that the cloned editable is in the DOM.
        const domPlugin = this.plugins.get(Dom) as Dom;
        this.eventManager = new EventManager(this, domPlugin);
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
            throw new Error(`Load only allowed in ${Mode.CONFIGURATION} mode.`);
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
                }
            }
        }

        // Load plugins.
        for (const [PluginClass, configuration] of Plugins) {
            const plugin = new PluginClass(this, configuration);

            this.plugins.set(PluginClass, plugin);

            // Register the commands of this plugin.
            Object.keys(plugin.commands).forEach(key => {
                this.dispatcher.registerCommand(key, plugin.commands[key]);
            });
            // Register the hooks of this plugin.
            for (const [id, hook] of Object.entries(plugin.commandHooks)) {
                this.dispatcher.registerCommandHook(id, hook);
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
        if (this._mode === Mode.EDITION) {
            throw new Error(
                "You can't change the configuration when the editor is already started",
            );
        }
        if (isConstructor(PluginOrEditorConfig, JWPlugin)) {
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
            const preconf = this.configuration;
            const conf = PluginOrEditorConfig;
            this.configuration = { ...preconf, ...conf };
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
     * @param args arguments object of the command to execute
     */
    async execCommand(id: CommandIdentifier, args = {}): Promise<void> {
        await this.dispatcher.dispatch(id, args);
    }

    /**
     * Stop this editor instance.
     */
    async stop(): Promise<void> {
        for (const plugin of this.plugins.values()) {
            await plugin.stop();
        }
        this.eventManager.stop();
        this._originalEditable.id = this.editable.id;
        this._originalEditable.style.display = this.editable.style.display;
        this.el.remove();
        this._mode = Mode.CONFIGURATION;
    }
}

export default JWEditor;
