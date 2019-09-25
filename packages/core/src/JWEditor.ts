import { Dispatcher, CommandIdentifier, CommandArgs } from './Dispatcher';
import { EventManager } from './EventManager';
import { JWPlugin } from './JWPlugin';
import { Renderer } from './Renderer';
import { VDocument } from './VDocument';
import { OwlUI } from '../../owl-ui/src/OwlUI';
import { CorePlugin } from './CorePlugin';
import { Parser } from './Parser';
import { DevTools } from '../../plugin-devtools/src/DevTools';
import { Memory } from './Memory/Memory';
import { makeVersionable } from './Memory/Versionable';

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
    memory: Memory;
    _memoryID: number;
    debugger: OwlUI;

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

    /**
     * Start the editor on the editable DOM node set on this editor instance.
     */
    async start(): Promise<void> {
        this.memory = new Memory();
        this._memoryID = 0;

        // Parse the editable in the internal format of the editor.
        const vDocument = Parser.parse(this._originalEditable);
        this.vDocument = makeVersionable(vDocument);
        this.memory.linkToMemory(this.vDocument);
        this.vDocument.root.next(vNode => {
            this.memory.linkToMemory(vNode);
            return false;
        });
        this.memory.linkToMemory(this.vDocument.range._tail);
        this.memory.linkToMemory(this.vDocument.range._head);

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

        // Init the event manager now that the cloned editable is in the DOM.
        this.eventManager = new EventManager(this);

        this.renderer.render(this.vDocument, this.editable);

        if (this.debugger) {
            await this.debugger.start();
        }
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
    }

    /**
     * Execute the given command.
     *
     * @param id name identifier of the command to execute
     * @param args arguments object of the command to execute
     */
    execCommand(id: CommandIdentifier, args?: CommandArgs): void {
        const oldMasterSliceKey = this._memoryID.toString();
        this._memoryID++;
        const newMasterSliceKey = this._memoryID.toString();
        const intermediateSliceKey = oldMasterSliceKey + '<>' + newMasterSliceKey;

        this.memory.create(newMasterSliceKey);
        this.memory.create(intermediateSliceKey).switchTo(intermediateSliceKey);
        this.origin.isMaster = false;

        // in dispatcher: eg:
        const winnerSliceKey = intermediateSliceKey + ':pluginA';
        this.memory.create(winnerSliceKey).switchTo(winnerSliceKey);

        this.dispatcher.dispatch(id, args);

        this.memory.snapshotIntoExistingSlice(winnerSliceKey, winnerSliceKey, newMasterSliceKey);
        this.memory.switchTo(newMasterSliceKey);

        this.renderer.render(this.vDocument, this.editable);
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
