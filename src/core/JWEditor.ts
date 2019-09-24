import { Action } from './types/Flux';
import { CorePlugin } from './utils/CorePlugin';
import { Dispatcher } from './dispatcher/Dispatcher';
import { EventManager } from './utils/EventManager';
import { JWPlugin } from './JWPlugin';
import { VDocument } from './stores/VDocument';

export interface JWEditorConfig {
    theme: string;
}

export class JWEditor {
    el: HTMLElement;
    _originalEditable: HTMLElement;
    editable: HTMLElement;
    dispatcher: Dispatcher;
    eventManager: EventManager;
    pluginsRegistry: JWPlugin[];
    vDocument: VDocument;

    constructor(editable?: HTMLElement) {
        this.el = document.createElement('jw-editor');
        this.pluginsRegistry = [];

        if (!editable) {
            editable = document.createElement('jw-editable');
        }
        this._originalEditable = editable;

        // The editable property of the editor is the original editable element
        // before start is called, and becomes the clone after start is called.
        this.editable = editable;
    }

    start(): void {
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

        // Parse the editable in the internal format of the editor.
        this.vDocument = new VDocument(this.editable);
        this.dispatcher = new Dispatcher(this.el, this.vDocument);

        const corePlugin = new CorePlugin(this.dispatcher, this.vDocument, this.editable);
        this._addPluginInstance(corePlugin); // CorePlugin is a mandatory plugin

        // Init the event manager now that the cloned editable is in the DOM.
        this.eventManager = new EventManager(this.editable, {
            dispatch: (action: Action): void => {
                this.dispatcher.dispatch(action);
            },
        });
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    addPlugin(pluginClass: typeof JWPlugin): void {
        const pluginInstance: JWPlugin = new pluginClass(this.dispatcher);
        this._addPluginInstance(pluginInstance);
    }

    loadConfig(config: JWEditorConfig): void {
        // TODO
        config;
    }

    stop(): void {
        this._originalEditable.id = this.editable.id;
        this._originalEditable.style.display = this.editable.style.display;
        this.el.remove();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _addPluginInstance(pluginInstance: JWPlugin): void {
        this.pluginsRegistry.push(pluginInstance); // todo: use state
        this.dispatcher.registerFromPlugin(
            pluginInstance.actions,
            pluginInstance.intents,
            pluginInstance.commands,
        );
    }
}

export default JWEditor;
