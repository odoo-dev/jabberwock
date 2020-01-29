import { Dispatcher, CommandIdentifier, CommandArgs } from './Dispatcher';
import { JWPlugin } from './JWPlugin';
import { RenderManager } from './RenderManager';
import { VDocument } from './VDocument';
import { OwlUI } from '../../owl-ui/src/OwlUI';
import { CorePlugin } from './CorePlugin';
import { Parser } from './Parser';
import { DevTools } from '../../plugin-devtools/src/DevTools';

export interface JWEditorConfig {
    debug?: boolean;
    theme?: string;
    plugins?: Array<typeof JWPlugin>;
}

export class JWEditor {
    el: HTMLElement;
    _originalEditable: HTMLElement;
    dispatcher: Dispatcher;
    pluginsRegistry: JWPlugin[];
    vDocument: VDocument;
    debugger: OwlUI;
    parser = new Parser();
    renderManager = new RenderManager();

    constructor(editable?: HTMLElement) {
        this.el = document.createElement('jw-editor');
        // Semantic elements are inline by default.
        // We need to guarantee it's a block so it can contain other blocks.
        this.el.style.display = 'block';
        this.dispatcher = new Dispatcher(this);
        this.pluginsRegistry = [];

        if (!editable) {
            editable = document.createElement('jw-editable');
            // Semantic elements are inline by default.
            // We need to guarantee it's a block so it can contain other blocks.
            editable.style.display = 'block';
        }
        this._originalEditable = editable;
    }

    /**
     * Start the editor on the editable DOM node set on this editor instance.
     */
    async start(): Promise<void> {
        // Parse the editable in the internal format of the editor.
        this.vDocument = this.parser.parse(this._originalEditable);

        // The original editable node is hidden until the editor stops.
        this._originalEditable.style.display = 'none';

        // CorePlugin is a special mandatory plugin that handles the matching
        // between the core commands and the VDocument.
        this.addPlugin(CorePlugin);

        if (this.debugger) {
            await this.debugger.start();
        }

        this.dispatcher.commit();
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Add the given plugin class to this editor instance.
     *
     * @param pluginClass
     */
    addPlugin(pluginClass: typeof JWPlugin): void {
        const plugin: JWPlugin = new pluginClass(this);
        this.pluginsRegistry.push(plugin);
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
        // Register the parsing predicate of this plugin if it has any.
        Object.keys(pluginClass.renderingFunctions).forEach(rendererId => {
            this.renderManager.addRenderingFunction(
                rendererId,
                pluginClass.renderingFunctions[rendererId],
            );
        });
    }
    /**
     * Load the given config in this editor instance.
     *
     * @param config
     */
    loadConfig(config: JWEditorConfig): void {
        if (config.debug) {
            this.debugger = new OwlUI(this);
            this.debugger.addPlugin(DevTools);
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
        if (id === 'commit') {
            throw new Error(`Command "commit" can't be triggered by the plugins.`);
        }
        this.dispatcher.dispatch(id, args);
    }

    /**
     * Stop this editor instance.
     */
    stop(): void {
        this._originalEditable.id = this.editable.id;
        this._originalEditable.style.display = this.editable.style.display;
        this.el.remove();
    }
}

export default JWEditor;
