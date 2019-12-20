import JWEditor from './JWEditor';
import { CommandIdentifier, CommandDefinition, CommandHandler } from './Dispatcher';
import { VNode } from './VNodes/VNode';
import { ParsingContext } from './Parser';
import { RenderingContext } from './Renderer';
import { RenderingEngineName, RenderingEngine } from './RenderingEngine';

export interface JWPluginConfig {
    name?: string;
}
export type ParsingContextHook = (context: ParsingContext) => ParsingContext;
export type RenderingContextHook = (context: RenderingContext) => RenderingContext;
export type ParsePredicate = (node: Node) => ParseMethod;
export type RenderPredicate = (node: VNode) => RenderMethod;
export type ParseMethod = (context: ParsingContext) => ParsingContext;
export type RenderMethod = (context: RenderingContext) => RenderingContext;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RenderingEngineRecord = Record<RenderingEngineName, RenderingEngine<any>>;

export class JWPlugin {
    static readonly nodes: Array<typeof VNode> = [];
    static readonly renderingEngines: RenderingEngineRecord;
    static getParser: ParsePredicate;
    static getRenderer: RenderPredicate;
    static parsingContextHook: ParsingContextHook;
    static renderingContextHook: RenderingContextHook;
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
