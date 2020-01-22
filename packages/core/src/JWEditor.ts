import { Dispatcher, CommandIdentifier, CommandArgs } from './Dispatcher';
import { EventManager } from './EventManager';
import { JWPlugin } from './JWPlugin';
import { Renderer } from './Renderer';
import { VDocument } from './VDocument';
import { CorePlugin } from './CorePlugin';
import { Parser } from './Parser';

export interface JWEditorConfig {
    autoFocus?: boolean;
    debug?: boolean;
    theme?: string;
    plugins?: Array<typeof JWPlugin>;
}

export class JWEditor {
    el: HTMLElement;
    _originalEditable: HTMLElement;
    editable: HTMLElement;
    dispatcher: Dispatcher;
    eventManager: EventManager;
    plugins: JWPlugin[];
    renderer: Renderer;
    vDocument: VDocument;
    autoFocus = false;
    parser = new Parser();

    constructor(editable?: HTMLElement) {
        this.el = document.createElement('jw-editor');
        // Semantic elements are inline by default.
        // We need to guarantee it's a block so it can contain other blocks.
        this.el.style.display = 'block';
        this.dispatcher = new Dispatcher(this);
        this.plugins = [];

        // Render the contents of `vDocument`
        this.renderer = new Renderer();

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
    }

    /**
     * Start the editor on the editable DOM node set on this editor instance.
     */
    async start(): Promise<void> {
        // Parse the editable in the internal format of the editor.
        this.vDocument = this.parser.parse(this._originalEditable);

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

        // CorePlugin is a special mandatory plugin that handles the matching
        // between the core commands and the VDocument.
        this.addPlugin(CorePlugin);

        for (const plugin of this.plugins) {
            await plugin.start();
        }

        // Init the event manager now that the cloned editable is in the DOM.
        this.eventManager = new EventManager(this);

        this.renderer.render(this.vDocument, this.editable);
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
            // Register the parsing functions of this plugin.
            if (pluginClass.parsingFunctions.length) {
                this.parser.addParsingFunction(...pluginClass.parsingFunctions);
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
    }

    /**
     * Execute the given command.
     *
     * @param id name identifier of the command to execute
     * @param args arguments object of the command to execute
     */
    execCommand(id: CommandIdentifier, args?: CommandArgs): void {
        this.dispatcher.dispatch(id, args);
        this.renderer.render(this.vDocument, this.editable);
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
}

export default JWEditor;
