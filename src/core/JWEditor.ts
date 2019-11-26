import { CorePlugin } from './utils/CorePlugin';
import { Dispatcher, CommandIdentifier, CommandArgs } from './dispatcher/Dispatcher';
import { EventManager } from './utils/EventManager';
import { JWPlugin } from './JWPlugin';
import { VDocument } from './stores/VDocument';
import { Parser, ParsingOptions } from './utils/Parser';
import { Renderer } from './utils/Renderer';
import { OwlUI } from '../../src/ui/OwlUI';
import { DevTools } from '../../src/plugins/DevTools/DevTools';
import '../../src/plugins/DevTools/DevTools.css';

export interface JWEditorConfig {
    debug?: boolean;
    theme?: string;
}

export class JWEditor {
    el: HTMLElement;
    _originalEditable: HTMLElement;
    editable: HTMLElement;
    dispatcher: Dispatcher;
    eventManager: EventManager;
    pluginsRegistry: JWPlugin[];
    renderer: Renderer;
    vDocument: VDocument;

    constructor(editable?: HTMLElement) {
        this.el = document.createElement('jw-editor');
        // Semantic elements are inline by default.
        // We need to guarantee it's a block so it can contain other blocks.
        this.el.style.display = 'block';
        this.dispatcher = new Dispatcher(this);
        this.pluginsRegistry = [];

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

    start(parsingOptions?: ParsingOptions): void {
        // Deep clone the given editable node in order to break free of any
        // handler that might have been previously registered.
        this.editable = this._originalEditable.cloneNode(true) as HTMLElement;

        // Parse the editable in the internal format of the editor.
        this.vDocument = Parser.parse(this.editable, parsingOptions);

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

        // Init the event manager now that the cloned editable is in the DOM.
        this.eventManager = new EventManager(this);

        this.renderer.render(this.vDocument, this.editable);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

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
    }

    loadConfig(config: JWEditorConfig): void {
        if (config.debug) {
            new OwlUI(this).addPlugin(DevTools);
        }
    }

    execCommand(id: CommandIdentifier, args?: CommandArgs): void {
        this.dispatcher.dispatch(id, args);
        this.renderer.render(this.vDocument, this.editable);
    }

    stop(): void {
        this._originalEditable.id = this.editable.id;
        this._originalEditable.style.display = this.editable.style.display;
        this.el.remove();
    }
}

export default JWEditor;
