import { BoundCommand, Keymap } from './Keymap';
import { Dispatcher, CommandIdentifier } from './Dispatcher';
import { EventManager } from './EventManager';
import { JWPlugin } from './JWPlugin';
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
import { Constructor, MagicConstructor } from '../../utils/src/utils';
import { Char } from '../../plugin-char/Char';

// type PluginConfig<P extends JWPlugin, T extends typeof JWPlugin>

class A {
    constructor(s: string, config: { a: number }) {}
}
class B extends A {
    constructor(s: string, config: { a: number; b: string }) {
        super(s, config);
        console.log(config.b);
    }
}
class C extends A {
    constructor(s: string, config: { a: number; c: string }) {
        super(s, config);
        console.log(config.c);
    }
}

// type Config<P extends typeof A> = [P, ConstructorParameters<P>[1]];

// const x: Config<typeof B> = [B];

type Config<P extends typeof A = typeof A> = P extends new (...args) => any
    ? [P, ConstructorParameters<P>]
    : never;
type ConfigTuple<T = [any, any] | [any]> = T extends [infer P, {}]
    ? P extends typeof A
        ? [P, ConstructorParameters<P>]
        : never
    : [typeof A];

type ConfigFuck<T = [any, any] | [any]> = T extends [infer P, {}]
    ? P extends typeof A
        ? [P, ConstructorParameters<P>]
        : never
    : [typeof A];

const x: ConfigTuple = [A];
const y: ConfigTuple<typeof B> = [B, {}];

function check<P extends typeof A, C extends ConstructorParameters<P>[1]>(p: P, c: C): [P, C] {
    return [p, c];
}

const b: Array<[typeof A, ConstructorParameters<typeof A>[1]]> = [check(A, {}), check(B, {})];

const k = b[1][1];
const v = new b[1][0]('', b[1][1]);

const a: Array<[typeof A, ConstructorParameters<typeof A>]> = [check(A, {}), check(B, {})];

type TaMaman<
    P extends typeof A = typeof A,
    C extends ConstructorParameters<P> = ConstructorParameters<P>
> = [P, C];

export type ValuesOf<T extends any[]> = T[number];

type Magic<F extends any[]> = F &
    {
        [I in number]: F[I] extends [infer X, any]
            ? X extends new (...args: infer K) => any
                ? [X, K[1]]
                : never
            : Function;
    };
// const z: Magic<typeof A> = [[A, {}], [B, {}]];

a;
x;
y;
z;

// function configure<P extends typeof A>(config: {
//     plugins: Magic<Array<[P, {}]>
// }): void {
//     for (const [x, y] of config.plugins) {
//         new x('', y);
//     }
// }

// configure({
//     plugins: [[A, {}], [B, {}]],
// });

// type MagicFuck<U, V, W, X, Y, Z> =
//     | [Fucker<U>]
//     | [Fucker<U>, Fucker<V>]
//     | [Fucker<U>, Fucker<V>, Fucker<W>]
//     | [Fucker<U>, Fucker<V>, Fucker<W>, Fucker<X>]
//     | [Fucker<U>, Fucker<V>, Fucker<W>, Fucker<X>, Fucker<Y>]
//     | [Fucker<U>, Fucker<V>, Fucker<W>, Fucker<X>, Fucker<Y>, Fucker<Z>];

// // const z: MagicFuck<typeof A, typeof B, typeof C> = [[A, {}], [B, {}], [C, {}]];

// function configureFuck<U, V, W, X, Y, Z>(config: { plugins: MagicFuck<U, V, W, X, Y, Z> }): void {
//     for (const [x, y] of config.plugins) {
//         new x('', y);
//     }
// }

// configureFuck({
//     plugins: [[B, {}], [A, { a: 42 }], [C, { a: 42, c: '' }]],
// });

type PluginConfiguration<T> = T extends typeof A
    ? [T, ConstructorParameters<T>[1] & ConstructorParameters<typeof A>[1]]
    : [typeof A, ConstructorParameters<typeof A>[1]];

type PluginsConfig<U, V, W> = Array<[typeof A, ConstructorParameters<typeof A>[1]]> & {
    0?: PluginConfiguration<U>;
    1?: PluginConfiguration<V>;
    2?: PluginConfiguration<W>;
};

