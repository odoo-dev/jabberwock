import JWEditor from './JWEditor';
import { CommandIdentifier, CommandDefinition, CommandHandler } from './Dispatcher';
import { VNode } from './VNodes/VNode';
import { HTMLRendering } from './BasicHtmlRenderingEngine';
import { ParsingContext } from './Parser';

export interface JWPluginConfig {
    name?: string;
}
export type ParsePredicate = (node: Node) => ParseMethod;
export type RenderPredicate = (node: VNode) => RenderMethod;
export type ParseMethod = (context: ParsingContext) => ParsingContext;
export type ParsingContextHook = (context: ParsingContext) => ParsingContext;
// TODO: make render method generic
export type RenderMethod = (node: VNode) => HTMLRendering;

export class JWPlugin {
    static readonly nodes: Array<typeof VNode> = [];
    static getParser: ParsePredicate;
    static getRenderer: RenderPredicate;
    static parsingContextHook: ParsingContextHook;
    name: string;
    editor: JWEditor;
    commands: Record<CommandIdentifier, CommandDefinition> = {};
    commandHooks: Record<CommandIdentifier, CommandHandler> = {};

    constructor(editor: JWEditor, options: JWPluginConfig = {}) {
        this.editor = editor;
        // by default the name is that of its constructor (eg.: 'JWPlugin')
        // todo: namespace
        this.name = options.name || this.constructor.name;
    }
    static parse: ParseMethod;
    static render: RenderMethod;
}
