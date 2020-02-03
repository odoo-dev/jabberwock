import { VNode } from './VNodes/VNode';
import { Constructor } from '../../utils/src/utils';

export type ParsingIdentifier = string;

export interface Parser<T = {}> {
    predicate?: (item: T) => boolean;
    parse: (item: T) => Promise<VNode[]>;
}

export type ParserConstructor<T = {}> = Constructor<Parser<T>> & {
    id: ParsingIdentifier;
};

export class ParsingEngine<T = {}> {
    readonly id: ParsingIdentifier;
    readonly parsers: Parser<T>[] = [];
    readonly parsingMap = new Map<T, VNode[]>();

    constructor(identifier: string, DefaultParser: Constructor<Parser<T>>) {
        this.id = identifier;
        const defaultParser = new DefaultParser(this);
        if (defaultParser.predicate) {
            throw `Default renderer cannot have a predicate.`;
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
    register(ParserClass: Constructor<Parser<T>>): void {
        this.parsers.unshift(new ParserClass(this));
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
