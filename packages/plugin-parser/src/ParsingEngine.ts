import JWEditor from '../../core/src/JWEditor';
import { VNode } from '../../core/src/VNodes/VNode';

export type ParsingIdentifier = string;

export interface Parser<T = {}> {
    predicate?: (item: T) => boolean;
    parse: (item: T) => Promise<VNode[]>;
    constructor: ParserConstructor<T>;
}
export type ParserConstructor<T = {}> = {
    new (engine: ParsingEngine): Parser<T>;
    id: ParsingIdentifier;
};

export class ParsingEngine<T = {}> {
    static readonly id: ParsingIdentifier;
    static readonly extends: ParsingIdentifier[] = [];
    static readonly defaultParser: ParserConstructor;
    readonly editor: JWEditor;
    readonly parsers: Parser<T>[] = [];
    readonly parsingMap = new Map<T, VNode[]>();

    constructor(editor: JWEditor) {
        this.editor = editor;
        const defaultParser = new this.constructor.defaultParser(this);
        if (defaultParser.predicate) {
            throw new Error(`Default renderer cannot have a predicate.`);
        } else {
            this.parsers.push(defaultParser);
        }
    }

    //--------------------------------------------------------------------------
    // Public
    //--------------------------------------------------------------------------

    /**
     * Register the given parser by instantiating it with this parser engine.
     *
     * @param ParserClass
     */
    register(ParserClass: ParserConstructor<T>): void {
        if (ParserClass.id === this.constructor.id) {
            this.parsers.unshift(new ParserClass(this));
        } else {
            const supportedTypes = [this.constructor.id, ...this.constructor.extends];
            const priorParserIds = supportedTypes.slice(0, supportedTypes.indexOf(ParserClass.id));
            const postParserIndex = this.parsers.findIndex(
                parser => !priorParserIds.includes(parser.constructor.id),
            );
            this.parsers.splice(postParserIndex, 0, new ParserClass(this));
        }
    }
    /**
     * Parse items into the editor's virtual `VNode` representation.
     *
     * @param items the items to parse
     * @returns Promise resolved by the element parsed into the editor virtual
     * VNode representation
     */
    async parse(...items: T[]): Promise<VNode[]> {
        const nodes: VNode[] = [];
        const childPromises = items.map(node => this._parseItem(node));
        const resList = await Promise.all(childPromises);
        for (const res of resList) {
            nodes.push(...res);
        }
        return nodes;
    }

    //--------------------------------------------------------------------------
    // Private
    //--------------------------------------------------------------------------

    /**
     * Parse an item into the editor's virtual representation.
     *
     */
    async _parseItem(item: T): Promise<VNode[]> {
        let nodes: VNode[];
        for (const parser of this.parsers) {
            if (!parser.predicate || parser.predicate(item)) {
                nodes = await parser.parse(item);
                break;
            }
        }
        if (nodes.length >= 1) {
            this.parsingMap.set(item, nodes);
        }
        return nodes;
    }
}
export type ParsingEngineConstructor<T = {}> = {
    new (...args: ConstructorParameters<typeof ParsingEngine>): ParsingEngine;
    id: ParsingIdentifier;
    extends: ParsingIdentifier[];
    defaultParser: ParserConstructor<T>;
};
export interface ParsingEngine<T = {}> {
    constructor: ParsingEngineConstructor;
}
