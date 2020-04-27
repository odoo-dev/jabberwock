import { VNode } from '../../core/src/VNodes/VNode';
import { ParsingEngine, ParsingIdentifier, Parser, ParserConstructor } from './ParsingEngine';

export abstract class AbstractParser<T = {}> implements Parser<T> {
    static id: ParsingIdentifier;
    readonly engine: ParsingEngine<T>;
    constructor(engine: ParsingEngine<T>) {
        this.engine = engine;
    }
    predicate?: (item: T) => boolean;
    abstract async parse(item: T): Promise<VNode[]>;
}

export interface AbstractParser<T = {}> {
    constructor: ParserConstructor<T>;
}
