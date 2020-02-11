import { BoundCommand, Keymap } from './Keymap';
import { Dispatcher, CommandIdentifier, CommandArgs } from './Dispatcher';
import { EventManager } from './EventManager';
import { JWPlugin } from './JWPlugin';
import { VDocument } from './VDocument';
import { CorePlugin } from './CorePlugin';
import { VNode } from './VNodes/VNode';
import { RenderingEngine, RenderingIdentifier } from './RenderingEngine';
import { VElement } from './VNodes/VElement';

export type ExecCommandHook = (command: string, args: CommandArgs) => void;
import { ParsingIdentifier, ParsingEngine } from './ParsingEngine';
import { Dom } from '../../plugin-dom/Dom';
import { FragmentNode } from './VNodes/FragmentNode';

export enum Platform {
    MAC = 'mac',
    PC = 'pc',
}

export interface Shortcut extends BoundCommand {
    platform?: Platform;
    pattern: string;
}

export interface JWEditorConfig {
    autoFocus?: boolean;
    debug?: boolean;
    theme?: string;
    plugins?: Array<typeof JWPlugin>;
    shortcuts?: Shortcut[];
    createBaseContainer?: () => VNode;
}

export class JWEditor {
    el: HTMLElement;
    _originalEditable: HTMLElement;
    editable: HTMLElement;
    dispatcher: Dispatcher;
    eventManager: EventManager;
    plugins: JWPlugin[];
    vDocument: VDocument;
    autoFocus = false;
    keymaps = {
        default: new Keymap(),
        user: new Keymap(),
    };
    _platform = navigator.platform.match(/Mac/) ? Platform.MAC : Platform.PC;
    execCommandHooks: ExecCommandHook[] = [];
    renderers: Record<RenderingIdentifier, RenderingEngine> = {};
    parsers: Record<ParsingIdentifier, ParsingEngine> = {};
    createBaseContainer: () => VNode = () => new VElement('P');

    constructor(editable?: HTMLElement) {
        this.el = document.createElement('jw-editor');
        // Semantic elements are inline by default.
        // We need to guarantee it's a block so it can contain other blocks.
        this.el.style.display = 'block';
        this.dispatcher = new Dispatcher(this);
        this.plugins = [];

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
        this.addPlugin(CorePlugin);
    }

    /**
     * Start the editor on the editable DOM node set on this editor instance.
     */
    async start(): Promise<void> {
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

        if (
            this.autoFocus &&
            (!this.vDocument.selection.anchor.parent || !this.vDocument.selection.focus.parent)
        ) {
            this.vDocument.selection.setAt(this.vDocument.root);
        }

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

        for (const plugin of this.plugins) {
            await plugin.start();
        }

        // Init the event manager now that the cloned editable is in the DOM.
        const domPlugin = this.plugins.find(plugin => plugin instanceof Dom) as Dom;
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
     * Load the given plugin into this editor instance.
     *
     * @param Plugin
     */
    addPlugin(Plugin: typeof JWPlugin): void {
        // Resolve dependencies.
        const pluginsToLoad = [Plugin];
        let offset = 1;
        while (offset <= pluginsToLoad.length) {
            const Plugin = pluginsToLoad[pluginsToLoad.length - offset];
            if (this.plugins.find(plugin => plugin instanceof Plugin)) {
                // Protect against loading the same plugin twice.
                pluginsToLoad.splice(pluginsToLoad.length - offset, 1);
            } else {
                // Add new dependencies to check.
                for (const dependency of Plugin.dependencies) {
                    if (!pluginsToLoad.includes(dependency)) {
                        pluginsToLoad.unshift(dependency);
                    }
                }
                offset++;
            }
        }

        // Load plugins.
        for (const pluginClass of pluginsToLoad) {
            const plugin: JWPlugin = new pluginClass(this);
            this.plugins.push(plugin);
            // Register the commands of this plugin.
            Object.keys(plugin.commands).forEach(key => {
                this.dispatcher.registerCommand(key, plugin.commands[key]);
            });
            // Register the hooks of this plugin.
            Object.keys(plugin.commandHooks).forEach(key => {
                this.dispatcher.registerHook(key, plugin.commandHooks[key]);
            });
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
                    for (const plugin of this.plugins) {
                        if (plugin.renderers) {
                            for (const RendererClass of plugin.renderers) {
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
                for (const RendererClass of plugin.renderers) {
                    const renderingEngine = this.renderers[RendererClass.id];
                    if (renderingEngine) {
                        renderingEngine.register(RendererClass);
                    }
                }
            }
        }
    }

    /**
     * Load the given config in this editor instance.
     *
     * @param config
     */
    loadConfig(config: JWEditorConfig): void {
        if (config.autoFocus) {
            this.autoFocus = config.autoFocus;
        }
        if (config.plugins) {
            config.plugins.forEach(pluginClass => this.addPlugin(pluginClass));
        }
        if (config.shortcuts) {
            for (const shortcut of config.shortcuts) {
                this._loadShortcut(shortcut, this.keymaps.user);
            }
        }
        if (config.createBaseContainer) {
            this.createBaseContainer = config.createBaseContainer;
        }
    }

    /**
     * Register a callback that will be executed for each `execCommand` call.
     *
     * @param hook The function that will be executed.
     */
    registerExecCommandHook(hook: ExecCommandHook): void {
        this.execCommandHooks.push(hook);
    }

    /**
     * Execute the given command.
     *
     * @param id name identifier of the command to execute
     * @param args arguments object of the command to execute
     */
    async execCommand(id: CommandIdentifier, args?: CommandArgs): Promise<void> {
        await this.dispatcher.dispatch(id, args);

        for (const hookCallback of this.execCommandHooks) {
            await hookCallback(id, args);
        }
    }

    /**
     * Stop this editor instance.
     */
    async stop(): Promise<void> {
        for (const plugin of this.plugins) {
            await plugin.stop();
        }
        this._originalEditable.id = this.editable.id;
        this._originalEditable.style.display = this.editable.style.display;
        this.el.remove();
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
                for (const plugin of this.plugins) {
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
            keymap.bindShortcut(shortcut.pattern, shortcut.commandId, shortcut.commandArgs);
        }
    }

    /**
     * Listener added to the DOM that `execCommand` if a shortcut has been found
     * in one of the keymaps.
     *
     * @param event
     */
    _onKeydown(event: KeyboardEvent): void {
        const commandUser = this.keymaps.user.match(event);
        const commandDefault = !commandUser && this.keymaps.default.match(event);
        const command = commandUser || commandDefault;
        if (command && command.commandId) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            this.execCommand(command.commandId, command.commandArgs);
        }
    }
}

export default JWEditor;