function configure<U, V, W>(config: { plugins: PluginsConfig<U, V, W> }): void {
    for (const [x, y] of config.plugins) {
        new x('', y);
    }
}

configure({
    plugins: [[B, {}], [A, {}], [C, {}]],
});

type MagicBrol<F extends any[] = Array<[typeof A, {}]>> = {
    0?: F[0] extends [infer X, any]
        ? X extends new (...args: infer K) => any
            ? [X, K[1]]
            : never
        : Function;
    1?: F[1] extends [infer X, any]
        ? X extends new (...args: infer K) => any
            ? [X, K[1]]
            : never
        : Function;
    2?: F[2] extends [infer X, any]
        ? X extends new (...args: infer K) => any
            ? [X, K[1]]
            : never
        : Function;
};

function configureBrol<P extends typeof A>(config: {
    plugins: MagicBrol;
}): void {
    for (const [x, y] of config.plugins) {
        new x('', y);
    }
}

configureBrol({
    plugins: [[B, {}], [A, {}], [C, {}]],
});

// function configure<P extends typeof A, C extends ConstructorParameters<P>[1]>(config: {
//     plugins: Array<[P, C]>;
// }): void {
//     for (const [x, y] of config.plugins) {
//         new x('', y);
//     }
// }

// configure({
//     plugins: [[A, {}], [B, {}]],
// });

// type PluginConfig<
//     P extends typeof JWPlugin,
//     C extends new () => P = new () => P,
//     M extends MagicConstructor<P, C> = MagicConstructor<P, C>
// > = [C, ConstructorParameters<C>[0]];

// const x: PluginConfig<Char> = [Char];
// x;

// type PluginConfigs<P extends Constructor<JWPlugin> = Constructor<JWPlugin>> = PluginConfig<P>[];
// type PluginConfig<T extends typeof JWPlugin> = [T, ConstructorParameters<T>[1]];

// type PluginConfigs<P extends Array<Constructor<JWPlugin>> = Array<Constructor<JWPlugin>>> = {
//     [I in keyof P]: P[I] extends Constructor<JWPlugin> ? [P[I], ConstructorParameters<P[I]>[1]]: never;
// };

const plugins: PluginConfigs = [
    [Char],
    [77777, {}],
    [Char, {}],
    [Char, { template: 'rr' as string }],
    [Char, { template: 'template' as string, num: 5 }],
    // [Brol, {
    //     option: 2,
    //     mode: 'coucou',
    //     template: template as string,
    // }],
    // [OtherBrol],
    // [OwlLayout2, { template: template as string }],
    // OtherBrol,
    // [OwlLayout3, { template: template as string }],
];
console.log(plugins);

type Commands<T extends JWPlugin> = T['commands'];
type CommandParams<T extends JWPlugin, K extends keyof Commands<T>> = Parameters<
    Commands<T>[K]['handler']
>[0];

function execCommand<T extends JWPlugin, K extends keyof Commands<T> = keyof Commands<T>>(
    commandName: K,
    params: CommandParams<T, K>,
): void {
    commandName;
    params;
}

execCommand<Char>('insertText', { text: 'd' });

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
interface PluginMap extends Map<Constructor<JWPlugin>, JWPlugin> {
    get<T extends JWPlugin>(constructor: Constructor<T>): T;
}

export class JWEditor {
    el: HTMLElement;
    _originalEditable: HTMLElement;
    editable: HTMLElement;
    dispatcher: Dispatcher;
    eventManager: EventManager;
    contextManager: ContextManager;
    plugins: PluginMap;
    vDocument: VDocument;
    selection = new VSelection();
    autoFocus = false;
    keymaps = {
        default: new Keymap(),
        user: new Keymap(),
    };
    _platform = navigator.platform.match(/Mac/) ? Platform.MAC : Platform.PC;
    renderers: Record<RenderingIdentifier, RenderingEngine> = {};
    parsers: Record<ParsingIdentifier, ParsingEngine> = {};
    createBaseContainer: () => VNode = () => new VElement('P');

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

        if (this.autoFocus && (!this.selection.anchor.parent || !this.selection.focus.parent)) {
            this.selection.setAt(this.vDocument.root);
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
            if (this.plugins.get(Plugin)) {
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
            this.plugins.set(pluginClass, plugin);
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
                const renderers = plugin.renderers.slice().reverse();
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
