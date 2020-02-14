import { BoundCommand, Keymap } from './Keymap';
import { Dispatcher, CommandIdentifier } from './Dispatcher';
import { EventManager } from './EventManager';
import { JWPlugin, JWPluginConfig } from './JWPlugin';
import { VDocument } from './VDocument';
import { CorePlugin } from './CorePlugin';
import { VNode } from './VNodes/VNode';
import { RenderingEngine, RenderingIdentifier } from './RenderingEngine';
import { VElement } from './VNodes/VElement';
import { ParsingIdentifier, ParsingEngine } from './ParsingEngine';
import { Dom } from '../../plugin-dom/Dom';
import { FragmentNode } from './VNodes/FragmentNode';
import { ContextManager, Context } from './ContextManager';
import { VSelection } from './VSelection';
import { isConstructor } from '../../utils/src/utils';

export enum Platform {
    MAC = 'mac',
    PC = 'pc',
}

enum Mode {
    CONFIGURATION = 'configuration',
    EDITION = 'edition',
}

export interface Shortcut extends BoundCommand {
    platform?: Platform;
    pattern: string;
}

export interface JWEditorConfig {
    plugins?: [typeof JWPlugin, JWPluginConfig?][];
    shortcuts?: Shortcut[];
    createBaseContainer?: () => VNode;
}
interface PluginMap extends Map<typeof JWPlugin, JWPlugin> {
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
    };
    vDocument: VDocument;
    selection = new VSelection();
    keymaps = {
        default: new Keymap(),
        user: new Keymap(),
    };
    _platform = navigator.platform.match(/Mac/) ? Platform.MAC : Platform.PC;
    renderers: Record<RenderingIdentifier, RenderingEngine> = {};
    parsers: Record<ParsingIdentifier, ParsingEngine> = {};

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
        this.loadPlugin(CorePlugin);
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

        // Load configured editor-level shortcuts.
        if (this.configuration.shortcuts) {
            for (const shortcut of this.configuration.shortcuts) {
                this._loadShortcut(shortcut, this.keymaps.user);
            }
        }

        const root = new FragmentNode();
        if (this._originalEditable.innerHTML !== '') {
            if (!this.parsers.dom) {
                // TODO: remove this when the editor can be instantiated on
                // something else than DOM.
                throw new Error(`No DOM parser installed.`);
            }
            const parsedEditable = await this.parsers.dom.parse(this._originalEditable);
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

        // Attach the keymaps to the editable.
        this.editable.addEventListener('keydown', this._onKeydown.bind(this));

        for (const plugin of this.plugins.values()) {
            await plugin.start();
        }

        // Init the event manager now that the cloned editable is in the DOM.
        const domPlugin = this.plugins.get(Dom) as Dom;
        this.eventManager = new EventManager(this, domPlugin);
    }

    async render<T>(renderingId: string, node: VNode): Promise<T | void> {
        const engine = this.renderers[renderingId];
        if (!engine) {
            // The caller might want to fallback on another rendering.
            return;
        }
        engine.renderings.clear();
        return engine.render(node) as Promise<T>;
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
    loadPlugin<T extends typeof JWPlugin>(Plugin: T, config?: ConstructorParameters<T>[1]): void {
        if (this._mode === Mode.EDITION) {
            throw new Error("You can't add plugin when the editor is already started");
        }
        const index = this.configuration.plugins.findIndex(([p]) => p === Plugin);
        if (index !== -1) {
            // Protect against loading the same plugin twice.
            this.configuration.plugins.splice(index, 1);
        }
        this.configuration.plugins.push([Plugin, config || {}]);
    }

    /**
     * Load the plugins specified in the editor configuration.
     *
     */
    private _loadPlugins(): void {
        // Resolve dependencies.
        const Plugins = this.configuration.plugins.slice();
        for (let offset = 1; offset <= Plugins.length; offset++) {
            const index = Plugins.length - offset;
            const [Plugin] = Plugins[index];
            for (const Dependency of Plugin.dependencies.slice().reverse()) {
                const depIndex = Plugins.findIndex(([p]) => p === Dependency);
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
            // register the shortcuts for this plugin.
            if (plugin.shortcuts) {
                for (const shortcut of plugin.shortcuts) {
                    this._loadShortcut(shortcut, this.keymaps.default);
                }
            }

            // Register the parsing functions of this plugin.
            this._addPluginParser(plugin);

            // Load rendering engines.
            if (plugin.renderingEngines) {
                for (const EngineClass of plugin.renderingEngines) {
                    const id = EngineClass.id;
                    if (this.renderers[id]) {
                        throw new Error(`Rendering engine ${id} already registered.`);
                    }
                    const engine = new EngineClass(this);
                    this.renderers[id] = engine;
                    // Register renderers from previously loaded plugins as that
                    // could not be done earlier without the rendering engine.
                    for (const plugin of this.plugins.values()) {
                        if (plugin.renderers) {
                            const renderers = [...plugin.renderers].reverse();
                            for (const RendererClass of renderers) {
                                if (RendererClass.id === id) {
                                    engine.register(RendererClass);
                                }
                            }
                        }
                    }
                }
            }

            // Load renderers.
            if (plugin.renderers) {
                const renderers = [...plugin.renderers].reverse();
                for (const RendererClass of renderers) {
                    const renderingEngine = this.renderers[RendererClass.id];
                    if (renderingEngine) {
                        renderingEngine.register(RendererClass);
                    }
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
            const conf = this.configuration.plugins.find(([p]) => p === Plugin);
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
            const configuration = { ...preconf, ...conf };
            // The `plugins` configuration key is an array so it needs to be
            // handled separately in order to properly merge it.
            if (conf.plugins) {
                configuration.plugins = [...preconf.plugins, ...conf.plugins];
            }
            this.configuration = configuration;
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

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _addPluginParser(plugin: JWPlugin): void {
        // Load parsing engines.
        if (plugin.parsingEngines) {
            for (const EngineClass of plugin.parsingEngines) {
                const id = EngineClass.id;
                if (this.parsers[id]) {
                    throw new Error(`Rendering engine ${id} already registered.`);
                }
                const engine = new EngineClass(this);
                this.parsers[id] = engine;
                // Register parsing from previously loaded plugins as that
                // could not be done earlier without the parsing engine.
                for (const plugin of this.plugins.values()) {
                    if (plugin.parsers) {
                        for (const ParserClass of plugin.parsers) {
                            if (ParserClass.id === id) {
                                engine.register(ParserClass);
                            }
                        }
                    }
                }
            }
        }
        // Load parsers.
        if (plugin.parsers) {
            for (const ParserClass of plugin.parsers) {
                const parsingEngine = this.parsers[ParserClass.id];
                if (parsingEngine) {
                    parsingEngine.register(ParserClass);
                }
            }
        }
    }

    /**
     * Load a shortcut in the keymap depending on the platform.
     *
     * - If the shortuct has no platform property; load the shortuct in both
     *   platform ('mac' and 'pc').
     * - If the shortuct has no platform property and the current platform is
     *   mac, modify the ctrl key to meta key.
     * - If the shortuct has a platform property, only load the shortcut for
     *   that platform.
     * - If no `mapping.commandId` is declared, it means removing the shortcut.
     *
     * @param shortcut The shortuct definition.
     * @param priority  The highest priority is the one that prevail.
     */
    _loadShortcut(shortcut: Shortcut, keymap: Keymap): void {
        if (!shortcut.platform || shortcut.platform === this._platform) {
            if (!shortcut.platform && this._platform === Platform.MAC) {
                shortcut.pattern = shortcut.pattern.replace(/ctrl/gi, 'CMD');
            }
            keymap.bindShortcut(shortcut.pattern, shortcut);
        }
    }

    /**
     * Listener added to the DOM that `execCommand` if a shortcut has been found
     * in one of the keymaps.
     *
     * @param event
     */
    _onKeydown(event: KeyboardEvent): void {
        let command: BoundCommand;
        let context: Context;
        const userCommands = this.keymaps.user.match(event);
        [command, context] = this.contextManager.match(userCommands);
        if (!command) {
            const defaultCommands = this.keymaps.default.match(event);
            [command, context] = this.contextManager.match(defaultCommands);
        }
        if (command && command.commandId) {
            const params = { context, ...command.commandArgs };
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            this.execCommand(command.commandId, params);
        }
    }
}

export default JWEditor;
