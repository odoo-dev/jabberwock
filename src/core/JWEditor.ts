import { CorePlugin } from './utils/CorePlugin';
import { Dispatcher } from './dispatcher/Dispatcher';
import { EventManager } from './utils/EventManager';
import { JWPlugin } from './JWPlugin';
import { VDocument } from './stores/VDocument';
import { Parser } from './utils/Parser';
import { Renderer } from './utils/Renderer';
import { OwlUI } from '../../src/ui/OwlUI';
import { DevTools } from '../../src/plugins/DevTools/DevTools';
import '../../src/plugins/DevTools/DevTools.css';
import { ActionGenerator } from './actions/ActionGenerator';

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
        this.dispatcher = new Dispatcher(this);
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

        // Parse the editable in the internal format of the editor.
        this.vDocument = Parser.parse(this.editable);

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

        // Add the CorePlugin
        // CorePlugin is a special mandatory plugin. It's the plugin that will
        // handle matching between the actions and the DOM. We want it to be a
        // plugin because it needs to behave like one. In other words it must
        // listen to Actions and react to them within the dispatching loop,
        // thereby giving a chance to other plugins to react as well.
        // Given its specificity, it requires that we pass it the editor
        // instance so we instantiate it here to pass that through the
        // constructor.
        // TODO: when the memory slice system is introduced, this special case
        // will not be required anymore.
        const corePlugin = new CorePlugin(this);
        this._registerPlugin(corePlugin);

        // Init the event manager now that the cloned editable is in the DOM.
        this.eventManager = new EventManager(this.editable, {
            dispatch: this.dispatcher.dispatch.bind(this.dispatcher),
            callback: (): void => {
                // Re-render when events are fired.
                this.renderer.render(this.vDocument, this.editable);
                // Notify plugins that a render has been trigerred.
                const render = ActionGenerator.intent({
                    name: 'render',
                    origin: 'Editor',
                });
                this.dispatcher.dispatch(render);
            },
        });

        // Render the contents of `vDocument`
        this.renderer = new Renderer();
        this.renderer.render(this.vDocument, this.editable);
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    addPlugin(pluginClass: typeof JWPlugin): void {
        const pluginInstance: JWPlugin = new pluginClass(this.dispatcher);
        this._registerPlugin(pluginInstance);
    }

    loadConfig(config: JWEditorConfig): void {
        if (config.debug) {
            new OwlUI(this).addPlugin(DevTools);
        }
    }

    stop(): void {
        this._originalEditable.id = this.editable.id;
        this._originalEditable.style.display = this.editable.style.display;
        this.el.remove();
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    _registerPlugin(plugin: JWPlugin): void {
        this.pluginsRegistry.push(plugin); // todo: use state
        this.dispatcher.register(plugin.handlers, plugin.commands);
    }
}

export default JWEditor;
