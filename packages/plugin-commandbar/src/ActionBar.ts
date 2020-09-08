import { JWPluginConfig, JWPlugin } from '../../core/src/JWPlugin';
import { Parser } from '../../plugin-parser/src/Parser';
import { Loadables } from '../../core/src/JWEditor';
import { Renderer } from '../../plugin-renderer/src/Renderer';
import { InsertTextParams } from '../../plugin-char/src/Char';
import { CharNode } from '../../plugin-char/src/CharNode';
import { VNode } from '../../core/src/VNodes/VNode';
import JWEditor from '../../core/src/JWEditor';
import { ReactiveValue } from '../../utils/src/ReactiveValue';
import { ActionBarXmlDomParser } from './ActionBarXmlDomParser';
import { ActionBarDomObjectRenderer } from './ActionBarDomObjectRenderer';
import { CommandParams } from '../../core/src/Dispatcher';
import { setSelection } from '../../utils/src/testUtils';

export interface ActionItem {
    name: string;
}

interface CommandBarConfig extends JWPluginConfig {
    //     /**
    //      * Take a function that will receive a filtering term and should return true
    //      * if it has at least one match.
    //      */
    //     filter: (term: string) => boolean;
    //     /**
    //      * Callback to be executed to open the external command bar.
    //      */
    //     open: () => void;
    //     /**
    //      * Callback to be executed to close the external command bar.
    //      */
    //     close: () => void;
    actions?: ActionItem[];
}
// export class Color<T extends ColorConfig = ColorConfig> extends JWPlugin<T> {

export class ActionBar<T extends CommandBarConfig = CommandBarConfig> extends JWPlugin<T> {
    // static dependencies = [Inline];
    readonly loadables: Loadables<Parser & Renderer> = {
        parsers: [ActionBarXmlDomParser],
        renderers: [ActionBarDomObjectRenderer],
    };
    commands = {
        // insertText: {
        //     handler: this.insertText,
        // },
    };
    commandHooks = {
        insertText: this._insertText.bind(this),
        deleteWord: this._check.bind(this),
        deleteBackward: this._check.bind(this),
        deleteForward: this._check.bind(this),
        setSelection: this._check.bind(this),
    };
    availableActions = new ReactiveValue<ActionItem[]>([]);
    private _opened = false;
    private _actions: T['actions'];

    constructor(public editor: JWEditor, public configuration: Partial<T> = {}) {
        super(editor, configuration);
        if (!configuration.actions) {
            throw new Error(
                'Impossible to load the ActionBar without actions in the configuration.',
            );
        }
        this._actions = configuration.actions;
    }

    _insertText(params: InsertTextParams): void {
        if (this._opened) {
            this._check(params);
        } else {
            const range = params.context.range;
            const beforeStart = range.start.previousSibling();
            const isSlash = beforeStart instanceof CharNode && beforeStart.char === '/';
            // If there is no previous sibling before start, it means beforeStart is
            // the first node of the container.
            if (range.isCollapsed() && isSlash && !beforeStart.previousSibling()) {
                this._opened = true;
                this.availableActions.set(this._actions);
            }
        }
    }

    private _check(params: CommandParams): void {
        console.warn('check');
        const range = this.editor.selection.range;
        const chars: string[] = [];
        let node: VNode = range.end;
        while ((node = node.previousSibling())) {
            if (node instanceof CharNode) chars.unshift(node.char);
        }
        const term = chars.slice(1).join('');

        const actions = this._actions.filter(a => a.name.startsWith(term));

        if (!actions.length) {
            this.close();
            console.log('close');
        } else {
            this.availableActions.set(actions);
        }
    }

    close(): void {
        this._opened = false;
        this.availableActions.set([]);
    }
    // _openCommandBar(): void {
    //     this._opened = true;
    // }
}
