import { VNode } from '../../core/src/VNodes/VNode';
import { ParsingEngine, ParsingIdentifier, Parser, ParserConstructor } from './ParsingEngine';

export abstract class AbstractParser<T = {}> implements Parser<T> {
    static id: ParsingIdentifier;
    readonly predicate?: (item: T) => boolean;
    readonly engine: ParsingEngine<T>;
    constructor(engine: ParsingEngine<T>) {
        this.engine = engine;
    }
    /**
     * Parse the given node.
     *
     * @param node
     */
    abstract async parse(item: T): Promise<VNode[]>;
}

export interface AbstractParser<T = {}> {
    constructor: ParserConstructor<T>;
}
